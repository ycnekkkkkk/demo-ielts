# IELTS Test - Enhanced Version

Phiên bản nâng cấp của hệ thống test IELTS với giao diện hiện đại và trải nghiệm người dùng được cải thiện.

## ✨ Tính năng mới

- 🎨 **Giao diện hiện đại**: Gradient backgrounds, animations, và modern UI components
- 🚀 **Trải nghiệm tốt hơn**: Smooth animations với Framer Motion
- 📱 **Responsive Design**: Tối ưu cho mọi thiết bị
- 🎯 **Visual Feedback**: Loading states, transitions, và interactive elements
- 💎 **Modern Components**: Reusable components với styling nhất quán

## 🚀 Cài đặt

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
```

Tạo file `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY_BACKUP=your_backup_gemini_api_key_here
# Optional: CORS origins (comma-separated)
# CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

Chạy backend:
```bash
uvicorn app.main:app --reload
```

API sẽ chạy tại: http://localhost:8000

### Frontend (Next.js)

```bash
cd frontend
npm install
```

Tạo file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Chạy frontend:
```bash
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

## 📋 Flow

1. **Khởi tạo**: User chọn level (Beginner → Advanced) → Tạo test_session
2. **Chọn phần**: User chọn phase (Listening & Speaking HOẶC Reading & Writing)
3. **Generate**: Hệ thống gọi Gemini API 1 lần để tạo đề cho phase đã chọn
4. **Làm bài**: User làm bài trong 30 phút
5. **Nộp phase 1**: AI chấm điểm và lưu kết quả
6. **Generate phase 2**: Hệ thống tạo đề cho phase còn lại
7. **Làm và nộp phase 2**: User làm và nộp phase 2
8. **Tổng hợp**: Tính IELTS equivalent (Listening, Reading, Writing, Speaking, Overall)

## 🎨 Cải tiến giao diện

- **Modern Color Scheme**: Gradient backgrounds và color-coded levels
- **Smooth Animations**: Framer Motion cho transitions mượt mà
- **Better Typography**: Improved font hierarchy và spacing
- **Interactive Elements**: Hover effects, loading states, và visual feedback
- **Card-based Design**: Modern card layouts với shadows và borders
- **Responsive Grid**: Adaptive layouts cho mobile và desktop

## 🔧 API Endpoints

- `POST /api/sessions` - Tạo session mới
- `POST /api/sessions/{id}/select-phase` - Chọn phase
- `POST /api/sessions/{id}/generate` - Generate phase 1
- `POST /api/sessions/{id}/submit-phase1` - Nộp phase 1
- `POST /api/sessions/{id}/generate-phase2` - Generate phase 2
- `POST /api/sessions/{id}/submit-phase2` - Nộp phase 2
- `POST /api/sessions/{id}/aggregate` - Tổng hợp kết quả
- `GET /api/sessions/{id}` - Lấy thông tin session

## 📝 Ghi chú

- Sử dụng Gemini API free tier
- Tối ưu cho 5-10 người dùng đồng thời
- Mỗi phase chỉ gọi AI 1 lần (không regenerate)
- Scoring tự động cho Listening/Reading (objective)
- Scoring bằng AI cho Speaking/Writing (subjective)
- **Storage**: In-memory (không cần database) - phù hợp cho serverless deployment

## 🚀 Deploy lên Server

Xem hướng dẫn chi tiết tại:
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Hướng dẫn đầy đủ từ A-Z
- **[DEPLOY_QUICK.md](./DEPLOY_QUICK.md)** - Checklist nhanh

### Tóm tắt:
1. **Backend**: Cần Python 3.10+, PM2, file `.env` với Gemini API keys
2. **Frontend**: Cần Node.js 18+, build với `npm run build`, file `.env.local` với API URL
3. **Nginx**: Reverse proxy cho backend (port 8000) và frontend (port 3000)
4. **SSL**: Khuyến nghị dùng Let's Encrypt cho HTTPS

## 🆚 So sánh với phiên bản cũ

| Tính năng | Phiên bản cũ | Phiên bản mới |
|-----------|--------------|---------------|
| UI Design | Basic | Modern với gradients |
| Animations | Không có | Framer Motion |
| Color Scheme | Đơn giản | Gradient-based |
| Components | Basic | Enhanced với better styling |
| User Experience | Tốt | Tuyệt vời |

