# ANIMEiNDY for Stremio (Starter)

โปรเจกต์นี้เป็น Add-on ชุมชนที่ไม่เป็นทางการ ดึงข้อมูลรายการสาธารณะจากหน้าเว็บ ANIMEiNDY และให้ Stremio เปิดหน้าตอนบนเว็บไซต์ต้นทาง

## สถานะความสามารถในรุ่นเริ่มต้น
- Catalog: ตอนล่าสุด / ยอดนิยม (ตัวดึงการ์ดใช้โครงสร้าง HTML ของหน้าแรก)
- Search: ใช้ WordPress search `?s=`
- Metadata: เรื่องย่อ โปสเตอร์ และลิงก์ตอนที่หน้าเรื่องแสดงเป็นลิงก์
- Playback: ส่ง `externalUrl` ให้เปิดหน้าตอนบนเว็บต้นทาง
- Subtitle: ยังไม่เชื่อมผู้ให้บริการซับภายนอก
- Resume/ประวัติการดู: Stremio ไม่ได้ให้ add-on นี้เก็บสถานะการเล่นเว็บภายนอกโดยอัตโนมัติ

## ข้อจำกัดสำคัญ
รุ่นนี้ **ยังไม่ใช่ direct video player** และไม่ดึง URL ไฟล์วิดีโอ/สตรีมจาก embed หรือผู้ให้บริการภายนอก เพราะต้องตรวจสอบสิทธิ์และเงื่อนไขของแหล่งวิดีโอก่อน ไม่แกะ DRM, token, paywall หรือมาตรการควบคุมการเข้าถึง การเปิดเว็บภายนอกขึ้นกับ Stremio และอุปกรณ์ที่ใช้

เว็บไซต์อาจเปลี่ยน HTML, ปิดกั้นบอต หรือจำกัดคำขอ ทำให้ parser ต้องปรับปรุงภายหลัง

## ทดสอบในเครื่อง
ต้องใช้ Node.js 20+
1. แตก ZIP
2. เปิด terminal ในโฟลเดอร์
3. รัน `npm install`
4. รัน `npm start`
5. เปิด `http://localhost:7000/manifest.json`

## Deploy บน Render ผ่าน GitHub (มือถือ)
1. แตก ZIP ด้วยแอปจัดการไฟล์ใน Android
2. GitHub > `+` > New repository ตั้งชื่อ `animeindy-stremio` และสร้างแบบ Public หรือ Private
3. เข้า repository > Add file > Upload files แล้วอัปโหลด **ไฟล์และโฟลเดอร์ภายใน** โฟลเดอร์โปรเจกต์ (ไม่ใช่ ZIP ทั้งก้อน)
4. Commit changes
5. Render > New > Web Service > เชื่อม GitHub และเลือก repository
6. ตั้ง Build Command = `npm install`, Start Command = `npm start`, Plan = Free แล้ว Deploy
7. เมื่อสำเร็จ เปิด `https://ชื่อบริการ.onrender.com/manifest.json`
8. กดเปิด URL manifest ในอุปกรณ์ที่ติดตั้ง Stremio แล้วเลือก Install หากมีปุ่ม หรือคัดลอก URL ไป Add-on > Install via URL

หมายเหตุ: Free Web Service ของ Render จะ sleep หลังไม่มีการใช้งาน 15 นาที และอาจใช้เวลาประมาณหนึ่งนาทีในการตื่นครั้งแรก ดูรายละเอียดที่ https://render.com/docs/free

## ปรับ parser
ตัวดึงข้อมูลอยู่ใน `src/site.js` หากหน้าเว็บเปลี่ยน ให้ปรับ selector ใน `getHome`, `getAnime` และ `searchAnime`.

## เอกสาร
- Stremio Add-on SDK: https://www.stremio.com/addon-sdk
- Protocol: https://stremio.github.io/stremio-addon-sdk/protocol.html
- Render: https://render.com/docs/your-first-deploy
