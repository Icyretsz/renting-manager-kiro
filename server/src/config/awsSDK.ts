import { S3Client } from "@aws-sdk/client-s3";

const SDKClientConfig: any = {
  region: "ap-southeast-1",
};

// Only use manual credentials in dev
if (process.env["NODE_ENV"] === "development") {
  SDKClientConfig.credentials = {
    accessKeyId: process.env["AWS_ACCESS_KEY"]!,
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"]!,
  };
}

export const s3Client = new S3Client(SDKClientConfig);
