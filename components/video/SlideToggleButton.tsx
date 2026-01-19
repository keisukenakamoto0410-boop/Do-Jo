"use client";

interface SlideToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  language?: "en" | "ja";
}

export default function SlideToggleButton({
  isOpen,
  onToggle,
  language = "en",
}: SlideToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
        isOpen
          ? "bg-gray-700 text-white hover:bg-gray-600"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {isOpen ? (
        <>
          <span>✕</span>
          <span>{language === "en" ? "Close Slides" : "スライドを閉じる"}</span>
        </>
      ) : (
        <>
          <span>📖</span>
          <span>{language === "en" ? "Open Slides" : "スライドを開く"}</span>
        </>
      )}
    </button>
  );
}
