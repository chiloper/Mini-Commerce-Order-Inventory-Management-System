# AGENT.MD: คู่มือและกฎระเบียบการพัฒนาสำหรับ AI Agent
> **Mini-Commerce Order & Inventory Management System**  
> เอกสารนี้จัดทำขึ้นเพื่อให้ AI Agent (และผู้พัฒนา) ที่เปิดโปรเจกต์นี้ในทุกเครื่องเข้าใจถึง **ข้อห้ามเด็ดขาด**, **สถาปัตยกรรมระบบ**, **หลักการ UX/UI**, ตลอดจน **แนวทางปฏิบัติเฉพาะทางของระบบ** เพื่อรักษาคุณภาพและมาตรฐานของโค้ดเบส

---

## 1. ข้อห้ามเด็ดขาด (Strict Constraints & Hard Rules)

### 1.1 การใช้งาน Git (Git Operations) 🚫
- ❌ **ห้ามสั่ง `git commit` หรือ `git push` ผ่าน Terminal / Tools โดยเด็ดขาด** ไม่ว่ากรณีใดก็ตาม
- ✅ **สิ่งที่ต้องทำ**: เมื่อแก้ไขหรือพัฒนาฟีเจอร์เสร็จสิ้น ให้จัดเตรียมคำสั่ง `git add ...` และ `git commit -m "..."` ในรูปแบบ Conventional Commits อย่างชัดเจน เพื่อให้ **User เป็นผู้คัดลอกไปรันเอง** ที่ Terminal

### 1.2 การล็อคสถานะคำสั่งซื้อ (Shipped Order Status Locking) 🔒
- ❌ **คำสั่งซื้อที่มีสถานะ `"shipped"` (จัดส่งแล้ว) จะต้องไม่สามารถปรับเปลี่ยนสถานะหรือยกเลิกได้อีก** ทั้งฝั่ง Frontend และ Backend
  - **Frontend**: ในหน้าต่าง Order Details Modal ต้องซ่อนปุ่มเปลี่ยนสถานะทั้งหมด และแสดง Locked Status Card แจ้งเตือนชัดเจน
  - **Backend**: ใน `OrderService.updateStatus()` ต้องตรวจสอบว่าหากสถานะปัจจุบันเป็น `"shipped"` อยู่แล้ว ให้โยน `BadRequestException` (HTTP 400) ทันที เพื่อป้องกันความผิดพลาดทางบัญชีและการควบคุมสต็อก

### 1.3 การทำ Pagination บนตารางข้อมูล (Server-side API Pagination) 📄
- ❌ **ห้ามดึงข้อมูลทั้งหมด (`getall`) แล้วมาทำแบ่งหน้า (Pagination) หรือกรอง (Filter) บนฝั่ง Client UI**
- ✅ **สิ่งที่ต้องทำ**: ตารางข้อมูลหลักในระบบ (เช่น ภาพรวมคำสั่งซื้อล่าสุด, รายการคำสั่งซื้อ, สินค้าและสต็อก, โปรโมชั่น) ต้องใช้ Server-side API Pagination ผ่าน Query Parameters (`page`, `limit`, `search`, `status`, `stockFilter`)
- ⚠️ **Backward Compatibility**: Endpoint ฝั่ง Backend ที่รองรับ Pagination (`/products`, `/orders`, `/promotions`) **ต้องรักษาความเข้ากันได้ย้อนหลัง** โดยหาก Request ไม่มีการส่งค่า `page` เข้ามา ระบบจะต้องส่งข้อมูลกลับเป็น Flat Array รูปแบบเดิม เพื่อไม่ให้กระทบต่อหน้าร้าน (Storefront) หรือ Dropdown ตัวเลือกสินค้า

### 1.4 การจัดการสต็อกสินค้าและการป้องกัน Race Condition (Inventory Concurrency & Overselling Prevention) 📦
- ❌ **ห้ามใช้ Read-then-Write (`findUnique` แล้วค่อย `update`) ในการตัดสต็อกเด็ดขาด**:
  - เมื่อมีผู้ใช้สั่งซื้อพร้อมกันหลายคน (Concurrency / Flash Sale) การอ่านสต็อกแบบไม่ล็อคแถวจะทำให้ทุก Request ผ่านเงื่อนไขพร้อมกัน ส่งผลให้ **สต็อกติดลบ หรือเกิดการขายเกินสต็อก (Overselling)**
- ✅ **ต้องใช้ Atomic Conditional Update (Compare-And-Swap / CAS)**:
  - ใช้ `tx.product.updateMany({ where: { id: productId, stock: { gte: quantity }, isActive: true }, data: { stock: { decrement: quantity } } })`
  - ตรวจสอบ `if (updateResult.count === 0)` หากสต็อกถูกแย่งตัดไปก่อนหน้า คำสั่งจะอัปเดต 0 แถว ระบบจะต้อง Throw `ConflictException` (HTTP 409) เพื่อทำ Transaction Rollback ทันที ป้องกันสินค้าติดลบ 100%
- ✅ **Deadlock Prevention (การเรียงลำดับการ Lock)**:
  - รายการสินค้าในตะกร้าและออเดอร์ต้องถูกจัดเรียงตาม `productId` จากน้อยไปมาก (`sort((a, b) => a.productId - b.productId)`) ก่อนขอ Row Lock เสมอ เพื่อให้ทุก Transaction ขอ Lock ในลำดับเดียวกัน ป้องกัน Deadlock
- ✅ **Atomic Promotion Usage Lock (100% Pure Prisma Client)**:
  - การอัปเดตโควตาโปรโมชั่นต้องทำแบบ Atomic โดยใช้ Prisma Client `tx.promotion.updateMany({ where: { id: promotionId, usedCount: { lt: promoUsageLimit }, expiresAt: { gt: new Date() } }, data: { usedCount: { increment: 1 } } })`
  - หาก `promoResult.count === 0` ให้ Throw `ConflictException` ทันที เพื่อป้องกันการใช้โค้ดเกินโควตาเมื่อยิงพร้อมกัน โดยไม่ต้องใช้ Raw SQL
- ⚠️ **การเติมสต็อก (Stock Refill)**: ต้องเป็นการ **"บวกเพิ่ม" จากสต็อกเดิม** (`newStock = currentStock + amountToAdd`) เสมอ ไม่ใช่การพิมพ์ตัวเลขรวมเพื่อเขียนทับค่าเดิม
- ⚠️ **การคืนสต็อกเมื่อยกเลิกคำสั่งซื้อ (Restocking on Cancel)**: เมื่อคำสั่งซื้อสถานะ `paid` หรือ `processing` ถูกเปลี่ยนสถานะเป็น `cancelled` จะต้องคืนสต็อก (`increment`) สินค้ากลับเข้าคลังอย่างถูกต้องภายใน Transaction

### 1.5 กฎการอัปเดต agent.md เสมอ (Continuous Documentation Rule) 📝
- ⚠️ **ทุกๆ ครั้งหลังจากทำงานเสร็จ ให้ไปอัปเดต `agent.md` เสมอ**:
  - เมื่อมีการแก้ไขโค้ด พัฒนาฟีเจอร์ใหม่ ปรับปรุงโครงสร้าง หรือค้นพบข้อจำกัด/ข้อควรระวังใหม่ๆ AI Agent จะต้องมาอัปเดตเอกสาร `agent.md` นี้ทุกครั้งก่อนส่งมอบงาน เพื่อให้คอมพิวเตอร์เครื่องอื่นหรือ Agent ถัดไปสามารถทำงานต่อได้อย่างต่อเนื่องและถูกต้อง

---

## 2. ภาพรวมสถาปัตยกรรมและเทคโนโลยี (Tech Stack & Architecture)

โปรเจกต์นี้ใช้โครงสร้างแบบ Monorepo แบ่งออกเป็น 2 ส่วนหลัก:

```
Mini-Commerce-Order-Inventory-Management-System/
├── api/          # Backend API Service (NestJS + Prisma + TiDB/MySQL)
├── web/          # Frontend Web Application (Next.js 16 + Tailwind CSS v4)
├── agent.md      # คู่มือกฎระเบียบและข้อควรระวังสำหรับ Agent (ไฟล์นี้)
└── README.md
```

### 2.1 Backend (`/api`)
- **Framework**: NestJS 11 (Modular Architecture: Controllers, Services, Repositories, DTOs)
- **Language**: TypeScript (Node.js runtime, CommonJS compilation)
- **ORM**: Prisma Client v7 (`@prisma/client`, `@prisma/adapter-mariadb`)
- **Database**: MySQL / TiDB (Port มาตรฐาน: `3001` สำหรับ API)
- **Auth**: JWT + Refresh Token Rotation (`RefreshToken` model with `familyId`)
- **Output Directory ของ Prisma**: `api/src/generated/prisma`

### 2.2 Frontend (`/web`)
- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, PostCSS
- **Data Fetching**: Next.js Server Actions & Native `fetch` (Port มาตรฐาน: `3000`)
- **Routing Structure**:
  - `web/app/(admin)/`: หน้าจอสำหรับผู้ดูแลระบบ (`/dashboard`, `/order`, `/inventory`, `/promotion`)
  - `web/app/(store)/`: หน้าร้านค้าสำหรับลูกค้า (`/`, `/product`, `/checkout`, `/account`, `/cart`)

---

## 3. กฎและข้อควรระวังเฉพาะของฐานข้อมูล (TiDB / MySQL & Prisma)

### 3.1 รูปแบบ JSON Path ใน TiDB ⚠️
- ใน TiDB / MariaDB การคิวรีฟิลด์ JSON (เช่น `Order.discountBreakdown`) **ต้องระบุ JSON Path ด้วยรูปแบบ `$.fieldName` เสมอ** เช่น:
  ```ts
  // ✅ ถูกต้องสำหรับ TiDB:
  path: '$.customerName'
  path: '$.statusText'
  path: '$.phone'

  // ❌ ห้ามใช้ (TiDB จะ Error: Invalid JSON path):
  path: 'customerName'
  ```

### 3.2 โครงสร้าง Response ของ Server-side Pagination
API ที่รองรับ Pagination ต้องส่ง Response กลับในโครงสร้างมาตรฐานนี้:
```json
{
  "data": [ ... ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

## 4. หลักการออกแบบ UX/UI และการจัดการ Tailwind CSS v4

### 4.1 กฎ Specificity ของ Tailwind CSS v4 ⚠️
- ❌ **ห้ามประกาศ Unlayered Element Selector ตรง ๆ ใน `web/app/globals.css`** เช่น:
  ```css
  /* ❌ ห้ามเขียนแบบนี้ เพราะจะ Override utility classes ทั้งหมดของ Tailwind */
  a { color: var(--color-accent); }
  ```
- ✅ **สิ่งที่ถูกต้อง**: ต้องใช้ `a { color: inherit; text-decoration: none; }` และควบคุมสีผ่าน Utility Classes (`text-white`, `text-neutral-800`)
- **ปุ่ม Primary CTA (`bg-accent`)**: ต้องระบุสีข้อความให้คมชัดเสมอ เช่น `!text-white` เพื่อป้องกันปัญหาข้อความสีฟ้าจมหายไปกับพื้นหลังสีฟ้า

### 4.2 มาตรฐานความคมชัดและการเข้าถึง (WCAG 2.1 AA)
- อัตราส่วน Contrast ของข้อความกับพื้นหลังต้อง $\ge 4.5:1$
- ป้ายสถานะ (Badges) ต้องมีพื้นหลังโปร่งแสงและเส้นขอบสีเฉพาะที่อ่านง่าย (เช่น ชิปสถานะคำสั่งซื้อ, ป้ายสต็อกวิกฤต)

### 4.3 รูปแบบการคลิกที่รหัสประจำตัว (Clickable Identifier Pattern) 🎯
เพื่อลดความแออัดของตารางข้อมูล ให้ใช้พฤติกรรมการคลิกที่รหัสประจำตัวแทนการใส่ปุ่ม "จัดการ" หรือ "แก้ไข" แยกคอลัมน์:
- **หน้าคำสั่งซื้อ (`/order`)**: คลิกที่ **เลขออเดอร์ (`#ID`)** เพื่อเปิด Order Details Modal สำหรับดูรายละเอียดและเปลี่ยนสถานะ
- **หน้าสินค้า & สต็อก (`/inventory`)**: คลิกที่ **รหัสสินค้า (`SKU`)** เพื่อเปิด Edit Product Modal
- **หน้าโปรโมชั่น (`/promotion`)**: คลิกที่ **รหัสโค้ด (`CODE`)** เพื่อเปิด Edit Promotion Modal
- **หน้าประวัติคำสั่งซื้อลูกค้า (`/account`)**: รองรับทั้งการคลิกที่ **เลขออเดอร์** และปุ่ม **"ดูรายละเอียด"** เพื่อความชัดเจนตามหลัก UX

### 4.4 การป้องกันการแสดงผลรูปภาพเสีย (Broken Image Fallbacks) 🖼️
- ห้ามปล่อยให้เบราว์เซอร์แสดงกรอบกากบาท `[X]` เมื่อรูปภาพสินค้าโหลดไม่สำเร็จ
- คอมโพเนนต์แสดงรูปภาพต้องมี `onError` state handler เพื่อสลับไปแสดง **Halftone Fallback Card** หรือ **SVG Package Icon** ที่จัดสไตล์ไว้อย่างสวยงาม

### 4.5 การจัด Layout ตาราง (Responsive Tables)
- กำหนด `min-w-[...]` ที่เหมาะสมให้กับตารางข้อมูล เพื่อป้องกันไม่ให้คอลัมน์ถูกบีบจนตัดคำภาษาไทยผิดเพี้ยน
- ใช้ `whitespace-nowrap` กับข้อความสั้นและชิปสถานะ
- รวมข้อมูลที่เกี่ยวข้องกันในแนวตั้ง 2 บรรทัด (Primary Title + Secondary Metadata) เช่น ยอดเงิน + จำนวนรายการ

---

## 5. ระบบโปรโมชั่นและส่วนลด (Promotion & Discount Rules)

1. **การตรวจสอบโค้ดโปรโมชั่น**:
   - Endpoint: `POST /promotions/validate` รับ Body `{ code, subtotal }`
   - Response ต้องคืนค่าโครงสร้างที่สมบูรณ์:
     ```ts
     {
       valid: boolean;
       discountAmount: number;
       discount: number;
       type: "PERCENTAGE" | "FIXED" | "FREESHIP";
       value: number;
       description: string;
       promotion: Promotion;
     }
     ```
2. **การซิงก์ข้ามหน้าร้าน (Cart Drawer $\rightarrow$ Checkout)**:
   - เมื่อผู้ใช้ใส่โค้ดในตะกร้าสินค้าสำเร็จ ระบบจะส่งต่อโค้ดไปยังหน้า Checkout ผ่าน URL Parameter `?promo=...` และ `sessionStorage` เพื่อให้มีผลต่อเนื่องทันที
   - รองรับการกดปุ่ม `Enter` ในช่องกรอกโค้ด และมีปุ่ม `✕ ลบ` เพื่อยกเลิกโค้ดได้ตลอดเวลา

---

## 6. คำสั่งสำคัญสำหรับการรันและทดสอบระบบ (Commands Reference)

### 6.1 ฝั่ง Backend (`api/`)
```bash
cd api
npm install               # ติดตั้ง Dependencies
npm run build             # ตรวจสอบ Type และ Build (ต้อง Exit 0)
npm run start:dev         # รัน Development Server (Watch mode)
node dist/main            # รัน Production Server บน Port 3001
```

### 6.2 ฝั่ง Frontend (`web/`)
```bash
cd web
npm install               # ติดตั้ง Dependencies
npm run build             # Build และตรวจ TypeScript/Lint (ต้อง Exit 0)
npm run dev               # รัน Development Server บน Port 3000
npm run start             # รัน Production Web Server
```

### 6.3 กฎการส่งมอบงาน (Verification Checklist Before Delivery)
ก่อนรายงานผลหรือแจ้ง User ทุกครั้ง ต้องตรวจสอบเงื่อนไขดังนี้:
1. [ ] รัน `npm run build` ในโฟลเดอร์ `api` สำเร็จ 0 errors
2. [ ] รัน `npm run build` ในโฟลเดอร์ `web` สำเร็จ 0 errors
3. [ ] เช็คว่าไม่มีการรัน `git commit` หรือ `git push` โดยเด็ดขาด
4. [ ] ตรวจสอบว่าหน้าจอไม่มีการแตกหัก, ขอบล้น, หรือตัวหนังสือจม
5. [ ] ตรวจสอบว่าระบบมีความปลอดภัยเรื่อง Concurrency และไม่มี Race Condition (Atomic updates)
6. [ ] ตรวจสอบว่าได้อัปเดตไฟล์ `agent.md` เรียบร้อยแล้วทุกครั้งก่อนส่งมอบงาน
