"use client";

import Link from "next/link";
import type { Product } from "@/types/ecommerce";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isAdding?: boolean;
}

export function ProductCard({
  product,
  onAddToCart,
  isAdding = false,
}: ProductCardProps) {
  const isSoldOut = (product.stock || 0) === 0;
  const isLowStock = !isSoldOut && (product.stock || 0) <= 10;
  const formatPrice = (n: number) => `฿${(n || 0).toLocaleString("th-TH")}`;

  return (
    <article className="group flex flex-col gap-3 p-3.5 bg-surface rounded-xl border border-divider hover:shadow-md transition-all duration-200">
      {/* Product Image */}
      <Link
        href={`/product?id=${product.id}`}
        className="block cursor-pointer overflow-hidden rounded-lg relative"
      >
        <div
          className={`relative aspect-[4/3] w-full bg-neutral-200 flex items-center justify-center overflow-hidden transition-all ${
            isSoldOut ? "opacity-65 grayscale-[35%]" : ""
          }`}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-[10px] tracking-widest uppercase text-neutral-700 font-mono font-semibold">
              product shot · {product.sku}
            </span>
          )}
        </div>

        {/* Stock badge overlay */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {isSoldOut ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-tight bg-neutral-900/80 backdrop-blur-md text-white shadow-xs border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
              <span>สินค้าหมด</span>
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-tight bg-amber-50/95 backdrop-blur-md text-amber-900 shadow-xs border border-amber-200/90">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>เหลือ {product.stock} ชิ้น</span>
            </span>
          ) : null}
        </div>
      </Link>

      {/* SKU & Price */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xs font-mono uppercase text-neutral-800 font-semibold truncate">
          {product.sku}
        </div>
        <span className="text-base font-bold whitespace-nowrap text-text">
          {formatPrice(product.price)}
        </span>
      </div>

      {/* Title */}
      <Link
        href={`/product?id=${product.id}`}
        className="flex-1 min-w-0 no-underline text-inherit hover:text-accent transition-colors"
      >
        <h3
          className="text-sm font-semibold truncate m-0 text-text"
          title={product.name}
        >
          {product.name}
        </h3>
      </Link>

      {/* Category & Stock Status */}
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-[11px] font-semibold tracking-wide uppercase text-accent-900 bg-accent-100 border border-accent-200 px-2 py-0.5 rounded">
          {product.catagory?.name || "สินค้าทั่วไป"}
        </span>
        <span className="text-xs font-medium">
          {isSoldOut ? (
            <span className="text-neutral-500 font-medium">หมดสต็อก</span>
          ) : isLowStock ? (
            <span className="text-amber-800 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              เหลือ {product.stock} ชิ้น
            </span>
          ) : (
            <span className="text-neutral-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
              พร้อมส่ง ({product.stock})
            </span>
          )}
        </span>
      </div>

      {/* Action Button: ใส่ตะกร้า */}
      <button
        type="button"
        onClick={() => onAddToCart(product)}
        disabled={isSoldOut || isAdding}
        className={`mt-auto w-full min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
          isSoldOut
            ? "bg-neutral-200 text-neutral-600 cursor-not-allowed border border-neutral-300 font-medium"
            : "bg-accent text-white hover:bg-accent-600 active:bg-accent-700 shadow-xs"
        }`}
      >
        {isAdding
          ? "กำลังใส่ตะกร้า..."
          : isSoldOut
            ? "สินค้าหมด"
            : "ใส่ตะกร้า"}
      </button>
    </article>
  );
}
