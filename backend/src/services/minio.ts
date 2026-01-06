import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

if (!process.env.S3_BUCKET) {
  throw new Error("S3_BUCKET is not defined");
}

import { env } from "@/config/env";

export const minioClient = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_ENDPOINT!,

  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },

  forcePathStyle: true,
});

export async function uploadFile(
  file: Buffer,
  objectKey: string,
  contentType: string,
) {
  await minioClient.send(
    new PutObjectCommand({
      Bucket: env.BUCKET,
      Key: objectKey,
      Body: file,
      ContentType: contentType,
    }),
  );

  return objectKey;
}

export async function deleteFile(objectKey: string) {
  await minioClient.send(
    new DeleteObjectCommand({
      Bucket: env.BUCKET,
      Key: objectKey,
    }),
  );
}

export async function generateSignedUrl(
  objectKey: string,
  expiresIn: number | string = 3600,
) {
  const expireSeconds =
    typeof expiresIn === "string" ? Number(expiresIn) : expiresIn;

  return getSignedUrl(
    minioClient,
    new GetObjectCommand({
      Bucket: env.BUCKET,
      Key: objectKey,
    }),
    {
      expiresIn: expireSeconds,
    },
  );
}
