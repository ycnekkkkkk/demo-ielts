# 🚀 Hướng dẫn Deploy Frontend

## ⚠️ Lỗi: "Application error: a client-side exception has occurred"

Lỗi này thường xảy ra khi:
1. **API URL không đúng** - Frontend không thể kết nối với backend
2. **CORS chưa được cấu hình** - Backend chưa cho phép frontend domain
3. **Network error** - Không thể kết nối đến backend API

## ✅ Giải pháp

### Bước 1: Set NEXT_PUBLIC_API_URL

Frontend cần biết URL của backend API. Có 2 cách:

#### Cách 1: Environment Variable (Khuyến nghị)

Tạo file `.env.local` trong thư mục `frontend/`:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

**Lưu ý**: 
- Biến môi trường trong Next.js phải bắt đầu bằng `NEXT_PUBLIC_` để được expose ra client-side
- Không commit file `.env.local` vào git (đã có trong `.gitignore`)

#### Cách 2: Set trong Vercel/Netlify (nếu deploy frontend)

1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Thêm: `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app`
3. Redeploy

### Bước 2: Kiểm tra Backend CORS

Đảm bảo backend đã được cấu hình CORS đúng:

1. Railway Dashboard → **Variables**
2. Thêm: `CORS_ALLOW_ALL=true`
3. Hoặc: `CORS_ORIGINS=https://your-frontend-domain.com`
4. Redeploy backend

### Bước 3: Kiểm tra Console Logs

Mở Browser Console (F12) để xem lỗi chi tiết:

- **Network tab**: Xem requests có fail không
- **Console tab**: Xem error messages
- **API URL**: Kiểm tra xem API URL có đúng không

## 🔍 Debug

### Kiểm tra API URL

Trong browser console, bạn sẽ thấy:
```
API URL: https://your-backend.railway.app
```

Nếu thấy `http://localhost:8000`, nghĩa là `NEXT_PUBLIC_API_URL` chưa được set.

### Kiểm tra CORS

Nếu thấy lỗi:
```
Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy
```

→ Cần set `CORS_ALLOW_ALL=true` trên Railway.

### Kiểm tra Network

Trong Network tab:
- Xem request có được gửi không
- Status code là gì (200, 400, 500, etc.)
- Response có trả về không

## 📝 Checklist

- [ ] `NEXT_PUBLIC_API_URL` đã được set đúng
- [ ] Backend CORS đã được cấu hình (`CORS_ALLOW_ALL=true`)
- [ ] Backend đang chạy và accessible
- [ ] Frontend đã rebuild sau khi thay đổi env variables
- [ ] Browser console không có lỗi

## 🚀 Deploy Frontend lên Vercel

1. Push code lên GitHub
2. Vercel Dashboard → **New Project**
3. Import repository
4. **Environment Variables** → Thêm `NEXT_PUBLIC_API_URL`
5. Deploy

## 🔗 Links

- Backend API: `https://your-backend.railway.app`
- Frontend: `https://your-frontend.vercel.app`
- API Docs: `https://your-backend.railway.app/docs`

