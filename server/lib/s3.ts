import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACC_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: `${process.env.CLOUDFLARE_ACCESS_KEY_ID}`,
    secretAccessKey: `${process.env.CLOUDFLARE_SECRET_ACCESS_KEY}`,
  },
});

export { s3 };
