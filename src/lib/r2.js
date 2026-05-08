import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;
const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL;

const s3Client = new S3Client({
  region: "auto",
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

export const uploadToR2 = async (file) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Browser එකට වඩාත්ම ගැළපෙන Blob එකක් විදිහට යවමු
  const body = new Blob([await file.arrayBuffer()], { type: file.type });

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: body,
    ContentType: file.type,
  });

  try {
    await s3Client.send(command);
    return `${publicUrl}/${fileName}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw error;
  }
};
