import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Typography,
} from "@mui/material";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { addFileInfo, storage } from "../services/firebase";
import { getAnalysis } from "../services/openai";
import { FileInfo, User } from "../types";

interface FileUploadProps {
  onFileUploaded: (fileInfo: FileInfo) => void;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  user: User;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  else return (bytes / 1073741824).toFixed(1) + " GB";
};

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  setIsLoading,
  setError,
  user,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [isPickerActive, setIsPickerActive] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user) {
        setError("Please sign in to upload files.");
        return;
      }

      const validFiles = acceptedFiles.filter(
        (file) => file.size <= MAX_FILE_SIZE
      );

      if (validFiles.length === 0) {
        setError(
          "No valid files were uploaded. Please check file size limits."
        );
        return;
      }

      setUploading(true);
      setIsLoading(true);
      setError(null);

      for (const file of validFiles) {
        try {
          const storageRef = ref(
            storage,
            `users/${user.uid}/pdfs/${file.name}`
          );
          const uploadTask = uploadBytesResumable(storageRef, file);

          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
              const fileInfo: FileInfo = {
                id: file.name,
                name: file.name,
                url: "",
                analysis: "",
                uploadDate: new Date().toISOString(),
                size: formatFileSize(file.size),
                uploadProgress: progress,
                status: "uploading",
              };
              onFileUploaded(fileInfo);
            },
            (error) => {
              console.error("Error uploading file:", error);
              setError("File upload failed. Please try again.");
            },
            async () => {
              let fileInfo: FileInfo;
              try {
                const downloadURL = await getDownloadURL(
                  uploadTask.snapshot.ref
                );
                setAnalyzing(true);

                fileInfo = {
                  id: file.name,
                  name: file.name,
                  url: downloadURL,
                  analysis: "",
                  uploadDate: new Date().toISOString(),
                  size: formatFileSize(file.size),
                  uploadProgress: 100,
                  status: "analyzing",
                };

                await addFileInfo(user.uid, fileInfo);
                onFileUploaded(fileInfo);

                const analysis = await getAnalysis(
                  `users/${user.uid}/pdfs/${file.name}`
                );

                const updatedFileInfo: FileInfo = {
                  ...fileInfo,
                  analysis: analysis,
                  status: "completed" as "completed",
                };

                await addFileInfo(user.uid, updatedFileInfo);
                onFileUploaded(updatedFileInfo);
              } catch (error) {
                console.error("Error analyzing file:", error);
                setError("File analysis failed. Please try again.");

                const failedFileInfo: FileInfo = {
                  ...fileInfo!,
                  analysis: {
                    summary: "Analysis failed",
                    keywords: [],
                    categories: [],
                    tags: [],
                    keyInsights: [],
                    toneAndStyle: "",
                    targetAudience: "",
                    potentialApplications: [],
                  },
                  status: "failed" as "failed",
                };

                await addFileInfo(user.uid, failedFileInfo);
                onFileUploaded(failedFileInfo);
              } finally {
                setAnalyzing(false);
                setUploading(false);
                setIsLoading(false);
              }
            }
          );
        } catch (error) {
          console.error("Error initiating file upload:", error);
          setError("Failed to initiate file upload. Please try again.");
          setUploading(false);
          setIsLoading(false);
        }
      }
    },
    [user, onFileUploaded, setIsLoading, setError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    useFsAccessApi: false,
  });

  const handleButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isPickerActive) {
      setIsPickerActive(true);
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/pdf";
      input.multiple = true;
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          onDrop(Array.from(files));
        }
        setIsPickerActive(false);
      };
      input.click();
    }
  };

  if (!user) {
    return <Typography>Please sign in to upload files.</Typography>;
  }

  return (
    <Box>
      <Box
        {...getRootProps()}
        sx={{
          border: "2px dashed #cccccc",
          borderRadius: 2,
          p: 3,
          textAlign: "center",
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "#f0f0f0",
          },
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Box>
            <Typography>Uploading files...</Typography>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <Box key={fileName} sx={{ width: "100%", mt: 2 }}>
                <Typography variant="body2">{fileName}</Typography>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            ))}
          </Box>
        ) : analyzing ? (
          <Box>
            <Typography>Analyzing files...</Typography>
            <CircularProgress sx={{ mt: 2 }} />
          </Box>
        ) : isDragActive ? (
          <Typography>Drop the files here</Typography>
        ) : (
          <>
            <Typography>
              Drag and drop PDF files here or click to select
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleButtonClick}
              sx={{ mt: 2 }}
              aria-label="파일 선택"
            >
              Select Files
            </Button>
          </>
        )}
      </Box>
      <Alert severity="info" sx={{ mt: 2 }}>
        As an MVP, we currently support PDF uploads only. You can upload up to
        10 PDF files simultaneously, with each file not exceeding 10MB in size.
      </Alert>
    </Box>
  );
};

export default FileUpload;
