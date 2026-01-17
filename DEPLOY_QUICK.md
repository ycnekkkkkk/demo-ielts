# 🚀 Quick Deploy Guide

## ⚡ Checklist nhanh

### 1. Backend (Port 8000)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Tạo file .env
echo "GEMINI_API_KEY=your_key_here" > .env
echo "GEMINI_API_KEY_BACKUP=your_backup_key_here" >> .env

# Chạy với PM2
pm2 start ecosystem.config.js
pm2 save
```

### 2. Frontend (Port 3000)

```bash
cd frontend
npm install

# Tạo file .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local

# Build và chạy
npm run build
pm2 start ecosystem.config.js
pm2 save
```

### 3. Nginx (Reverse Proxy)

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    location /api {
        proxy_pass http://localhost:8000;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

## 📝 Environment Variables

### Backend `.env`:
```env
GEMINI_API_KEY=your_primary_key
GEMINI_API_KEY_BACKUP=your_backup_key
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🔄 Update Code

```bash
git pull
cd backend && pm2 restart ielts-backend
cd ../frontend && npm run build && pm2 restart ielts-frontend
```

Xem chi tiết tại [DEPLOYMENT.md](./DEPLOYMENT.md)

