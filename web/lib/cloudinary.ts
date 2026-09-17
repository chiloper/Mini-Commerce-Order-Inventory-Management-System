/**
 * Cloudinary Direct Unsigned Upload Utility
 */

export interface CloudinaryUploadResult {
  ok: boolean;
  url?: string;
  error?: string;
  isCloudinary?: boolean;
}

/**
 * Resizes and compresses an image to Base64 (Local Fallback)
 */
export function compressImageFallback(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } else {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = () => reject(new Error("เกิดข้อผิดพลาดในการอ่านไฟล์ภาพ"));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image file directly to Cloudinary using an Unsigned Upload Preset.
 * If Cloudinary environment variables are not yet configured, gracefully falls back
 * to local compression so that testing is never blocked.
 */
export async function uploadImage(file: File): Promise<CloudinaryUploadResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (.jpg, .png, .webp)" };
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  // If Cloudinary is not configured yet, use local fallback
  if (!cloudName || !uploadPreset) {
    try {
      const fallbackUrl = await compressImageFallback(file);
      return {
        ok: true,
        url: fallbackUrl,
        isCloudinary: false,
      };
    } catch (err: any) {
      return { ok: false, error: err?.message || "ไม่สามารถประมวลผลรูปภาพได้" };
    }
  }

  // Upload to Cloudinary Unsigned Upload Endpoint
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error?.message || "อัปโหลดภาพขึ้น Cloudinary ไม่สำเร็จ";
      return { ok: false, error: `Cloudinary Error: ${errMsg}` };
    }

    return {
      ok: true,
      url: data.secure_url,
      isCloudinary: true,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: `ไม่สามารถเชื่อมต่อ Cloudinary ได้: ${err?.message || "Network Error"}`,
    };
  }
}

/**
 * Upload multiple image files sequentially or concurrently
 */
export async function uploadMultipleImages(
  files: FileList | File[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ urls: string[]; errors: string[] }> {
  const fileArray = Array.from(files);
  const urls: string[] = [];
  const errors: string[] = [];
  let completed = 0;

  for (const file of fileArray) {
    const res = await uploadImage(file);
    if (res.ok && res.url) {
      urls.push(res.url);
    } else {
      errors.push(`${file.name}: ${res.error || "อัปโหลดไม่สำเร็จ"}`);
    }
    completed++;
    onProgress?.(completed, fileArray.length);
  }

  return { urls, errors };
}

