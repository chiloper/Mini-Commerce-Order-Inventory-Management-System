"use client";

import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { bulkImportProductsAction } from "@/lib/ecommerce-actions";
import type { Category, Product } from "@/types/ecommerce";

interface ImportProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  existingProducts: Product[];
}

interface ParsedRow {
  rowNum: number;
  sku: string;
  name: string;
  categoryName: string;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  isValid: boolean;
  isExisting: boolean;
  errorMessage?: string;
}

export function ImportProductModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  existingProducts,
}: ImportProductModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [resultSummary, setResultSummary] = useState<{
    totalRows: number;
    successCount: number;
    createdCount: number;
    updatedCount: number;
    failedCount: number;
    errors: Array<{ row: number; sku?: string; name?: string; message: string }>;
  } | null>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setParsing(false);
      setParsedRows([]);
      setImporting(false);
      setStep("upload");
      setResultSummary(null);
    }
  }, [isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !importing) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, importing, onClose]);

  if (!isOpen) return null;

  // 1. Download Template (.xlsx)
  const handleDownloadExcelTemplate = () => {
    const headers = [
      "รหัสสินค้า (SKU) *",
      "ชื่อสินค้า *",
      "หมวดหมู่",
      "ราคาขาย (บาท) *",
      "จำนวนสต็อก *",
      "สถานะการขาย",
      "URL รูปภาพ",
    ];

    const sampleRows = [
      [
        "SKU-1001",
        "เสื้อยืด Oversize สีดำ",
        categories[0]?.name || "เสื้อผ้า",
        390,
        50,
        "เปิดขาย",
        "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      ],
      [
        "SKU-1002",
        "กางเกงสแล็ค ทรงกระบอก",
        categories[0]?.name || "เสื้อผ้า",
        590,
        30,
        "เปิดขาย",
        "",
      ],
      [
        "SKU-2001",
        "เคสโทรศัพท์ ลายมินิมอล",
        categories[1]?.name || categories[0]?.name || "อุปกรณ์ไอที",
        199,
        100,
        "ปิดการขาย",
        "",
      ],
    ];

    const wsData = [
      headers,
      ...sampleRows,
      [],
      ["คำอธิบายการกรอกข้อมูล:"],
      ["1. รหัสสินค้า (SKU): จำเป็นต้องระบุ หากตรงกับสินค้าเดิมในระบบ จะเป็นการอัปเดตข้อมูลและเขียนทับสต็อก"],
      ["2. ชื่อสินค้า: จำเป็นต้องระบุ"],
      ["3. หมวดหมู่: ต้องเป็นชื่อหมวดหมู่ที่มีอยู่แล้วในระบบ (สามารถตรวจสอบได้ที่เมนู 'หมวดหมู่สินค้า')"],
      ["4. ราคาขาย และ สต็อก: ต้องเป็นตัวเลขจำนวนเต็ม 0 หรือมากกว่า"],
      ["5. สถานะการขาย: ระบุ 'เปิดขาย' หรือ 'ปิดการขาย' (หากเว้นว่างจะถือว่าเปิดขาย)"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws["!cols"] = [
      { wch: 18 },
      { wch: 28 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 35 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "product_inventory_import_template.xlsx");
  };

  // 2. Download Template (.csv)
  const handleDownloadCsvTemplate = () => {
    const headers = [
      "รหัสสินค้า (SKU) *",
      "ชื่อสินค้า *",
      "หมวดหมู่",
      "ราคาขาย (บาท) *",
      "จำนวนสต็อก *",
      "สถานะการขาย",
      "URL รูปภาพ",
    ];

    const sampleRows = [
      [
        "SKU-1001",
        "เสื้อยืด Oversize สีดำ",
        categories[0]?.name || "เสื้อผ้า",
        "390",
        "50",
        "เปิดขาย",
        "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      ],
      [
        "SKU-1002",
        "กางเกงสแล็ค ทรงกระบอก",
        categories[0]?.name || "เสื้อผ้า",
        "590",
        "30",
        "เปิดขาย",
        "",
      ],
    ];

    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
    const csvContent =
      "\uFEFF" +
      [
        headers.map(escapeCsv).join(","),
        ...sampleRows.map((r) => r.map(escapeCsv).join(",")),
      ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "product_inventory_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Process Uploaded File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setParsing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

      // Build lookups
      const categoryMap = new Map<string, number>();
      for (const cat of categories) {
        categoryMap.set(cat.name.trim().toLowerCase(), cat.id);
      }

      const existingSkuSet = new Set(existingProducts.map((p) => p.sku.trim().toLowerCase()));

      const parsed: ParsedRow[] = [];

      rawRows.forEach((row, index) => {
        // Find keys by flexible column names
        const skuKey = Object.keys(row).find((k) => /sku|รหัสสินค้า/i.test(k));
        const nameKey = Object.keys(row).find((k) => /name|ชื่อสินค้า|ชื่อ/i.test(k));
        const catKey = Object.keys(row).find((k) => /categor|หมวดหมู่/i.test(k));
        const priceKey = Object.keys(row).find((k) => /price|ราคา/i.test(k));
        const stockKey = Object.keys(row).find((k) => /stock|สต็อก|จำนวน/i.test(k));
        const statusKey = Object.keys(row).find((k) => /status|สถานะ/i.test(k));
        const imgKey = Object.keys(row).find((k) => /image|url|รูป/i.test(k));

        const sku = String(skuKey ? row[skuKey] : "").trim();
        const name = String(nameKey ? row[nameKey] : "").trim();
        const catName = String(catKey ? row[catKey] : "").trim();
        const rawPrice = priceKey ? row[priceKey] : "";
        const rawStock = stockKey ? row[stockKey] : "";
        const rawStatus = statusKey ? String(row[statusKey]).trim() : "";
        const rawImg = imgKey ? String(row[imgKey]).trim() : "";

        // Skip completely blank rows or instruction rows at bottom
        if (!sku && !name && !rawPrice && !rawStock) return;
        if (sku.startsWith("คำอธิบาย") || sku.startsWith("1.") || sku.startsWith("2.")) return;

        const rowNum = index + 2; // Excel 1-based header is row 1
        const price = Number(rawPrice);
        const stock = Number(rawStock);
        const isActive = rawStatus === "ปิดการขาย" || rawStatus === "inactive" || rawStatus === "false" ? false : true;

        let isValid = true;
        let errorMessage = "";

        if (!sku) {
          isValid = false;
          errorMessage = "รหัสสินค้า (SKU) ห้ามเว้นว่าง";
        } else if (!name) {
          isValid = false;
          errorMessage = "ชื่อสินค้าห้ามเว้นว่าง";
        } else if (isNaN(price) || price < 0) {
          isValid = false;
          errorMessage = "ราคาขายต้องเป็นตัวเลขที่ไม่ติดลบ";
        } else if (isNaN(stock) || stock < 0) {
          isValid = false;
          errorMessage = "จำนวนสต็อกต้องเป็นตัวเลขที่ไม่ติดลบ";
        } else if (catName) {
          // Check if category exists in DB (User's requirement: Error case if category not found)
          if (!categoryMap.has(catName.toLowerCase())) {
            isValid = false;
            errorMessage = `ไม่พบหมวดหมู่ "${catName}" ในระบบ (กรุณาสร้างที่เมนูหมวดหมู่ก่อน)`;
          }
        }

        const isExisting = existingSkuSet.has(sku.toLowerCase());

        parsed.push({
          rowNum,
          sku,
          name,
          categoryName: catName,
          price: isNaN(price) ? 0 : price,
          stock: isNaN(stock) ? 0 : stock,
          isActive,
          imageUrl: rawImg || undefined,
          isValid,
          isExisting,
          errorMessage,
        });
      });

      setParsedRows(parsed);
      setStep("preview");
    } catch (err: any) {
      console.error("Parse file error:", err);
      alert("ไม่สามารถอ่านไฟล์ได้ โปรดตรวจสอบว่าเป็นไฟล์ .xlsx หรือ .csv ที่ถูกต้อง");
    } finally {
      setParsing(false);
    }
  };

  // 4. Submit Import Action
  const handleExecuteImport = async () => {
    // Only send valid rows, but pass rowNum for accurate reporting
    const rowsToImport = parsedRows
      .filter((r) => r.isValid)
      .map((r) => ({
        sku: r.sku,
        name: r.name,
        categoryName: r.categoryName || undefined,
        price: r.price,
        stock: r.stock,
        isActive: r.isActive,
        imageUrl: r.imageUrl,
      }));

    if (rowsToImport.length === 0) {
      alert("ไม่มีข้อมูลที่ถูกต้องสำหรับการนำเข้า");
      return;
    }

    setImporting(true);

    const res = await bulkImportProductsAction(rowsToImport);

    setImporting(false);

    if (res.ok && res.data) {
      // Merge pre-validation failed rows with backend failed rows
      const preValidationFailed = parsedRows
        .filter((r) => !r.isValid)
        .map((r) => ({
          row: r.rowNum,
          sku: r.sku,
          name: r.name,
          message: r.errorMessage || "ข้อมูลไม่ถูกต้อง",
        }));

      const allErrors = [...preValidationFailed, ...(res.data.errors || [])];

      setResultSummary({
        totalRows: parsedRows.length,
        successCount: res.data.successCount,
        createdCount: res.data.createdCount,
        updatedCount: res.data.updatedCount,
        failedCount: preValidationFailed.length + (res.data.failedCount || 0),
        errors: allErrors,
      });

      setStep("result");
    } else {
      alert(res.error || "เกิดข้อผิดพลาดในการนำเข้าสินค้า");
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;
  const updateCount = parsedRows.filter((r) => r.isValid && r.isExisting).length;
  const newCount = parsedRows.filter((r) => r.isValid && !r.isExisting).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => !importing && onClose()}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-surface border border-divider rounded-2xl shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider bg-surface">
          <div>
            <h3 className="text-lg font-bold text-text m-0">นำเข้าสินค้า & สต็อก (Bulk Import)</h3>
            <p className="text-xs text-neutral-600 m-0 mt-0.5 font-medium">
              รองรับไฟล์ Excel (.xlsx) และ CSV (.csv) พร้อมระบบตรวจสอบความถูกต้องอัตโนมัติ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="w-8 h-8 rounded-full bg-bg hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer transition-colors font-bold disabled:opacity-50"
            title="ปิด"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {step === "upload" && (
            <>
              {/* Template Download Card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-bg border border-divider">
                <div>
                  <h4 className="text-xs font-bold text-text m-0">ยังไม่มีไฟล์รูปแบบที่ถูกต้อง?</h4>
                  <p className="text-[11px] text-neutral-600 m-0 mt-0.5">
                    ดาวน์โหลดไฟล์ตัวอย่าง Template เพื่อดูหัวตารางและรูปแบบข้อมูลที่ต้องกรอก
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <span>📊 Template (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-divider bg-surface hover:bg-bg text-neutral-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    <span>📄 Template (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-divider hover:border-accent hover:bg-accent/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent-100 text-accent flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-text m-0">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-xs text-neutral-500 m-0 mt-1">
                    รองรับไฟล์นามสกุล <strong>.xlsx</strong>, <strong>.xls</strong> และ <strong>.csv</strong>
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Key Feature Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-surface border border-divider">
                  <span className="text-emerald-600 font-bold">🔄</span>
                  <div>
                    <span className="font-bold text-text">Upsert ด้วยรหัส SKU</span>
                    <p className="text-[11px] text-neutral-600 m-0 mt-0.5 leading-relaxed">
                      หากมีรหัส SKU ในระบบแล้ว จะเป็นการเขียนทับสต็อกและอัปเดตข้อมูลเดิม หากเป็น SKU ใหม่จะสร้างสินค้าใหม่
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-surface border border-divider">
                  <span className="text-amber-600 font-bold">⏭️</span>
                  <div>
                    <span className="font-bold text-text">ข้ามแถวที่ผิดพลาด (Skip on Error)</span>
                    <p className="text-[11px] text-neutral-600 m-0 mt-0.5 leading-relaxed">
                      แถวที่ข้อมูลไม่ถูกต้อง หรือไม่พบหมวดหมู่ในระบบ จะถูกข้ามไปและนำเข้าแถวที่ถูกต้องต่อจนเสร็จ
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === "preview" && (
            <>
              {/* Validation Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-bg border border-divider flex flex-col">
                  <span className="text-[11px] text-neutral-600 font-medium">พบทั้งหมด</span>
                  <span className="text-lg font-bold text-text font-mono">{parsedRows.length}</span>
                  <span className="text-[10px] text-neutral-500">แถวข้อมูล</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col">
                  <span className="text-[11px] text-emerald-800 font-medium">พร้อมนำเข้า</span>
                  <span className="text-lg font-bold text-emerald-700 font-mono">{validCount}</span>
                  <span className="text-[10px] text-emerald-700">รายการถูกต้อง</span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col">
                  <span className="text-[11px] text-blue-800 font-medium">แบ่งเป็น</span>
                  <span className="text-xs font-bold text-blue-900 mt-1">
                    ใหม่ {newCount} · แก้ไขเดิม {updateCount}
                  </span>
                  <span className="text-[10px] text-blue-700">อ้างอิงรหัส SKU</span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-col">
                  <span className="text-[11px] text-rose-800 font-medium">จะถูกข้าม (ผิดพลาด)</span>
                  <span className="text-lg font-bold text-rose-700 font-mono">{invalidCount}</span>
                  <span className="text-[10px] text-rose-700">รายการไม่สมบูรณ์</span>
                </div>
              </div>

              {/* Table Preview */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text">ตัวอย่างข้อมูลที่จะนำเข้า:</span>
                  <span className="text-[11px] text-neutral-500">ไฟล์: {file?.name}</span>
                </div>

                <div className="max-h-60 overflow-y-auto rounded-xl border border-divider bg-surface">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-bg border-b border-divider font-bold text-neutral-700">
                      <tr>
                        <th className="py-2 px-3 whitespace-nowrap">แถว</th>
                        <th className="py-2 px-3 whitespace-nowrap">สถานะ</th>
                        <th className="py-2 px-3 whitespace-nowrap">SKU</th>
                        <th className="py-2 px-3 whitespace-nowrap">ชื่อสินค้า</th>
                        <th className="py-2 px-3 whitespace-nowrap">หมวดหมู่</th>
                        <th className="py-2 px-3 whitespace-nowrap">ราคา</th>
                        <th className="py-2 px-3 whitespace-nowrap">สต็อก</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider text-neutral-800">
                      {parsedRows.map((r) => (
                        <tr
                          key={r.rowNum}
                          className={r.isValid ? "hover:bg-bg/40" : "bg-rose-50/50 hover:bg-rose-50"}
                        >
                          <td className="py-2 px-3 font-mono text-neutral-500 whitespace-nowrap">
                            #{r.rowNum}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {r.isValid ? (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  r.isExisting
                                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                                    : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                }`}
                              >
                                {r.isExisting ? "🔄 อัปเดตเดิม" : "✨ สร้างใหม่"}
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300"
                                title={r.errorMessage}
                              >
                                ✕ ข้าม ({r.errorMessage})
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold whitespace-nowrap">
                            {r.sku || "-"}
                          </td>
                          <td className="py-2 px-3 font-medium max-w-[150px] truncate" title={r.name}>
                            {r.name || "-"}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-neutral-600">
                            {r.categoryName || "-"}
                          </td>
                          <td className="py-2 px-3 font-mono whitespace-nowrap">
                            ฿{r.price.toLocaleString("th-TH")}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold whitespace-nowrap">
                            {r.stock.toLocaleString("th-TH")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <span className="text-base shrink-0">⚠️</span>
                  <div className="leading-relaxed">
                    พบข้อมูลไม่ถูกต้อง {invalidCount} รายการ (เช่น รหัสไม่ครบ หรือไม่พบหมวดหมู่สินค้าในระบบ)
                    ระบบจะ <strong>ข้ามแถวเหล่านี้ไป</strong> และนำเข้าเฉพาะแถวที่ถูกต้อง {validCount} รายการเท่านั้น
                  </div>
                </div>
              )}
            </>
          )}

          {step === "result" && resultSummary && (
            <div className="flex flex-col gap-4 py-2">
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-text m-0">นำเข้าสินค้าเรียบร้อยแล้ว</h4>
                <p className="text-xs text-neutral-600 m-0 mt-1">
                  ระบบได้ปรับปรุงข้อมูลแคตตาล็อกและสต็อกสินค้าในฐานข้อมูลเรียบร้อยแล้ว
                </p>
              </div>

              {/* Result Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-bg border border-divider text-center">
                  <span className="text-[11px] text-neutral-600 font-medium">ทั้งหมดในไฟล์</span>
                  <span className="text-xl font-bold text-text font-mono block mt-0.5">
                    {resultSummary.totalRows}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[11px] text-emerald-800 font-medium">สร้างสินค้าใหม่</span>
                  <span className="text-xl font-bold text-emerald-700 font-mono block mt-0.5">
                    {resultSummary.createdCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[11px] text-amber-800 font-medium">อัปเดตสินค้าเดิม</span>
                  <span className="text-xl font-bold text-amber-700 font-mono block mt-0.5">
                    {resultSummary.updatedCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[11px] text-rose-800 font-medium">ข้ามเนื่องจากผิดพลาด</span>
                  <span className="text-xl font-bold text-rose-700 font-mono block mt-0.5">
                    {resultSummary.failedCount}
                  </span>
                </div>
              </div>

              {/* Error Details Log */}
              {resultSummary.errors.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-rose-800">
                    รายละเอียดแถวที่ถูกข้าม ({resultSummary.errors.length} รายการ):
                  </span>
                  <div className="max-h-48 overflow-y-auto p-3 rounded-xl bg-rose-50 border border-rose-200 flex flex-col gap-1.5 text-xs font-mono">
                    {resultSummary.errors.map((err, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-rose-900">
                        <span className="font-bold shrink-0">แถว #{err.row}:</span>
                        <span className="font-sans font-medium text-rose-800">{err.message}</span>
                        {err.sku && <span className="text-neutral-500 font-mono">({err.sku})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-divider bg-surface">
          {step === "upload" && (
            <div className="flex items-center justify-end w-full gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </div>
          )}

          {step === "preview" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep("upload");
                  setFile(null);
                  setParsedRows([]);
                }}
                disabled={importing}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-colors cursor-pointer disabled:opacity-50"
              >
                ← เปลี่ยนไฟล์
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={importing}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-colors cursor-pointer disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importing || validCount === 0}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {importing && (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
                    </svg>
                  )}
                  <span>
                    {importing ? "กำลังนำเข้าสินค้า..." : `ยืนยันนำเข้า (${validCount} รายการ)`}
                  </span>
                </button>
              </div>
            </>
          )}

          {step === "result" && (
            <div className="flex items-center justify-end w-full gap-2">
              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-accent hover:bg-accent-600 active:bg-accent-700 !text-white transition-all shadow-xs cursor-pointer"
              >
                เสร็จสิ้น & กลับสู่หน้ารายการสินค้า
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImportProductModal;
