import * as functions from "firebase-functions";
import { PDFExtract } from "pdf.js-extract";
import { analyzeTextWithOpenAI } from "../openai";
import * as admin from "firebase-admin";

interface AnalysisResult {
  summary: string;
  keywords: Array<{ word: string; explanation: string }>;
  categories: string[];
  tags: string[];
  keyInsights: string[];
  toneAndStyle: string;
  targetAudience: string;
  potentialApplications: string[];
}

export async function extractTextFromPDF(file: any): Promise<string> {
  const [fileContents] = await file.download();
  const pdfExtract = new PDFExtract();
  const data = await pdfExtract.extractBuffer(fileContents);
  return data.pages.map((page) => page.content).join(" ");
}

export async function analyzePDFCommon(
  file: any,
  fileName: string,
  userId: string
): Promise<AnalysisResult> {
  try {
    const text = await extractTextFromPDF(file);
    const analysis = await analyzeTextWithOpenAI(text, fileName);

    await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("files")
      .doc(fileName)
      .set(
        {
          analysis,
          analysisTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return analysis;
  } catch (error) {
    console.error("Error analyzing PDF:", error);
    if (error instanceof Error) {
      throw new functions.https.HttpsError(
        "internal",
        `Error analyzing PDF: ${error.message}`
      );
    } else {
      throw new functions.https.HttpsError(
        "internal",
        "Unknown error occurred while analyzing PDF"
      );
    }
  }
}

export const analyzePDF = functions.storage
  .object()
  .onFinalize(async (object) => {
    if (!object.name) {
      console.error("File path is undefined");
      return null;
    }

    const filePath = object.name;
    const userId = filePath.split("/")[1];
    const bucket = admin.storage().bucket(object.bucket);
    const file = bucket.file(filePath);

    await analyzePDFCommon(
      file,
      object.name.split("/").pop() || "Unknown",
      userId
    );
    return null;
  });
