# 🚂 Hướng dẫn Deploy lên Railway

## Vấn đề: "No start command was found"

Railway không tìm thấy cách chạy ứng dụng vì cấu trúc project có backend trong thư mục con.

## ✅ Giải pháp

### Cách 1: Sử dụng Procfile (Khuyến nghị)

Đã tạo file `Procfile` ở root với nội dung:
```
web: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Cách 2: Cấu hình trong Railway Dashboard

1. Vào **Settings** → **Deploy**
2. Trong phần **Start Command**, nhập:
   ```bash
   cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Cách 3: Sử dụng railway.json

File `railway.json` đã được tạo với cấu hình đầy đủ.

## 🔧 Cấu hình Environment Variables

Trong Railway Dashboard → **Variables**, thêm:

```
GEMINI_API_KEY=your_primary_api_key_here
GEMINI_API_KEY_BACKUP=your_backup_api_key_here
CORS_ORIGINS=https://your-frontend-domain.com
```

## 📁 Cấu trúc Project

Railway sẽ tự động detect Python và chạy từ root. Vì vậy cần:
- `Procfile` ở root để chỉ định start command
- Hoặc set **Root Directory** trong Railway Settings = `backend`

## 🎯 Recommended Setup

### Option A: Root Directory = `backend`

1. Railway Settings → **Root Directory** = `backend`
2. Start Command = `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Build Command = `pip install -r requirements.txt`

### Option B: Root Directory = `.` (root)

1. Railway Settings → **Root Directory** = `.` (hoặc để trống)
2. Start Command = `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Build Command = `cd backend && pip install -r requirements.txt`

## 🔍 Kiểm tra

Sau khi deploy, kiểm tra:
- Health check: `https://your-app.railway.app/health`
- API docs: `https://your-app.railway.app/docs`

## ⚠️ Lưu ý

- Railway tự động set biến `$PORT`, không cần config
- CORS cần được cấu hình đúng với frontend domain
- In-memory storage sẽ mất dữ liệu khi restart (phù hợp cho demo/testing)

