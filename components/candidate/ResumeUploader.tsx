"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";

interface ResumeUploaderProps {
  onUploadSuccess: () => void;
}

export default function ResumeUploader({ onUploadSuccess }: ResumeUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];
  const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc"];

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
      return "PDF、DOCXファイルのみアップロード可能です";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `ファイルサイズが大きすぎます（最大5MB、現在: ${(file.size / 1024 / 1024).toFixed(2)}MB）`;
    }

    return null;
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError("");
    setSuccess("");

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccess("");

    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "アップロードに失敗しました");
      }

      setSuccess("履歴書が正常にアップロードされました");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Call success callback
      setTimeout(() => {
        onUploadSuccess();
        setSuccess("");
        setUploadProgress(0);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError("");
    setSuccess("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 hover:border-primary-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileSelect}
          className="hidden"
          id="resume-upload"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center space-y-4">
          <div className="text-5xl">📄</div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              ファイルをドラッグ＆ドロップ
            </p>
            <p className="text-sm text-gray-500 mt-1">または</p>
          </div>
          <label
            htmlFor="resume-upload"
            className="cursor-pointer bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors inline-block"
          >
            ファイルを選択
          </label>
          <p className="text-xs text-gray-500">
            PDF、DOCX形式（最大5MB）
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* File Preview */}
      {selectedFile && !success && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">📄</div>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!isUploading && (
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>アップロード中...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {!isUploading && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              アップロード
            </button>
          )}
        </div>
      )}
    </div>
  );
}
