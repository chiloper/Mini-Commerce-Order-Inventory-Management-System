"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProductById,
  getProducts,
  addToCart,
} from "../../../lib/ecommerce-actions";
import type { Product } from "@/types/ecommerce";

function ProductDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const skuParam = searchParams.get("sku");

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setSelectedImage(null);
      setImageError(false);
      if (idParam) {
        const p = await getProductById(Number(idParam));
        setProduct(p);
      } else {
        const all = await getProducts();
        if (skuParam) {
          const match = all.find((x) => x.sku === skuParam);
          setProduct(match || all[0] || null);
        } else {
          setProduct(all[0] || null);
        }
      }
      setLoading(false);
    }
    load();
  }, [idParam, skuParam]);

  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-neutral-600">
        กำลังโหลดข้อมูลสินค้า...
      </div>
    );
  }

  if (!product || product.isActive === false) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 border border-divider">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
        </div>
        <p className="text-lg font-bold text-text mb-1">
          {product?.isActive === false ? "สินค้านี้ถูกเก็บถาวรแล้ว (Archived)" : "ไม่พบสินค้านี้"}
        </p>
        <p className="text-xs text-neutral-600 mb-6">
          {product?.isActive === false
            ? "สินค้ารายการนี้ถูกจัดเก็บออกจากระบบหน้าร้าน และไม่พร้อมจำหน่ายในขณะนี้"
            : "ไม่พบสินค้าที่คุณค้นหา หรือสินค้านี้อาจถูกลบออกจากระบบแล้ว"}
        </p>
        <Link
          href="/list"
          className="inline-block px-5 py-2.5 rounded-xl text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-2xs"
        >
          กลับไปหน้ารายการสินค้า
        </Link>
      </div>
    );
  }

  const stock = product.stock || 0;
  const soldOut = stock === 0;
  const addLabel = soldOut ? "สินค้าหมดชั่วคราว" : "ใส่ตะกร้า";

  const imagesList: string[] =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.imageUrl
      ? [product.imageUrl]
      : [];
  const activeImage = selectedImage || imagesList[0] || null;

  const handleAdd = async () => {
    if (soldOut) return;
    setAdding(true);
    await addToCart(product.id, qty);
    window.dispatchEvent(new Event("cart-updated"));
    window.dispatchEvent(new Event("open-cart"));
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (soldOut || !product || buying) return;
    setBuying(true);
    await addToCart(product.id, qty);
    window.dispatchEvent(new Event("cart-updated"));
    router.push("/checkout");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      {/* Breadcrumbs (NN/g: Clear Navigation Context) */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-700 font-medium flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-accent transition-colors">
          หน้าแรก
        </Link>
        <span>/</span>
        <Link href="/list" className="hover:text-accent transition-colors">
          สินค้าทั้งหมด
        </Link>
        {product.catagory?.name && (
          <>
            <span>/</span>
            <span className="text-neutral-800">{product.catagory.name}</span>
          </>
        )}
        <span>/</span>
        <span className="text-text font-bold truncate max-w-[240px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left column: Gallery & Shot (6 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="relative aspect-[4/3] w-full bg-neutral-200 rounded-2xl overflow-hidden shadow-xs border border-divider flex items-center justify-center group">
            {activeImage && !imageError ? (
              <img
                src={activeImage}
                alt={product.name}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100/80 p-6 text-center select-none">
                <svg className="w-12 h-12 mb-2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs tracking-widest uppercase font-mono text-neutral-700 font-bold">
                  {product.name}
                </span>
                <span className="text-[11px] font-mono text-neutral-600 mt-1">
                  SKU: {product.sku}
                </span>
              </div>
            )}

            {/* Badges on main image */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
              {soldOut ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 !text-white shadow-xs">
                  สินค้าหมด
                </span>
              ) : stock <= 10 ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-neutral-950 shadow-xs border border-amber-500">
                  เหลือ {stock} ชิ้นสุดท้าย
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 !text-white shadow-xs">
                  พร้อมส่ง
                </span>
              )}
            </div>
          </div>

          {/* Interactive Thumbnails */}
          {imagesList.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
              {imagesList.map((imgUrl, idx) => {
                const isSelected = activeImage === imgUrl && !imageError;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImage(imgUrl);
                      setImageError(false);
                    }}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? "border-2 border-accent scale-95"
                        : "border border-divider hover:opacity-80"
                    }`}
                    title={`ดูภาพที่ ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Details, Urgency, CTAs, Trust (6 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Title & Metadata */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-accent-900 bg-accent-100 border border-accent-200 px-2.5 py-0.5 rounded font-bold">
                {product.sku}
              </span>
              <span className="text-xs text-neutral-800 font-semibold">
                {product.catagory?.name || "สินค้าทั่วไป"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text leading-snug">
              {product.name}
            </h1>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-text">
                {formatPrice(product.price)}
              </span>
              <span className="text-xs text-neutral-700 font-medium">รวมภาษีมูลค่าเพิ่มแล้ว</span>
            </div>
          </div>

          {/* Urgency Stock Banner (Harmonious with web theme) */}
          {stock > 0 && stock <= 10 && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>สินค้าใกล้หมด! เหลือเพียง {stock} ชิ้นสุดท้ายในสต็อก รีบสั่งซื้อก่อนสินค้าหมด</span>
            </div>
          )}
          {stock === 0 && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface border border-divider text-neutral-700 text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-neutral-400 shrink-0" />
              <span>ขณะนี้สินค้าหมดชั่วคราว อยู่ระหว่างการเติมสต็อกสินค้า</span>
            </div>
          )}

          {/* Description summary */}
          <div className="text-sm leading-relaxed text-neutral-800 bg-surface p-4 rounded-xl border border-divider">
            {product.description || "สินค้าคุณภาพมาตรฐาน บรรจุและจัดส่งอย่างปลอดภัย รับประกันความพึงพอใจ"}
          </div>

          {/* Quantity Selector & Action CTAs (Fitts's Law) */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-neutral-800">จำนวน:</span>
              <div className="inline-flex items-center border border-divider rounded-xl bg-surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={soldOut || qty <= 1}
                  className="w-10 h-10 flex items-center justify-center text-base font-bold text-text hover:bg-bg cursor-pointer transition-colors disabled:opacity-30 border-0"
                  aria-label="ลดจำนวน"
                >
                  −
                </button>
                <span className="min-w-[44px] text-center text-sm font-bold text-text select-none">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty(qty + 1)}
                  disabled={soldOut || qty >= stock}
                  className="w-10 h-10 flex items-center justify-center text-base font-bold text-text hover:bg-bg cursor-pointer transition-colors disabled:opacity-30 border-0"
                  aria-label="เพิ่มจำนวน"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-neutral-700 font-medium">
                (มีสินค้า {stock} ชิ้น)
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {/* Add to Cart (Secondary CTA) */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={soldOut || adding || buying}
                className={`min-h-[46px] px-5 rounded-xl text-sm font-semibold transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                  soldOut
                    ? "bg-neutral-200 text-neutral-600 cursor-not-allowed border-neutral-300 font-medium"
                    : "border-divider bg-surface hover:bg-bg text-text active:scale-[0.98] shadow-xs"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 4h2.5l2.2 10.5h9.6L19 7H6" />
                  <circle cx="9" cy="19" r="1.4" />
                  <circle cx="17" cy="19" r="1.4" />
                </svg>
                <span>{adding ? "กำลังใส่ตะกร้า..." : "ใส่ตะกร้า"}</span>
              </button>

              {/* Buy Now (Primary High Visual Weight CTA) */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={soldOut || adding || buying}
                className={`min-h-[46px] px-5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                  soldOut
                    ? "bg-neutral-300 text-neutral-600 cursor-not-allowed font-medium"
                    : "bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white active:scale-[0.98]"
                }`}
              >
                <svg className="w-4 h-4 !text-white" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span className="!text-white">{buying ? "กำลังพาไปชำระเงิน..." : "ซื้อเลย / ชำระเงิน"}</span>
              </button>
            </div>
          </div>

          {/* Trust Badges & Guarantees (Social Proof & Risk Reversal) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-divider">
            <div className="flex flex-col items-center text-center p-3.5 rounded-xl bg-surface border border-divider">
              <svg className="w-5 h-5 text-accent mb-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span className="text-xs font-bold text-text">จัดส่งด่วน</span>
              <span className="text-xs text-neutral-700 mt-0.5">ฟรีเมื่อครบ ฿1,500</span>
            </div>

            <div className="flex flex-col items-center text-center p-3.5 rounded-xl bg-surface border border-divider">
              <svg className="w-5 h-5 text-emerald-700 mb-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-xs font-bold text-text">ของแท้ 100%</span>
              <span className="text-xs text-neutral-700 mt-0.5">รับประกันคุณภาพ</span>
            </div>

            <div className="flex flex-col items-center text-center p-3.5 rounded-xl bg-surface border border-divider">
              <svg className="w-5 h-5 text-purple-700 mb-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              <span className="text-xs font-bold text-text">คืนได้ใน 7 วัน</span>
              <span className="text-xs text-neutral-700 mt-0.5">หากพบปัญหา</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-sm text-neutral-600">
          กำลังโหลด...
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}