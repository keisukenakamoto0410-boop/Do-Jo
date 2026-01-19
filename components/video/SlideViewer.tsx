"use client";

import { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface SlideViewerProps {
  topic: string;
  isHost: boolean;
  reservationId: string;
  currentSlide: number;
  onSlideChange?: (slideIndex: number) => void;
  totalSlides?: number;
}

export default function SlideViewer({
  topic,
  isHost,
  reservationId,
  currentSlide,
  onSlideChange,
  totalSlides = 3,
}: SlideViewerProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [slides, setSlides] = useState<string[]>([]);

  // スライド画像パスを生成
  useEffect(() => {
    const slideImages = Array.from({ length: totalSlides }, (_, i) =>
      `/slides/${topic}/${i + 1}.png`
    );
    setSlides(slideImages);
  }, [topic, totalSlides]);

  // 外部からのスライド変更を反映（ホスト側で同期を受ける場合）
  useEffect(() => {
    if (swiperRef.current && swiperRef.current.activeIndex !== currentSlide - 1) {
      swiperRef.current.slideTo(currentSlide - 1);
    }
  }, [currentSlide]);

  const handleSlideChange = (swiper: SwiperType) => {
    // 学習者のみスライド変更を通知
    if (!isHost && onSlideChange) {
      onSlideChange(swiper.activeIndex + 1);
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={handleSlideChange}
        modules={[Navigation, Pagination]}
        navigation={!isHost}
        pagination={{ clickable: !isHost }}
        allowTouchMove={!isHost}
        initialSlide={currentSlide - 1}
        className="w-full h-full slide-viewer-swiper"
      >
        {slides.map((slideUrl, index) => (
          <SwiperSlide key={index}>
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <img
                src={slideUrl}
                alt={`Slide ${index + 1}`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  // プレースホルダー表示
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    const placeholder = document.createElement("div");
                    placeholder.className = "flex flex-col items-center justify-center text-gray-400";
                    placeholder.innerHTML = `
                      <div class="text-6xl mb-4">📷</div>
                      <p class="text-lg">Slide ${index + 1}</p>
                      <p class="text-sm text-gray-500 mt-2">${topic}</p>
                    `;
                    parent.appendChild(placeholder);
                  }
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* ページインジケーター（カスタム） */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isHost && swiperRef.current) {
                swiperRef.current.slideTo(index);
              }
            }}
            disabled={isHost}
            className={`w-3 h-3 rounded-full transition-all ${
              currentSlide === index + 1
                ? "bg-blue-500 scale-125"
                : "bg-gray-500 hover:bg-gray-400"
            } ${isHost ? "cursor-default" : "cursor-pointer"}`}
          />
        ))}
      </div>

      {/* スライド番号表示 */}
      <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-lg text-white text-sm z-10">
        {currentSlide} / {totalSlides}
      </div>

      {/* ホスト向けメッセージ */}
      {isHost && (
        <div className="absolute top-4 left-4 bg-orange-500/80 px-3 py-1 rounded-lg text-white text-xs z-10">
          学習者がスライドを操作中
        </div>
      )}

      {/* スタイル */}
      <style jsx global>{`
        .slide-viewer-swiper {
          --swiper-navigation-color: #fff;
          --swiper-pagination-color: #3b82f6;
        }
        .slide-viewer-swiper .swiper-button-next,
        .slide-viewer-swiper .swiper-button-prev {
          background: rgba(0, 0, 0, 0.5);
          padding: 30px;
          border-radius: 8px;
        }
        .slide-viewer-swiper .swiper-button-next:after,
        .slide-viewer-swiper .swiper-button-prev:after {
          font-size: 20px;
        }
      `}</style>
    </div>
  );
}
