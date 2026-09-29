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

### 1.5 การจัดการตะกร้าสินค้าและการบังคับเข้าสู่ระบบก่อนชำระเงิน (Guest Cart & Checkout Authentication Guard) 🛒🔐
- ❌ **ห้ามอนุญาตให้ Guest (ผู้ใช้ที่ยังไม่ได้เข้าสู่ระบบ) ส่งคำสั่งซื้อ (Create Order) โดยเด็ดขาด**:
  - ผู้ใช้ที่ไม่ผ่านการยืนยันตัวตน (Unauthenticated) จะต้องไม่สามารถผ่านขั้นตอนชำระเงิน (`/checkout`) ได้ หากเข้าหน้านี้โดยตรงระบบต้องแสดง Auth Wall เพื่อให้เข้าสู่ระบบก่อนเสมอ
- ✅ **Guest Cart (จัดเก็บตะกร้าชั่วคราวใน Session/Cookie)**:
  - ขณะที่ยังไม่ได้ล็อกอิน การกดเพิ่มสินค้า (`addToCart`), แก้ไขจำนวน (`updateCartItem`), หรือลบสินค้า (`removeCartItem`) จะต้องจัดเก็บข้อมูลไว้ใน Cookie เบราว์เซอร์ชื่อ `mc_guest_cart` (อายุ 7 วัน)
  - ใน Cookie จะเก็บเฉพาะ `{ productId, quantity }` และเมื่อ Client ดึงข้อมูล (`getCart`) ระบบจะ Hydrate ข้อมูลสินค้าจริงแบบเรียลไทม์จากฐานข้อมูลเพื่อให้ได้ราคา, รูปภาพ, ชื่อสินค้า และสต็อกปัจจุบันเสมอ
- ✅ **Cart Migration on Login (การโอนย้ายตะกร้าเข้าสู่บัญชีผู้ใช้)**:
  - เมื่อผู้ใช้เข้าสู่ระบบสำเร็จ (ทั้ง `loginAction` และ `registerAction`) ระบบจะต้องส่งรายการสินค้าจาก Cookie ไปยัง API Endpoint `POST /cart/merge`
  - ฝั่ง Backend (`CartService.mergeCart`) จะนำสินค้าเข้าสู่ตะกร้าของ User ในฐานข้อมูล โดยหากมีสินค้าเดิมอยู่แล้วจะบวกจำนวนเพิ่ม (พร้อมตรวจสอบ `isActive` และไม่ให้เกินจำนวนสต็อกคงเหลือจริง)
  - หลังจากรวมตะกร้าสำเร็จ ต้องลบ Cookie `mc_guest_cart` ออกจากเครื่องทันที
- ✅ **Seamless Redirect Flow**:
  - ปุ่มสั่งซื้อใน Cart Drawer สำหรับ Guest จะแสดงข้อความ `"เข้าสู่ระบบเพื่อชำระเงิน · ฿..."` และส่งต่อ URL Parameter ไปยังหน้า Login เช่น `/login?redirect=/checkout` (พร้อมแนบโค้ดโปรโมชั่น `?promo=...` หากมี)
  - เมื่อล็อกอินเสร็จ ระบบจะนำทางผู้ใช้กลับไปยังหน้าปลายทางที่ส่งมาทันทีอย่างไร้รอยต่อ

### 1.6 กฎการอัปเดต agent.md เสมอ (Continuous Documentation Rule) 📝
- ⚠️ **ทุกๆ ครั้งหลังจากทำงานเสร็จ ให้ไปอัปเดต `agent.md` เสมอ**:
  - เมื่อมีการแก้ไขโค้ด พัฒนาฟีเจอร์ใหม่ ปรับปรุงโครงสร้าง หรือค้นพบข้อจำกัด/ข้อควรระวังใหม่ๆ AI Agent จะต้องมาอัปเดตเอกสาร `agent.md` นี้ทุกครั้งก่อนส่งมอบงาน เพื่อให้คอมพิวเตอร์เครื่องอื่นหรือ Agent ถัดไปสามารถทำงานต่อได้อย่างต่อเนื่องและถูกต้อง

### 1.7 การป้องกัน Flash of Unauthenticated Content (Anti-FOUC & Client Auth Caching) ⚡🔐
- ❌ **ห้ามปล่อยให้ UI กะพริบแสดงสถานะไม่ได้เข้าสู่ระบบ (เช่น ปุ่ม "เข้าสู่ระบบ", "เข้าสู่ระบบแอดมิน", หรือ "เข้าสู่ระบบเพื่อชำระเงิน") ในจังหวะที่ผู้ใช้รีเฟรชหน้าเว็บ**:
  - เมื่อ API ตอบสนองช้า การเริ่ม State ด้วย `user = null` โดยตรงจะทำให้ UI ตกไปเข้ากิ่ง Unauthenticated ทันทีเป็นเวลา 200ms - 2s ก่อนจะพลิกกลับมาเมื่อ API ตอบกลับ ทำให้ผู้ใช้รู้สึกว่าระบบกะพริบและเข้าใจผิดว่าหลุดจากระบบ
- ✅ **สิ่งที่ต้องทำ**:
  1. ใช้ฟังก์ชัน `getCachedUser()` ในโมดูล `web/lib/auth/auth-state.ts` เพื่ออ่านค่าโปรไฟล์ผู้ใช้จาก `localStorage` ทันทีตั้งแต่รอบ Render แรกสุดแบบ Synchronous
  2. กำกับด้วยสถานะ `authLoading` ในช่วงที่ยังไม่มี Cache: หากกำลังรอตรวจสอบสิทธิ์รอบแรกจาก Server ให้แสดง Subtle Skeleton Placeholder หรือ Neutral State แทนการเรนเดอร์ปุ่มชวนล็อกอิน
  3. ฟังก์ชัน `getCurrentUser()` ฝั่งเซิร์ฟเวอร์ (`session.ts`) ต้องรองรับการต่ออายุโทเค็นอัตโนมัติ (`refreshSession`) เมื่อ Access Token หมดอายุ เพื่อป้องกันไม่ให้คืนค่า `null` ทั้งที่ Refresh Token ยังใช้งานได้
  4. เมื่อ Login / Register สำเร็จ ต้องเรียก `setCachedUser(user)` และเมื่อ Logout ต้องเรียก `setCachedUser(null)` เพื่อซิงก์ข้อมูลข้ามคอมโพเนนต์ด้วย Pub/Sub Event ทันที
  5. ในหน้า Admin (`/dashboard`, `/order`, `/inventory`, `/category`, `/promotion`) หากตรวจพบว่ามี Cached User เป็น Admin ให้โหลดข้อมูลหน้าจอคู่ขนานกันทันที ไม่ต้องรอ Waterfall ของการเช็ค Session ทำให้เปิดหน้าเว็บได้เร็วขึ้นอย่างมาก

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
  - `web/app/(admin)/`: หน้าจอสำหรับผู้ดูแลระบบ (`/dashboard`, `/order`, `/inventory`, `/category`, `/promotion`)
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

### 4.6 รูปแบบปุ่มนำทางและไอคอนทรงกลม (Circular Action Icons & Identity Design) 🛒👤🛡️
เพื่อให้ส่วนหัว (Header) และแบบฟอร์มเข้าสู่ระบบมีความเรียบหรู ทันสมัย และสอดคล้องกันทั่วทั้งระบบ ให้ยึดหลักการจัดรูปแบบไอคอนทรงกลมดังนี้:
1. **หน้าร้านค้า (Storefront Header)**:
   - **ปุ่มตะกร้าสินค้า (Cart Button)**: ใช้ปุ่มทรงกลม (`w-9 h-9 sm:w-10 sm:h-10 rounded-full`) แสดงเฉพาะไอคอนตะกร้า พร้อม Badge ตัวเลขสินค้าลอยมุมบนขวา (`absolute -top-1 -right-1`)
   - **ปุ่มโปรไฟล์ผู้ใช้เมื่อล็อกอินแล้ว (Customer Popover)**: แสดงชื่อลูกค้า (Display Name) ไว้ **ข้างหน้า** แล้วตามด้วยปุ่ม Avatar ทรงกลม (`w-9 h-9 sm:w-10 sm:h-10 rounded-full`)
   - **ปุ่มเข้าสู่ระบบเมื่อยังไม่ได้ล็อกอิน (Storefront Login)**: แสดงข้อความ `"เข้าสู่ระบบ"` ไว้ **ข้างหน้า** แล้วตามด้วยไอคอนทรงกลม (`rounded-full`) ของผู้ใช้ (User Icon)
2. **ระบบจัดการหลังร้าน (Admin Console Header)**:
   - **ป้ายแสดงตัวตน Admin**: แสดงสถานะออนไลน์พร้อมชื่อแอดมินไว้ **ข้างหน้า** (`🟢 Admin: <username>`) ตามด้วย Avatar ทรงกลมรูปโล่ป้องกัน (`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-purple-800 border-divider`)
   - **ปุ่มกลับไปหน้าร้านค้า (Back to Storefront)**: ใช้ปุ่มทรงกลม (`rounded-full`) แสดงไอคอนร้านค้า/บ้าน พร้อม Tooltip กำกับ `"กลับไปหน้าร้านค้า"`
   - **ปุ่มออกจากระบบ (Admin Logout)**: ใช้ปุ่มทรงกลม (`rounded-full`) แสดงไอคอนประตูทางออก/Logout สีกุหลาบ (`border-rose-200 text-rose-600 hover:bg-rose-50`) พร้อม Tooltip กำกับ `"ออกจากระบบ"`
3. **หน้าจอเข้าสู่ระบบ (Login & Admin Console Forms)**:
   - ด้านบนของการ์ดฟอร์มแสดงไอคอนสัญลักษณ์ทรงกลม (Circular Avatar / Shield Icon) ก่อนหัวข้อ
   - บัญชีทดสอบด่วน (Quick Demo Accounts) มี Badge ทรงกลมกำกับประเภทบัญชี (Admin รูปโล่ `🛡️`, Customer รูปคน `👤`) สอดคล้องกับธีมสีของแต่ละบทบาท
   - จัดเรียงปุ่ม Quick Demo ในแนวตั้ง (Vertical Stack `flex flex-col w-full`) พร้อม `min-w-0` เพื่อให้ชื่อบัญชีและอีเมลบรรจุอยู่ภายในการ์ดอย่างสมบูรณ์แบบโดยไม่ล้นขอบ (No Overflow) ทั้งบน Desktop และ Mobile

### 4.7 รูปแบบการแสดงสถานะสต็อกสินค้าในหน้า Catalog (Catalog Stock Status Design) 📦🏷️
เพื่อให้การแสดงสถานะสต็อกสินค้าในหน้ารายการสินค้า (`/list` และหน้าแรก) กลมกลืนกับธีมเว็บไซต์ (Editorial Warm Minimalist Theme) และไม่สร้างความรกสายตา:
- ❌ **ห้ามใช้สีเหลืองนีออนสะท้อนแสง (`amber-400`) หรือสีแดงสดจัดจ้าน (`rose-600`) แปะเป็นแถบสติ๊กเกอร์เตือนภัยเด็ดขาด**
- ✅ **ป้ายบอกสถานะบนรูปภาพสินค้า (Overlay Badges)**:
  - วางตำแหน่งที่มุมบนขวาของการ์ดรูปภาพ (`top-2.5 right-2.5`) เพื่อความสมดุลกับข้อมูลฝั่งซ้าย
  - ใช้รูปทรงแคปซูลมน (`rounded-full`) พร้อมกระจกฝ้าโปร่งแสง (`backdrop-blur-md`)
  - **สินค้าหมด (Sold Out)**: ใช้พื้นหลังกระจกฝ้าสีเข้มคลาสสิก (`bg-neutral-900/80 backdrop-blur-md text-white border border-white/10`) แสดงข้อความ `"สินค้าหมด"` พร้อมลดความสว่างของรูปสินค้าลงเล็กน้อย (`opacity-65 grayscale-[35%]`)
  - **สินค้าเหลือน้อย ($\le 10$ ชิ้น)**: ใช้พื้นหลังสีครีมกระจกฝ้าอบอุ่น (`bg-amber-50/95 backdrop-blur-md border border-amber-200/90 text-amber-900`) พร้อมจุดไฟกระพริบสีอำพันอ่อน (`bg-amber-500 animate-pulse`) แสดงข้อความ `"เหลือ {stock} ชิ้น"`
  - **สินค้าพร้อมส่งปกติ ($> 10$ ชิ้น)**: ไม่ต้องมีป้ายทับบนรูปภาพ เพื่อคงความสะอาดตาของรูปสินค้า
- ✅ **ข้อความสต็อกภายในการ์ด (Card Body Stock Text)**:
  - สินค้าหมด: แสดงข้อความ `"หมดสต็อก"` สีเทากลางสุภาพ (`text-neutral-500 font-medium`)
  - สินค้าเหลือน้อย: แสดงจุดไฟสีอำพัน พร้อมข้อความ `"เหลือ {stock} ชิ้น"` (`text-amber-800 font-semibold`)
  - สินค้าพร้อมส่ง: แสดงจุดไฟสีเขียว พร้อมข้อความ `"พร้อมส่ง ({stock})"` (`text-neutral-700 font-medium`)

### 4.8 แถบตัวกรองคำสั่งซื้อและการส่งออกข้อมูล CSV (Order Filters Toolbar & CSV Export Rules) 📊📁
เพื่อให้การจัดการคำสั่งซื้อมีความยืดหยุ่น รวดเร็ว และจัดวางองค์ประกอบได้อย่างเป็นระเบียบ:
1. **การจัดวางแบบ 2 ชั้น (2-Tier Toolbar Layout)**:
   - **แถวที่ 1 (สถานะคำสั่งซื้อ & ค้นหา)**: กลุ่มปุ่มสถานะ (`ทั้งหมด`, `รอชำระ`, `กำลังจัดของ`, `จัดส่งแล้ว`, `ยกเลิก`) ฝั่งซ้าย และช่องค้นหา (`เลขออเดอร์ / ชื่อลูกค้า`) ฝั่งขวา
   - **แถวที่ 2 (ช่วงเวลาย้อนหลัง & ส่งออก CSV)**: กลุ่มตัวกรองวันที่ (`ทั้งหมด`, `1 วัน`, `7 วัน`, `30 วัน`, `1 ปี`) พร้อมไอคอนปฏิทิน ฝั่งซ้าย และปุ่ม `ส่งออก CSV` โทนสีเขียวสุภาพพร้อม Badge แสดงจำนวนรายการที่กำลังกรองอยู่ ฝั่งขวา
2. **มาตรฐานการส่งออกไฟล์ CSV (CSV Export Standards)**:
   - ⚠️ **ต้องขึ้นต้นไฟล์ด้วย UTF-8 BOM (`\uFEFF`) เสมอ**: เพื่อป้องกันไม่ให้ภาษาไทยกลายเป็นภาษาต่างดาวเมื่อเปิดด้วยโปรแกรม Microsoft Excel ทั้งบน Windows และ macOS
   - **กรองตามเงื่อนไขจริง (Filter-Aware Export)**: ข้อมูลใน CSV ต้องตรงตามสถานะ, ช่วงเวลา, และคำค้นหาที่ผู้ใช้กำลังเปิดดูอยู่ในขณะนั้นอย่างแม่นยำ
   - **การ Escape ข้อความในเซลล์**: ข้อความทุกคอลัมน์ต้องถูกครอบด้วย Double Quotes และแทนที่ `"` ด้วย `""` เสมอ เพื่อป้องกันโครงสร้าง CSV เสียหายเมื่อข้อมูลมีเครื่องหมายจุลภาคหรือขึ้นบรรทัดใหม่

### 4.9 กราฟแสดงรายรับต่อวันในหน้า Overview (Daily Revenue Graph & Analytics UX) 📈💰
- ติดตั้งคอมโพเนนต์ `DailyRevenueChart` ในหน้า Overview (`/dashboard`) เพื่อให้ผู้บริหารมองเห็นแนวโน้มยอดขายได้อย่างชัดเจน
- **Pure SVG Implementation**: ใช้ SVG ในการวาดกราฟเส้นโค้ง (Bézier Curve) และพื้นที่ไล่ระดับสี (Gradient Fill) ร่วมกับแท่งกราฟคอลัมน์ เพื่อความเร็วสูง น้ำหนักเบา ไม่พึ่งพาไลบรารีภายนอกขนาดใหญ่
- **ช่วงเวลายืดหยุ่น**: มีปุ่มสลับช่วงเวลา `7 วัน`, `14 วัน`, และ `30 วัน` พร้อมสรุปยอดขายรวม, ค่าเฉลี่ยต่อวัน, และวันที่มียอดขายสูงสุด (Peak Day)
- **Data Integrity**: คำนวณรายรับเฉพาะคำสั่งซื้อที่ไม่ถูกยกเลิก (`statusText !== "cancelled"`) เพื่อความถูกต้องทางบัญชี
- **Interactive Tooltip**: มี Tooltip สีเข้มคมชัด แสดงวันที่, วันในสัปดาห์, ยอดเงินสุทธิ และจำนวนบิลเมื่อนำเมาส์ไปชี้ที่จุดข้อมูลแต่ละวัน

### 4.10 การส่งออกข้อมูลสินค้าและสต็อกทั้งหมดเป็น CSV (Stock & Inventory CSV Export) 📦📋
- **ปุ่มส่งออก CSV ทั้งหมด**: ติดตั้งปุ่ม `ส่งออก CSV (ทั้งหมด)` ที่ Header ของหน้าสินค้า & สต็อก (`/inventory`) เคียงข้างปุ่ม `+ เพิ่มสินค้าใหม่`
- **Full Inventory Export**: ดึงรายการสินค้าทั้งหมดในระบบผ่าน `getProducts()` โดยไม่ต้องผ่านตัวกรองหน้าหรือช่วงเวลา เพื่อให้ได้ Snapshot สถานะคลังสินค้าครบถ้วน 100%
- **มาตรฐาน UTF-8 BOM**: ใส่ `\uFEFF` นำหน้าเนื้อหา CSV เสมอ เพื่อให้เปิดด้วยโปรแกรม Microsoft Excel แล้วภาษาไทยไม่เป็นภาษาต่างดาว
- **คอลัมน์มาตรฐาน**: รหัสสินค้า (SKU), ชื่อสินค้า, หมวดหมู่, ราคาขาย (บาท), สต็อกคงเหลือ, จองไว้, พร้อมส่ง, สถานะสต็อก, สถานะการขาย, และรหัสระบบ (ID)

### 4.11 วงจรชีวิตสินค้า การจัดเก็บถาวร (Archive) และการลบถาวรอย่างปลอดภัย (Product Archiving, Safe Hard Deletion & Cover Image Selection) 📦🛡️
เพื่อให้การจัดการแคตตาล็อกสินค้ามีความปลอดภัย ป้องกันความผิดพลาดจากการเผลอกดลบสินค้าโดยไม่ตั้งใจ และรักษาความถูกต้องของประวัติบัญชี/คำสั่งซื้อในอดีต:
1. **ขั้นตอน 2 ระดับในการนำสินค้าออกจากระบบ (Two-Step Deletion Flow)**:
   - **ระดับที่ 1: การเก็บถาวร (Archive)**:
     - ในหน้าต่างแก้ไขสินค้า (`Edit Product Modal`) ของสินค้าที่เปิดขายอยู่ (`isActive === true`) **ต้องไม่มีปุ่มลบสินค้าโดยตรง** แต่จะแสดงปุ่ม `"📦 เก็บถาวร (Archive)"` โทนสีอำพัน (`bg-amber-50 border-amber-300 text-amber-800`)
     - เมื่อกดเก็บถาวร ระบบจะตั้งค่า `isActive: false` สินค้าจะไม่แสดงที่หน้าร้านค้า (`/list` และ `/`) และหากเข้าชมผ่าน URL ตรง ระบบจะแสดงข้อความแจ้งเตือนว่าสินค้าถูกเก็บถาวรพร้อมปุ่มกลับไปหน้าร้าน
     - ในตารางสินค้าหลังร้าน จะแสดงชิปสถานะสีเข้มคลาสสิก `"เก็บถาวร (Archive)"` พร้อมตัวกรองแท็บแยก `"เก็บถาวร"` (`filter: "archived"`)
   - **ระดับที่ 2: การลบสินค้าถาวร (Delete Permanently) หรือกู้คืน (Restore / Unarchive)**:
     - เมื่อสินค้าอยู่ในสถานะเก็บถาวรแล้วเท่านั้น (`isActive === false`) หน้าต่างแก้ไขสินค้าจะแสดงแถบแจ้งเตือนสถานะสีเข้ม พร้อมตัวเลือก 2 ปุ่ม:
       1. **"🗑️ ลบสินค้าถาวร"**: โทนสีแดง (`bg-rose-50 hover:bg-rose-600 border-rose-300 text-rose-700`) เพื่อลบข้อมูลออกจากฐานข้อมูล
       2. **"↩️ นำกลับมาขาย"**: โทนสีเขียวมรกต (`bg-emerald-50 border-emerald-300 text-emerald-800`) เพื่อกู้คืนสถานะเป็นเปิดขาย (`isActive: true`)
2. **การลบถาวรอย่างปลอดภัยต่อระบบบัญชีและคำสั่งซื้อ (Safe Transactional Hard Deletion)**:
   - ใน `ProductRepository.delete(id)` Backend ต้องทำงานภายใต้ Transaction (`this.prisma.$transaction`):
     1. ลบรายการสินค้านี้ออกจากตะกร้า (`tx.cartItem.deleteMany({ where: { productId: id } })`)
     2. ปลด Foreign Key ในรายการออเดอร์เก่า (`tx.orderItem.updateMany({ where: { productId: id }, data: { productId: null } })`) เพื่อคงยอดรวมคำสั่งซื้อ ยอดขายในอดีต และใบเสร็จรับเงินไว้ 100% โดยไม่เกิดข้อผิดพลาด Foreign Key Constraint
     3. ลบแถวข้อมูลสินค้าออกจากตาราง `Product` (`tx.product.delete({ where: { id } })`)
3. **การคลิกเลือกรูปหลักในแกลเลอรีรูปภาพ (Click-to-Select Main/Cover Image UX)**:
   - ในแกลเลอรีรูปภาพสินค้าทั้งตอนเพิ่มสินค้าใหม่ (`Create Modal`) และแก้ไขสินค้า (`Edit Modal`):
   - รูปภาพแรกสุด (Index 0) จะแสดงป้าย Badge `[⭐ รูปหลัก]` พร้อมเส้นขอบเน้นสีน้ำเงิน (`ring-2 ring-accent`)
   - สำหรับรูปภาพลำดับอื่นๆ ผู้ดูแลระบบสามารถคลิกที่รูปภาพใดก็ได้เพื่อเลื่อนรูปนั้นขึ้นมาเป็น **รูปหลัก (Index 0)** ทันที พร้อมแสดง Tooltip และ Hover Overlay `"ตั้งเป็นรูปหลัก"` อย่างชัดเจน
   - ปุ่มลบรูป (`✕`) มีการดักจับ `e.stopPropagation()` เพื่อให้ลบรูปออกได้โดยไม่ส่งผลให้เกิดการตั้งเป็นรูปหลักโดยไม่ตั้งใจ

4. **สถาปัตยกรรมแยกโมดูลย่อยเป็น Component-Based Architecture (Strict Single Responsibility)**:
   - **กฎเหล็ก**: ห้ามเขียนโค้ดรวมทุกอย่างไว้ในไฟล์ `page.tsx` ขนาดใหญ่เพียงไฟล์เดียว แต่ต้องแยกย่อยเป็นคอมโพเนนต์เฉพาะทางภายใต้โฟลเดอร์ `web/components/<feature>/`
   - **โครงสร้างคอมโพเนนต์ที่จัดระเบียบแล้ว**:
     - `web/components/confirm-modal.tsx`: กล่องโต้ตอบ Modal สากลสำหรับทั้งการแจ้งเตือน (Alert) และการยืนยัน (Confirmation)
     - `web/components/category/`:
       - `category-table.tsx`: ตารางแสดงรายการหมวดหมู่สินค้า พร้อม Badge จำนวนสินค้าที่ผูกอยู่ และปุ่มแก้ไข/ลบ
       - `create-category-modal.tsx`: แบบฟอร์มเพิ่มหมวดหมู่สินค้าใหม่ พร้อมระบบป้องกันชื่อซ้ำ
       - `edit-category-modal.tsx`: แบบฟอร์มแก้ไขชื่อหมวดหมู่สินค้า
     - `web/components/inventory/`:
       - `image-gallery-uploader.tsx`: คอมโพเนนต์อัปโหลดรูปภาพผ่าน Cloudinary และเลือกรูปหลัก
       - `refill-stock-modal.tsx`: ป๊อปอัปเติมสต็อกด่วนพร้อมชิปเพิ่มจำนวน (+5, +10, +20, +50)
       - `create-product-modal.tsx`: แบบฟอร์มเพิ่มสินค้าใหม่
       - `edit-product-modal.tsx`: แบบฟอร์มแก้ไขสินค้า พร้อมระบบ 2-step deletion (Archive / Hard Delete / Restore)
       - `import-product-modal.tsx`: หน้าต่างนำเข้าสินค้าแบบ Bulk Import (Excel .xlsx / CSV) พร้อมดาวน์โหลด Template, พรีวิวและตรวจสอบความถูกต้องแบบเรียลไทม์
       - `inventory-table.tsx`: ตารางแสดงรายการสินค้า แถบ progress สต็อก และ Pagination
       - `inventory-toolbar.tsx`: แถบค้นหา แท็บตัวกรองสถานะ ปุ่มนำเข้า Excel/CSV และปุ่ม Export CSV ทั้งหมด
     - `web/components/order/`:
       - `order-toolbar.tsx`: แท็บสถานะออเดอร์, ช่องค้นหา, ตัวกรองย้อนหลัง 1วัน/7วัน/30วัน/1ปี/ทั้งหมด, และปุ่ม Export CSV ตามตัวกรอง
       - `order-table.tsx`: ตารางคำสั่งซื้อ ป้ายกำกับช่องทางจำหน่าย ยอดสุทธิ และปุ่มดูรายละเอียด
       - `order-details-modal.tsx`: หน้าต่างแสดงรายละเอียดออเดอร์ รายการสินค้า ข้อมูลจัดส่ง และการเปลี่ยนสถานะ
       - `create-order-modal.tsx`: แบบฟอร์มสร้างออเดอร์แบบ Manual พร้อมระบบคำนวณและตรวจสอบโควตาส่วนลด
     - `web/components/promotion/`:
       - `promotion-table.tsx`: ตารางแคมเปญโปรโมชั่น พร้อมสถานะและโควตาการใช้งาน
       - `create-promotion-modal.tsx`: แบบฟอร์มสร้างโปรโมชั่นใหม่
       - `edit-promotion-modal.tsx`: แบบฟอร์มแก้ไขและลบโปรโมชั่น
     - `web/components/storefront/`:
       - `product-card.tsx`: การ์ดสินค้าหน้าร้าน พร้อมภาพอัตราส่วน 4:3, ป้ายบอกสต็อกคงเหลือ, ป้ายหมวดหมู่, และปุ่มใส่ตะกร้า
       - `filter-sidebar.tsx`: แถบตัวกรองด้านข้างบนหน้าจอคอมพิวเตอร์ (Desktop Sticky Sidebar)
       - `mobile-filters.tsx`: แถบชิปหมวดหมู่ด่วน และหน้าต่างสไลด์ตัวกรองจากด้านล่าง (Bottom Sheet) สำหรับมือถือ
       - `active-filter-chips.tsx`: ชิปแสดงตัวกรองที่เลือกอยู่ พร้อมปุ่มล้างตัวกรองแบบ One-Tap Clear

5. **ระบบกล่องข้อความแจ้งเตือนและยืนยันแบบ In-App Dialog (`ConfirmModal`) แทน Browser Native Alerts**:
   - ห้ามใช้ `window.alert(...)` หรือ `window.confirm(...)` ดั้งเดิมของเบราว์เซอร์เด็ดขาด เพราะทำให้ UX ขาดความต่อเนื่องและไม่สวยงาม
   - ใช้คอมโพเนนต์ `ConfirmModal` ที่รองรับ:
     - 4 รูปแบบ (Variants): `danger`, `warning`, `info`, `success` พร้อมไอคอนและสีสันสอดคล้องตาม Design System
     - แบ็กดรอปเบลอ (`backdrop-blur-sm bg-black/40`), แอนิเมชัน Zoom-In, รองรับการกดปุ่ม `ESC` เพื่อปิด
     - รองรับทั้งโหมด 2 ปุ่ม (Confirm / Cancel) และโหมด Alert ปุ่มเดียว (ส่ง `cancelText={null}`)
     - ป้องกัน Double-submit ด้วยสถานะ `isLoading` และไอคอน Spinner หมุนระหว่างบันทึกข้อมูล

6. **ระบบนำเข้าสินค้าและสต็อกแบบกลุ่ม (Bulk Product & Stock Import System)**:
   - รองรับไฟล์ทั้งรูปแบบ **Excel (.xlsx, .xls)** และ **CSV (.csv)** ผ่านการประมวลผลบนเบราว์เซอร์ด้วย `xlsx` (SheetJS)
   - **Template ดาวน์โหลด**:
     - มีปุ่มให้แอดมินดาวน์โหลด Template ทั้ง `.xlsx` (มีหัวตารางสไตล์สี, ความกว้างคอลัมน์ และตัวอย่างข้อมูล) และ `.csv` (มี UTF-8 BOM ป้องกันภาษาไทยเพี้ยน)
   - **การอัปเดตสต็อกและข้อมูล (SKU Upsert Rule)**:
     - หากรหัสสินค้า (`sku`) **ตรงกับสินค้าเดิมในระบบ**: จะทำการอัปเดตข้อมูลและ **"เขียนทับสต็อกเดิม" (Overwrite Stock)** ด้วยค่าใหม่จากไฟล์ทันที (ตามนโยบายข้อ ข)
     - หากรหัสสินค้า (`sku`) **เป็นสินค้าใหม่**: จะทำการบันทึกข้อมูลเป็นสินค้าใหม่ในระบบ
   - **การข้ามแถวที่ผิดพลาด (Fault-Tolerant Skip-on-Error Rule)**:
     - หากแถวใดในไฟล์มีข้อมูลไม่ถูกต้อง (เช่น ขาด SKU, ขาดชื่อสินค้า, ราคาติดลบ, สต็อกไม่ใช่ตัวเลข หรือหมวดหมู่ไม่มีในระบบ) ระบบจะ **"ข้าม (Skip) บรรทัดนั้นไป"** และดำเนินการประมวลผลบรรทัดอื่นๆ ต่อไปจนจบไฟล์ ไม่มีการยกเลิกทั้งไฟล์
     - ระบบจะบันทึกหมายเลขแถว (Row Number) พร้อมเหตุผลของข้อผิดพลาดไว้อย่างละเอียด
   - **กฎการตรวจสอบหมวดหมู่สินค้า (Category Validation Rule)**:
     - หากชื่อหมวดหมู่ในไฟล์ไม่มีอยู่ในระบบ ฐานข้อมูล **จะไม่สร้างหมวดหมู่ให้อัตโนมัติ** แต่จะถือเป็น Error Case โดยข้ามแถวนั้นทันที และแจ้งเตือนให้ผู้ดูแลระบบไปสร้างหมวดหมู่ในระบบก่อน
   - **หน้าต่างรายงานผลแบบละเอียด (Import Summary Modal)**:
     - แสดงสรุปตัวเลข: ทั้งหมด, สำเร็จ, สินค้าใหม่, อัปเดตสินค้าเดิม, และข้อผิดพลาด
     - แสดงตารางรายละเอียดแถวที่ไม่ผ่านพร้อมเหตุผลชัดเจน

7. **ระบบจัดการหมวดหมู่สินค้าหลังร้าน (Admin Category Management `/category`)**:
   - เพิ่มเมนูที่ 5 ใน Navigation Sidebar ของแอดมิน: `"หมวดหมู่สินค้า"` (`/category`)
   - รองรับการดูรายการหมวดหมู่ทั้งหมด พร้อมแสดงจำนวนสินค้า (`productCount`) ที่ผูกอยู่กับแต่ละหมวดหมู่
   - รองรับการสร้างหมวดหมู่ใหม่ และแก้ไขชื่อหมวดหมู่
   - **ความปลอดภัยในการลบหมวดหมู่ (Safe Category Deletion)**:
     - เมื่อลบหมวดหมู่ ระบบจะไม่ลบสินค้าที่อยู่ภายใน แต่จะทำการปลดความสัมพันธ์ (`catagoryId = null`) อย่างปลอดภัยภายใต้ Transaction ก่อน แล้วจึงลบหมวดหมู่นั้น เพื่อป้องกันปัญหา Foreign Key Constraint และไม่ทำให้ข้อมูลสินค้าสูญหาย

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

3. **ความสอดคล้องของ Layout และ Navbar ในระบบจัดการหลังร้าน (Admin Unified Layout & Navbar Consistency - v1.0.2 Hotfix)**:
   - **มาตรฐานโครงสร้าง Layout**: ทุกหน้าของผู้ดูแลระบบ (`/dashboard`, `/order`, `/inventory`, `/category`, `/promotion`) ต้องใช้โครงสร้างเดียวกันแบบ Flush Edge สอดรับกับหน้าจอ:
     - Outer Container: `<div className="flex flex-col md:flex-row min-h-screen bg-bg text-text">`
     - Sidebar ด้านซ้าย: `<AdminSidebar />` ชิดขอบซ้าย ยืดเต็มความสูง (`min-h-screen`) บนหน้าจอเดสก์ท็อป (`md:flex`) และซ่อนแถบแนวนอนบนหน้าจอมือถือ (`hidden md:flex`)
     - Main Content Area: `<main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">`
     - ❌ **ข้อห้าม**: ห้ามห่อหน้าหลังร้านด้วยการ์ดลอย (`max-w-7xl mx-auto px-4 ... rounded-2xl shadow-md border`) ซึ่งจะทำให้ Sidebar ถูกบีบขังอยู่ในการ์ดลอยตรงกลางจอ และเกิดขอบสีเทาว่างเปล่ารอบทิศทาง
   - **แถบนำทางส่วนหัวสำหรับผู้ดูแลระบบ (Dedicated Admin Header)**:
     - ในหน้าหลังร้านทั้งหมด (`isAdminPath`) แถบนำทางด้านบนจะแสดงเป็น **Admin Header** เฉพาะทางอย่างชัดเจน:
       - แสดงชื่อแบรนด์ `Mini Commerce` พร้อม Badge `Admin Console`
       - มีปุ่มแฮมเบอร์เกอร์ (`☰`) บนหน้าจอมือถือ (`flex md:hidden`) เพื่อเปิด Mobile Admin Drawer แบบสไลด์ออกด้านข้าง พร้อมปุ่มปิด Backdrop เบลอ และปิดอัตโนมัติเมื่อกดเปลี่ยนหน้าหรือกด `Escape`
       - มีปุ่ม `ดูหน้าร้านค้า` (Storefront Shortcut) สำหรับสลับกลับไปหน้าร้านค้าได้สะดวกรวดเร็ว
       - แสดงชิปสถานะ `🟢 Admin: <name>` พร้อม Shield Avatar ทรงกลมสีม่วง
       - เมนู Popover บรรจุเฉพาะคำสั่งของผู้ดูแลระบบ (ดูหน้าร้านค้า, ภาพรวมร้าน, ออกจากระบบ)
       - ❌ **ข้อห้าม**: ห้ามแสดงลิงก์หน้าร้าน `"สินค้าทั้งหมด"`, ห้ามแสดงปุ่มตะกร้าสินค้า (`CartDrawer Button`), ห้ามแสดงเมนู `"ประวัติคำสั่งซื้อของฉัน"` บนหน้าจอของผู้ดูแลระบบ, และห้ามแสดงแถบเลื่อนแนวนอนของ Sidebar ใต้ Header บนจอมือถือ

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
