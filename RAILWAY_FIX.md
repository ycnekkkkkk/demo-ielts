# 🔧 Fix: "cd: backend: No such file or directory"

## Vấn đề

Railway báo lỗi `cd: backend: No such file or directory` vì:
- Railway đã set **Root Directory** = `backend` trong Settings
- Khi Root Directory = `backend`, bạn đã ở trong thư mục `backend` rồi
- Không cần `cd backend` nữa

## ✅ Giải pháp

### Option 1: Set Root Directory = `backend` (Khuyến nghị)

1. Railway Dashboard → **Settings** → **Deploy**
2. Set **Root Directory** = `backend`
3. **Start Command** = `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Build Command** = `pip install -r requirements.txt`

**Không cần** `cd backend` trong command nữa!

### Option 2: Root Directory = `.` (root)

1. Railway Dashboard → **Settings** → **Deploy**
2. Set **Root Directory** = `.` (hoặc để trống)
3. **Start Command** = `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Build Command** = `cd backend && pip install -r requirements.txt`

### Option 3: Sử dụng Procfile (tự động)

File `Procfile` đã được cập nhật để tự động detect:
- Nếu có thư mục `backend` → chạy từ backend
- Nếu không có → chạy từ root (giả sử đã ở trong backend)

## 🎯 Recommended Configuration

**Root Directory**: `backend`
**Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
**Build Command**: `pip install -r requirements.txt`

## 📝 Lưu ý

- File `railway.json` đã được cập nhật để không có `cd backend`
- Nếu Railway tự động detect từ `Procfile`, nó sẽ xử lý tự động
- Kiểm tra **Settings** → **Deploy** để đảm bảo cấu hình đúng

