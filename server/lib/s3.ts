import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

let _s3: S3Client;

const s3 = new Proxy({} as S3Client, {
  get(_, prop) {
    if (!_s3) {
      _s3 = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.CLOUDFLARE_ACC_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: `${process.env.CLOUDFLARE_ACCESS_KEY_ID}`,
          secretAccessKey: `${process.env.CLOUDFLARE_SECRET_ACCESS_KEY}`,
        },
      });
    }
    const value = _s3[prop as keyof S3Client];
    return typeof value === "function" ? value.bind(_s3) : value;
  },
});

export { s3 };
