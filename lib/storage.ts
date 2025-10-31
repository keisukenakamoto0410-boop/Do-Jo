import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "resumes");

// Ensure upload directory exists
export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Generate unique filename
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = randomBytes(8).toString("hex");
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");

  return `${sanitizedName}_${timestamp}_${randomString}${ext}`;
}

// Upload file to local storage
export async function uploadFile(
  file: File,
  userId: string
): Promise<{ filename: string; filepath: string; url: string }> {
  await ensureUploadDir();

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = generateUniqueFilename(file.name);
  const filepath = path.join(UPLOAD_DIR, filename);

  await writeFile(filepath, buffer);

  // Return public URL
  const url = `/uploads/resumes/${filename}`;

  return { filename, filepath, url };
}

// Delete file from local storage
export async function deleteFile(filename: string): Promise<void> {
  const filepath = path.join(UPLOAD_DIR, filename);

  if (existsSync(filepath)) {
    await unlink(filepath);
  }
}

// Validate file type
export function isValidFileType(filename: string): boolean {
  const allowedExtensions = [".pdf", ".docx", ".doc"];
  const ext = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(ext);
}

// Validate file size (in bytes)
export function isValidFileSize(size: number, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}

// Get file extension
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Extract filename from URL
export function extractFilenameFromUrl(url: string): string {
  return path.basename(url);
}

// S3 upload helper (for future implementation)
export async function uploadToS3(
  file: File,
  userId: string
): Promise<{ filename: string; url: string }> {
  // TODO: Implement S3 upload when ready
  // For now, use local storage
  const result = await uploadFile(file, userId);
  return { filename: result.filename, url: result.url };
}

// Generate signed URL for S3 (for future implementation)
export async function generateSignedUrl(key: string): Promise<string> {
  // TODO: Implement S3 signed URL generation
  // For now, return the public URL
  return `/uploads/resumes/${key}`;
}
