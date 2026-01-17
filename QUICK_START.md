# Quick Start Guide - Enhanced Version

## Backend Setup

1. Cài đặt dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Tạo file `.env`:
```env
DATABASE_URL=sqlite:///./test_session.db
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY_BACKUP=your_backup_gemini_api_key_here
```

**Lưu ý:** Lấy Gemini API key miễn phí tại: https://makersuite.google.com/app/apikey

3. Chạy backend:
```bash
uvicorn app.main:app --reload
```

Backend sẽ chạy tại: http://localhost:8000

## Frontend Setup

1. Cài đặt dependencies:
```bash
cd frontend
npm install
```

2. Tạo file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Chạy frontend:
```bash
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

## Flow Test

1. Mở http://localhost:3000
2. Chọn trình độ (Beginner → Advanced)
3. Chọn phần làm trước (Listening & Speaking HOẶC Reading & Writing)
4. Hệ thống tự động tạo đề
5. Làm bài và nộp
6. Hệ thống tạo đề phần còn lại
7. Làm và nộp phần 2
8. Xem kết quả tổng hợp

## API Documentation

Truy cập: http://localhost:8000/docs để xem API documentation (Swagger UI)

## Cải tiến so với phiên bản cũ

- ✨ Modern UI với gradients và animations
- 🎨 Better color scheme và typography
- 🚀 Smooth transitions với Framer Motion
- 📱 Improved responsive design
- 💎 Enhanced user experience

