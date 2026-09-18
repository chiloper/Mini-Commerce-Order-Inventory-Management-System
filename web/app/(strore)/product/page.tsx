"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getProductById,
  getProducts,
  addToCart,
} from "../../../lib/ecommerce-actions";
import type { Product } from "@/types/ecommerce";

function ProductDetailContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const skuParam = searchParams.get("sku");

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setSelectedImage(null);
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

  if (!product) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg text-neutral-700 mb-4">ไม่พบสินค้านี้</p>
        <Link
          href="/list"
          className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium bg-neutral-800 text-white hover:bg-neutral-900 transition-colors"
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16">
      {/* Breadcrumb */}
      <div className="mb-6 text-xs text-neutral-600">
        <Link
          href="/list"
          className="text-accent-700 hover:underline font-medium"
        >
          ← กลับหน้ารายการสินค้า
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left column: Main Product Shot and Interactive Thumbnails */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[4/3] w-full bg-neutral-200 dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center">
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-200"
              />
            ) : (
              <span className="text-xs tracking-widest uppercase font-mono text-neutral-600">
                product shot · {product.sku}
              </span>
            )}
          </div>

          {/* Interactive Thumbnails */}
          {imagesList.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
              {imagesList.map((imgUrl, idx) => {
                const isSelected = activeImage === imgUrl;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-accent ring-2 ring-accent/20 scale-95"
                        : "border-divider hover:opacity-80"
                    }`}
                    title={`ดูภาพที่ ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Details, Stock Box, Stepper & Button */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-accent-700 font-semibold mb-1">
              {product.sku} · {product.catagory?.name || "หมวดหมู่สินค้า"}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mb-2">
              {product.name}
            </h1>
            <p className="text-2xl font-bold text-text">
              {formatPrice(product.price)}
            </p>
          </div>

          {/* Stock Status Badge */}
          <div className="flex items-center gap-2 text-sm p-3 rounded-xl border border-divider bg-surface w-fit">
            <span className="text-neutral-600">สถานะสต็อก:</span>
            <strong
              className={`font-semibold ${
                soldOut ? "text-rose-600" : "text-emerald-700"
              }`}
            >
              {soldOut ? "สินค้าหมดชั่วคราว" : `คงเหลือ ${product.stock} ชิ้น`}
            </strong>
          </div>

          <p className="text-sm leading-relaxed text-neutral-700">
            สินค้าของแท้คุณภาพดี พร้อมจัดส่งด่วนทั่วประเทศ รับประกันความพึงพอใจ
          </p>

          {/* Stepper + Add to Cart */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center border border-divider rounded-lg bg-surface">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 flex items-center justify-center text-lg font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-l-lg cursor-pointer transition-colors"
              >
                −
              </button>
              <span className="min-w-[40px] text-center text-sm font-semibold">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                disabled={qty >= stock}
                className="w-10 h-10 flex items-center justify-center text-lg font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-r-lg cursor-pointer transition-colors disabled:opacity-40"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={soldOut || adding}
              className={`flex-1 h-10 px-6 rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-xs ${
                soldOut
                  ? "bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300"
                  : "bg-neutral-800 text-white hover:bg-neutral-900 active:scale-[0.98]"
              }`}
            >
              {adding ? "กำลังใส่ตะกร้า..." : addLabel}
            </button>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed mt-1">
            เมื่อสั่งซื้อระบบจะคำนวณและตัดยอดสต็อกตามคำสั่งซื้ออัตโนมัติ
          </p>
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