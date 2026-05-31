import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

if (!process.env.R2_ACCOUNT_ID) {
  throw new Error("R2_ACCOUNT_ID is not defined");
}

import { env } from "@/config/env";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,

  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },

  forcePathStyle: false,
});

export async function uploadFile(
  file: Buffer,
  objectKey: string,
  contentType: string,
) {
  await r2Client.send(
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
  await r2Client.send(
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
    r2Client,
    new GetObjectCommand({
      Bucket: env.BUCKET,
      Key: objectKey,
    }),
    {
      expiresIn: expireSeconds,
    },
  );
}

export async function moveTempFileToPermanent(oldKey: string, newKey: string) {
  try {
    await r2Client.send(
      new CopyObjectCommand({
        Bucket: env.BUCKET,
        CopySource: `${env.BUCKET}/${oldKey}`,
        Key: newKey,
      }),
    );

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: env.BUCKET,
        Key: oldKey,
      }),
    );

    return newKey;
  } catch (error) {
    console.error("Error moving file in R2:", error);
    throw new Error("ไม่สามารถย้ายไฟล์รูปภาพได้");
  }
}

export async function getBucketSize(): Promise<{
  totalSizeBytes: number;
  totalFiles: number;
}> {
  try {
    let totalSizeBytes = 0;
    let totalFiles = 0;
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;

    while (isTruncated) {
      const response: ListObjectsV2CommandOutput = await r2Client.send(
        new ListObjectsV2Command({
          Bucket: env.BUCKET,
          ContinuationToken: continuationToken,
        }),
      );

      if (response.Contents) {
        for (const object of response.Contents) {
          totalSizeBytes += object.Size || 0;
          totalFiles++;
        }
      }

      isTruncated = response.IsTruncated || false;
      continuationToken = response.NextContinuationToken;
    }

    return {
      totalSizeBytes,
      totalFiles,
    };
  } catch (error) {
    console.error("Error fetching R2 bucket size:", error);

    return {
      totalSizeBytes: 0,
      totalFiles: 0,
    };
  }
}
