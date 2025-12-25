import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const minioClient = new S3Client({
  region: "ap-southeast-1",
  endpoint: "http://localhost:9000",
  credentials: {
    accessKeyId: "rentflow",
    secretAccessKey: "rentflow123",
  },
  forcePathStyle: true,
});

export async function uploadFile(
  file: Buffer | File,
  fileName: string,
  contentType: string,
  bucketName: string
) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: file,
    ContentType: contentType,
  });

  await minioClient.send(command);
  return fileName;
}

export async function deleteFile(objectKey: string, bucketName: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  await minioClient.send(command);
}

export async function generateSignedUrl(
  objectKey: string,
  bucketName: string,
  expiresIn = 3600
) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  const url = await getSignedUrl(minioClient, command, { expiresIn });
  return url;
}
