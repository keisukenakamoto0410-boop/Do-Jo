import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { existsSync } from "fs";

// Supported video file types
const SUPPORTED_VIDEO_TYPES = [".mp4", ".mov", ".avi", ".webm"];
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB in bytes

/**
 * Validate video file type
 */
export function isValidVideoType(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return SUPPORTED_VIDEO_TYPES.includes(ext);
}

/**
 * Validate video file size
 */
export function isValidVideoSize(size: number, maxSizeMB: number = 500): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}

/**
 * Generate unique video filename
 */
export function generateUniqueVideoFilename(originalName: string): string {
  // Sanitize filename
  const sanitizedName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_");

  // Get file extension
  const ext = sanitizedName.substring(sanitizedName.lastIndexOf("."));
  const baseName = sanitizedName.substring(0, sanitizedName.lastIndexOf("."));

  // Generate unique filename with timestamp and random string
  const timestamp = Date.now();
  const randomString = randomBytes(8).toString("hex");

  return `${baseName}_${timestamp}_${randomString}${ext}`;
}

/**
 * Ensure upload directory exists
 */
export async function ensureVideoUploadDir(): Promise<string> {
  const uploadDir = join(process.cwd(), "public", "uploads", "videos");

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  return uploadDir;
}

/**
 * Upload video file to local storage
 * For MVP - saves to public/uploads/videos/
 * TODO: Implement S3 upload for production
 */
export async function uploadVideo(
  file: File,
  interviewId: string
): Promise<{
  filename: string;
  filepath: string;
  url: string;
  size: number;
}> {
  // Validate file type
  if (!isValidVideoType(file.name)) {
    throw new Error(
      `サポートされていないファイル形式です。対応形式: ${SUPPORTED_VIDEO_TYPES.join(
        ", "
      )}`
    );
  }

  // Validate file size
  if (!isValidVideoSize(file.size)) {
    throw new Error(`ファイルサイズが大きすぎます。最大サイズ: 500MB`);
  }

  // Ensure directory exists
  const uploadDir = await ensureVideoUploadDir();

  // Generate unique filename
  const filename = generateUniqueVideoFilename(file.name);
  const filepath = join(uploadDir, filename);

  // Convert file to buffer and save
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  return {
    filename,
    filepath,
    url: `/uploads/videos/${filename}`,
    size: file.size,
  };
}

/**
 * Get video file information
 */
export async function getVideoInfo(videoUrl: string): Promise<{
  exists: boolean;
  size?: number;
  filename?: string;
}> {
  try {
    const filename = videoUrl.split("/").pop();
    if (!filename) {
      return { exists: false };
    }

    const filepath = join(
      process.cwd(),
      "public",
      "uploads",
      "videos",
      filename
    );

    if (existsSync(filepath)) {
      const fs = await import("fs");
      const stats = fs.statSync(filepath);
      return {
        exists: true,
        size: stats.size,
        filename,
      };
    }

    return { exists: false };
  } catch (error) {
    return { exists: false };
  }
}

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Calculate upload progress percentage
 */
export function calculateProgress(loaded: number, total: number): number {
  return Math.round((loaded / total) * 100);
}

// For future S3 implementation
export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

/**
 * Upload video to S3 (for production)
 * TODO: Implement with AWS SDK
 */
export async function uploadVideoToS3(
  file: File,
  interviewId: string,
  config: S3Config
): Promise<{ url: string; key: string }> {
  throw new Error("S3 upload not implemented yet. Use local storage for MVP.");

  // Implementation will be:
  // 1. Initialize S3 client
  // 2. Generate unique S3 key
  // 3. Upload file with multipart upload
  // 4. Return S3 URL
}
