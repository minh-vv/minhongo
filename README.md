# Minhongo — Ứng dụng học tiếng Nhật

Minhongo là ứng dụng web học tiếng Nhật với hệ thống flashcard dùng thuật toán lặp lại ngắt quãng SM-2, quiz, bài học theo lộ trình và bảng xếp hạng.

## Tech Stack

| Tầng | Công nghệ |
|------|-----------|
| Frontend | React 19, Vite, TailwindCSS, React Query, React Router |
| Backend | NestJS, Prisma ORM, PostgreSQL |
| Auth | JWT (access token), Passport.js |
| File upload | Multer |
| Email | Nodemailer (SMTP) |
| Triển khai | Docker Compose, Nginx |

## Tính năng chính

- **Flashcard + SM-2** — Tạo và ôn tập thẻ từ với thuật toán lặp lại ngắt quãng, tự động tính ngày ôn tiếp theo
- **Danh mục học** — Hán tự (Kanji), Từ vựng, Ngữ pháp, Tự học
- **JLPT levels** — Phân loại bộ thẻ và thẻ từ theo cấp N5–N1
- **Quiz & Bài tập** — Kiểm tra kiến thức dưới dạng trắc nghiệm và bài tập
- **Lộ trình học** — Hướng dẫn học theo lộ trình có cấu trúc
- **Tiến độ & Thống kê** — Biểu đồ lịch sử ôn tập, streak, điểm số
- **Bảng xếp hạng** — So sánh tiến độ với người dùng khác
- **Cộng đồng** — Chia sẻ bộ thẻ công khai
- **Quản trị** — Admin quản lý người dùng, nội dung và cài đặt hệ thống
- **Quên mật khẩu** — Gửi link đặt lại qua email SMTP

## Cấu trúc thư mục

```
minhongo/
├── backend/          # NestJS API (port 3002)
│   ├── src/
│   │   ├── auth/         # Đăng nhập, đăng ký, JWT, reset password
│   │   ├── users/        # Quản lý người dùng
│   │   ├── flashcards/   # Deck, Card, CardProgress, SM-2
│   │   ├── admin/        # Endpoint cho admin
│   │   └── system-config/# Cài đặt hệ thống
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── frontend/         # React SPA (port 80 qua Nginx)
│   └── src/
│       ├── pages/        # Các trang (Dashboard, Lesson, Quiz, ...)
│       ├── components/   # UI components dùng chung
│       ├── api/          # Axios API clients
│       ├── contexts/     # React contexts (Auth, ...)
│       └── hooks/        # Custom hooks
├── docker-compose.yml
├── .env.example
└── README.md
```

## Bắt đầu nhanh (Docker)

### Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (bao gồm Docker Compose)

### 1. Clone và cấu hình môi trường

```bash
git clone <repo-url>
cd minhongo
cp .env.example .env
```

Chỉnh sửa `.env`, bắt buộc phải đặt:

| Biến | Mô tả |
|------|-------|
| `POSTGRES_PASSWORD` | Mật khẩu PostgreSQL |
| `JWT_SECRET` | Secret để ký JWT — tạo bằng lệnh bên dưới |
| `SMTP_USER` / `SMTP_PASS` | Tài khoản Gmail và App Password |

Tạo `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Khởi động toàn bộ stack

```bash
docker compose up --build -d
```

Sau khi build xong:

- Frontend: [http://localhost](http://localhost)
- Backend API: [http://localhost:3002](http://localhost:3002)

### 3. Seed dữ liệu mẫu (tuỳ chọn)

```bash
docker compose exec backend npm run seed
```

## Phát triển local (không Docker)

### Yêu cầu

- Node.js 20+
- PostgreSQL 14+

### Backend

```bash
cd backend
cp .env.example .env   # chỉnh DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate dev
npm run seed           # dữ liệu mẫu
npm run start:dev
```

API chạy tại `http://localhost:3002`.

### Frontend

```bash
cd frontend
echo "VITE_API_URL=http://localhost:3002" > .env
npm install
npm run dev
```

App chạy tại `http://localhost:5173`.

## Biến môi trường

Xem file `.env.example` để biết đầy đủ các biến. Những biến quan trọng nhất:

```env
# PostgreSQL
POSTGRES_DB=minhongo
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<mật-khẩu-mạnh>

# JWT
JWT_SECRET=<chuỗi-ngẫu-nhiên-64-bytes>

# CORS — origin của frontend
CORS_ORIGIN=http://localhost

# SMTP (reset password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password

# URL backend (baked vào bundle frontend lúc build)
VITE_API_URL=http://localhost:3002
```

## Triển khai lên VPS

1. Sao chép toàn bộ source lên server
2. Tạo `.env` với IP/domain thực tế:
   ```env
   CORS_ORIGIN=http://<IP-server>
   FRONTEND_URL=http://<IP-server>
   VITE_API_URL=http://<IP-server>:3002
   ```
3. Chạy `docker compose up --build -d`

> Để dùng HTTPS, đặt Nginx reverse proxy hoặc Caddy trước stack và cập nhật các URL thành `https://`.

## Lệnh hữu ích

```bash
# Xem logs
docker compose logs -f backend
docker compose logs -f frontend

# Tắt stack
docker compose down

# Reset hoàn toàn (xoá cả volume dữ liệu)
docker compose down -v

# Chạy migration khi thêm model mới
docker compose exec backend npx prisma migrate deploy
```

## License

Dự án cá nhân — chưa có license công khai.
