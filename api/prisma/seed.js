const mariadb = require('mariadb');
const bcrypt = require('bcryptjs');

async function seed() {
  const pool = mariadb.createPool({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2arnLsBfYcZ7DHy.root',
    password: 'LM70euC4NkMY0Tr9',
    database: 'mini_commerce',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  const conn = await pool.getConnection();
  console.log('Connected to TiDB Cloud for seeding...');

  try {
    // 1. Users
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const customerPasswordHash = await bcrypt.hash('customer123', 10);

    await conn.query(`
      INSERT INTO \`User\` (\`email\`, \`passwordHash\`, \`role\`, \`createdAt\`)
      VALUES 
        ('admin@minicommerce.com', ?, 'admin', NOW(3)),
        ('customer@minicommerce.com', ?, 'customer', NOW(3))
      ON DUPLICATE KEY UPDATE \`passwordHash\` = VALUES(\`passwordHash\`), \`role\` = VALUES(\`role\`);
    `, [adminPasswordHash, customerPasswordHash]);
    console.log('Seeded Users: admin@minicommerce.com and customer@minicommerce.com');

    // 2. Categories
    const categories = ['เครื่องเสียง', 'อุปกรณ์ป้อนข้อมูล', 'อุปกรณ์เสริม', 'กระเป๋า'];
    const catMap = {};
    for (const name of categories) {
      let rows = await conn.query('SELECT id FROM `Category` WHERE name = ?', [name]);
      if (rows.length === 0) {
        const res = await conn.query('INSERT INTO `Category` (name) VALUES (?)', [name]);
        catMap[name] = Number(res.insertId);
      } else {
        catMap[name] = rows[0].id;
      }
    }
    console.log('Seeded Categories:', catMap);

    // 3. Products
    const products = [
      { sku: 'SKU-2011', name: 'หูฟังไร้สาย Aero 2', price: 2490, stock: 42, cat: 'เครื่องเสียง', isActive: 1 },
      { sku: 'SKU-2041', name: 'ลำโพงพกพา Pebble', price: 1290, stock: 6, cat: 'เครื่องเสียง', isActive: 1 },
      { sku: 'SKU-2055', name: 'คีย์บอร์ด Mecha 68', price: 3150, stock: 0, cat: 'อุปกรณ์ป้อนข้อมูล', isActive: 1 },
      { sku: 'SKU-2078', name: 'เมาส์ Glide Pro', price: 890, stock: 128, cat: 'อุปกรณ์ป้อนข้อมูล', isActive: 1 },
      { sku: 'SKU-2090', name: 'สายชาร์จ USB-C 2 เมตร', price: 290, stock: 3, cat: 'อุปกรณ์เสริม', isActive: 1 },
      { sku: 'SKU-2103', name: 'ขาตั้งโน้ตบุ๊ก Rise', price: 1090, stock: 18, cat: 'อุปกรณ์เสริม', isActive: 1 },
      { sku: 'SKU-2117', name: 'กระเป๋าโน้ตบุ๊ก Carry 14"', price: 1450, stock: 0, cat: 'กระเป๋า', isActive: 1 },
      { sku: 'SKU-2126', name: 'ฮับ USB-C 7 พอร์ต', price: 1690, stock: 9, cat: 'อุปกรณ์เสริม', isActive: 1 },
    ];

    for (const p of products) {
      const catId = catMap[p.cat] || null;
      await conn.query(`
        INSERT INTO \`Product\` (\`sku\`, \`name\`, \`price\`, \`stock\`, \`catagoryId\`, \`isActive\`)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          \`name\` = VALUES(\`name\`),
          \`price\` = VALUES(\`price\`),
          \`stock\` = VALUES(\`stock\`),
          \`catagoryId\` = VALUES(\`catagoryId\`),
          \`isActive\` = VALUES(\`isActive\`);
      `, [p.sku, p.name, p.price, p.stock, catId, p.isActive]);
    }
    console.log('Seeded Products (8 items)');

    // 4. Promotions
    const now = new Date();
    const expiry30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiry60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const promos = [
      { code: 'SAVE10', type: 'percentage', value: 10, usageLimit: 1000, usedCount: 412, expiresAt: expiry30 },
      { code: 'FREESHIP', type: 'freeship', value: 50, usageLimit: 1000, usedCount: 980, expiresAt: expiry30 },
      { code: 'NEW300', type: 'fixed', value: 300, usageLimit: 500, usedCount: 150, expiresAt: expiry60 },
      { code: 'BUNDLE2', type: 'percentage', value: 15, usageLimit: 300, usedCount: 0, expiresAt: expiry60 },
    ];

    for (const pr of promos) {
      const existing = await conn.query('SELECT id FROM `Promotion` WHERE code = ?', [pr.code]);
      if (existing.length === 0) {
        await conn.query(`
          INSERT INTO \`Promotion\` (\`code\`, \`type\`, \`value\`, \`usageLimit\`, \`usedCount\`, \`expiresAt\`)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [pr.code, pr.type, pr.value, pr.usageLimit, pr.usedCount, pr.expiresAt]);
      } else {
        await conn.query(`
          UPDATE \`Promotion\` SET \`type\` = ?, \`value\` = ?, \`usageLimit\` = ?, \`usedCount\` = ?, \`expiresAt\` = ?
          WHERE code = ?
        `, [pr.type, pr.value, pr.usageLimit, pr.usedCount, pr.expiresAt, pr.code]);
      }
    }
    console.log('Seeded Promotions (4 campaigns)');

    console.log('Database seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
