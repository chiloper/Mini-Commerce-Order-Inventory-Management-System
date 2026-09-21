"use client";

import React, { useState } from "react";
import { uploadMultipleImages } from "../../lib/cloudinary";

interface ImageGalleryUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  onError: (msg: string) => void;
}

export default function ImageGalleryUploader({
  images,
  onChange,
  onError,
}: ImageGalleryUploaderProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleMultipleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadStatus(`กำลังเตรียมอัปโหลด ${files.length} รูปภาพ...`);

    const { urls, errors } = await uploadMultipleImages(files, (done, total) => {
      setUploadStatus(`กำลังอัปโหลดรูปภาพ (${done}/${total})...`);
    });

    if (urls.length > 0) {
      onChange([...images, ...urls]);
      setUploadStatus(`✓ อัปโหลดสำเร็จ ${urls.length} รูป!`);
    }
    if (errors.length > 0) {
      onError(errors.join("; "));
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleSetMain = (idx: number) => {
    if (idx === 0) return;
    const selected = images[idx];
    const remaining = images.filter((_, i) => i !== idx);
    onChange([selected, ...remaining]);
  };

  const handleRemove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const handleAddUrl = () => {
    if (inputUrl.trim()) {
      onChange([...images, inputUrl.trim()]);
      setInputUrl("");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-xs font-bold text-neutral-800">
          แกลเลอรีรูปภาพสินค้า ({images.length} รูป)
        </label>
        <span className="text-[11px] text-neutral-600 font-medium">
          *รูปแรกสุดคือรูปหลัก (คลิกรูปใดก็ได้เพื่อเปลี่ยนเป็นรูปหลัก)
        </span>
      </div>

      <div className="p-3 rounded-xl border border-dashed border-divider bg-bg flex flex-col gap-2.5">
        {/* Thumbnails list */}
        {images.length > 0 ? (
          <div className="flex gap-2.5 flex-wrap items-center">
            {images.map((imgUrl, idx) => {
              const isMain = idx === 0;
              return (
                <div
                  key={idx}
                  onClick={() => !isMain && handleSetMain(idx)}
                  className={`relative w-18 h-18 rounded-xl overflow-hidden shrink-0 bg-surface group transition-all select-none ${
                    isMain
                      ? "ring-2 ring-accent shadow-sm"
                      : "border border-divider hover:ring-2 hover:ring-accent/70 hover:shadow-xs cursor-pointer"
                  }`}
                  title={isMain ? "รูปหลัก (Cover Image)" : "คลิกเพื่อเลือกรูปนี้เป็นรูปหลัก"}
                >
                  <img
                    src={imgUrl}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isMain ? (
                    <span className="absolute bottom-0 inset-x-0 bg-accent text-white text-[9px] text-center font-bold py-0.5 shadow-2xs flex items-center justify-center gap-0.5">
                      <span>⭐</span>
                      <span>รูปหลัก</span>
                    </span>
                  ) : (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity p-1 text-center">
                      <span>ตั้งเป็นรูปหลัก</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(idx);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/75 text-white text-[10px] flex items-center justify-center cursor-pointer hover:bg-rose-600 transition-colors z-10 shadow-xs"
                    title="ลบรูปนี้"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-3 text-xs text-neutral-600 font-medium">
            ยังไม่มีรูปภาพในแกลเลอรี (สามารถเลือกหลายไฟล์ได้พร้อมกัน)
          </div>
        )}

        {/* Actions: Multi-file select and URL input */}
        <div className="flex gap-2 flex-wrap items-center">
          <label className="px-3 py-1.5 rounded-lg border border-divider bg-surface hover:bg-bg text-xs font-bold text-text cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors">
            <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>{uploading ? "กำลังอัปโหลด..." : "+ เลือกรูปภาพ (หลายรูปได้)"}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={handleMultipleFiles}
            />
          </label>

          {images.length > 0 && (
            <button
              type="button"
              className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
              onClick={() => {
                onChange([]);
                setUploadStatus("");
              }}
            >
              ลบทั้งหมด
            </button>
          )}
        </div>

        {/* Add by URL */}
        <div className="flex gap-1.5 items-center">
          <input
            className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-divider bg-surface text-text outline-none focus:border-accent placeholder:text-neutral-500 font-medium"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="หรือวาง URL รูปภาพ (https://...)"
          />
          <button
            type="button"
            className="px-3 py-1 text-xs font-bold rounded-lg border border-divider bg-surface hover:bg-bg text-text cursor-pointer transition-colors shadow-2xs"
            onClick={handleAddUrl}
          >
            + เพิ่ม
          </button>
        </div>

        {uploadStatus && (
          <span className={`text-[11px] font-semibold ${uploadStatus.includes("✓") ? "text-emerald-700" : "text-rose-700"}`}>
            {uploadStatus}
          </span>
        )}
      </div>
    </div>
  );
}
