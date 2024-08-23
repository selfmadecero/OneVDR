export const uploadFile = async (file: File) => {
  console.log('File uploaded:', file.name);
  // 여기에 실제 파일 업로드 로직을 구현합니다.
};

export const getDocuments = async () => {
  // 임시로 더미 데이터를 반환합니다.
  return [
    { name: 'Document 1', uploadDate: new Date().toISOString() },
    { name: 'Document 2', uploadDate: new Date().toISOString() },
  ];
};
