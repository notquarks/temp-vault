import { eq, lt } from "drizzle-orm";
import { db } from "./db";
import { filelist } from "../db/schema";
import { s3 } from "./s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function cleanupOldFiles() {
  console.log("[CLEANUP TASK] Checking for files older than 30 days...");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const oldFiles = await db
      .select()
      .from(filelist)
      .where(lt(filelist.createdAt, thirtyDaysAgo));

    if (oldFiles.length === 0) {
      console.log("[CLEANUP TASK] No old files to delete.");
      return;
    }

    let deletedCount = 0;
    for (const file of oldFiles) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKETNAME || "",
            Key: file.id,
          }),
        );

        await db.delete(filelist).where(eq(filelist.id, file.id));

        deletedCount++;
        console.log(`[CLEANUP TASK] Deleted expired file: ${file.id}`);
      } catch (err) {
        console.error(`[CLEANUP TASK] Failed to delete file ${file.id}:`, err);
      }
    }
    console.log(
      `[CLEANUP TASK] Successfully removed ${deletedCount} expired files.`,
    );
  } catch (err) {
    console.error("[CLEANUP TASK] Job failed:", err);
  }
}

export function startCleanupCron() {
  cleanupOldFiles();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  setInterval(cleanupOldFiles, ONE_DAY);
}
