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
CORS_ALLOW_ALL=true
```

Hoặc nếu muốn chỉ định cụ thể origins:

```
GEMINI_API_KEY=your_primary_api_key_here
GEMINI_API_KEY_BACKUP=your_backup_api_key_here
CORS_ORIGINS=https://your-frontend-domain.com,https://another-domain.com
```

**Lưu ý**: 
- `CORS_ALLOW_ALL=true` cho phép tất cả origins (phù hợp cho development/testing)
- `CORS_ORIGINS` chỉ định cụ thể các origins được phép (an toàn hơn cho production)

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

## 🐛 Fix: CORS 400 Bad Request Error

Nếu gặp lỗi `OPTIONS /api/sessions HTTP/1.1" 400 Bad Request`:

### Giải pháp: Set CORS_ALLOW_ALL=true

1. Railway Dashboard → **Variables**
2. Thêm: `CORS_ALLOW_ALL=true`
3. Redeploy

Hoặc chỉ định cụ thể frontend domain:

1. Railway Dashboard → **Variables**
2. Thêm: `CORS_ORIGINS=https://your-frontend-domain.com`
3. Redeploy

## ⚠️ Warning: google.generativeai Deprecated

Nếu thấy warning:
```
FutureWarning: All support for the `google.generativeai` package has ended...
```

**Đây chỉ là warning, không phải lỗi.** Code vẫn hoạt động bình thường.

- Warning đã được suppress trong code
- Package `google.generativeai` vẫn hoạt động, chỉ là Google khuyến nghị chuyển sang `google.genai` trong tương lai
- Có thể bỏ qua warning này cho đến khi migrate sang `google.genai` (khi package mới ổn định hơn)

## 🐛 Fix: Python 3.13 Compatibility Issue

Nếu gặp lỗi build `pydantic-core` với Python 3.13:

### Giải pháp 1: Sử dụng Python 3.12 (Khuyến nghị)

File `runtime.txt` đã được set thành `python-3.12`. Railway sẽ tự động sử dụng Python 3.12.

### Giải pháp 2: Cập nhật requirements.txt

Đã cập nhật `requirements.txt` với các version mới hơn tương thích Python 3.13:
- `pydantic>=2.10.0` (thay vì 2.5.0)
- `fastapi>=0.115.0` (thay vì 0.104.1)
- Các dependencies khác cũng đã được cập nhật

### Giải pháp 3: Set Python version trong Railway

1. Railway Settings → **Variables**
2. Thêm: `PYTHON_VERSION=3.12`
3. Hoặc trong **Settings** → **Build** → chọn Python 3.12

