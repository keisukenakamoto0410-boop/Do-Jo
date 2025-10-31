"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { formatFileSize } from "@/lib/upload-helpers";

interface VideoUploaderProps {
  interviewId: string;
  onUploadSuccess: (videoUrl: string) => void;
  onUploadError: (error: string) => void;
}

export default function VideoUploader({
  interviewId,
  onUploadSuccess,
  onUploadError,
}: VideoUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUPPORTED_FORMATS = [".mp4", ".mov", ".avi", ".webm"];
  const MAX_SIZE_MB = 500;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    // Check file type
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    if (!SUPPORTED_FORMATS.includes(ext)) {
      return `サポートされていないファイル形式です。対応形式: ${SUPPORTED_FORMATS.join(
        ", "
      )}`;
    }

    // Check file size
    if (file.size > MAX_SIZE_BYTES) {
      return `ファイルサイズが大きすぎます。最大サイズ: ${MAX_SIZE_MB}MB`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    setValidationError("");

    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setValidationError("ファイルを選択してください");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("video", selectedFile);

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle completion
      await new Promise((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(xhr.statusText));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("ネットワークエラーが発生しました"));
        });

        xhr.open("POST", `/api/interview/${interviewId}/upload-video`);
        xhr.send(formData);
      });

      const response = JSON.parse(xhr.responseText);

      if (response.success) {
        onUploadSuccess(response.video.url);
      } else {
        throw new Error(response.error || "アップロードに失敗しました");
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "アップロードに失敗しました";
      onUploadError(errorMessage);
      setValidationError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setValidationError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        // Upload area
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-primary-500 bg-primary-50"
              : "border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50"
          }`}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_FORMATS.join(",")}
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="text-6xl mb-4">🎥</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            面接動画をアップロード
          </h3>
          <p className="text-gray-600 mb-4">
            ドラッグ＆ドロップまたはクリックしてファイルを選択
          </p>
          <div className="text-sm text-gray-500">
            <p>対応形式: {SUPPORTED_FORMATS.join(", ")}</p>
            <p>最大サイズ: {MAX_SIZE_MB}MB</p>
          </div>

          {validationError && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {validationError}
            </div>
          )}
        </div>
      ) : (
        // Preview and upload
        <div className="space-y-6">
          {/* Video Preview */}
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              src={previewUrl || ""}
              controls
              className="w-full max-h-96 object-contain"
            >
              お使いのブラウザは動画の再生に対応していません。
            </video>
          </div>

          {/* File Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {!isUploading && (
                <button
                  onClick={handleCancel}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  キャンセル
                </button>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">アップロード中...</span>
                  <span className="text-sm font-medium text-primary-600">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {validationError && !isUploading && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {validationError}
              </div>
            )}
          </div>

          {/* Upload Button */}
          {!isUploading && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                別のファイルを選択
              </button>
              <button
                onClick={handleUpload}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                アップロードを完了
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
