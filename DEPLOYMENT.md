# Hướng dẫn Deploy lên Server

## 📋 Tổng quan

Hệ thống bao gồm:
- **Backend**: FastAPI (Python) - Port 8000
- **Frontend**: Next.js (React/TypeScript) - Port 3000
- **Storage**: In-memory (không cần database)

## 🔧 1. Chuẩn bị môi trường Server

### Yêu cầu hệ thống:
- **OS**: Linux (Ubuntu 20.04+ / Debian 11+)
- **Python**: 3.10 hoặc 3.11
- **Node.js**: 18.x hoặc 20.x
- **PM2** (hoặc systemd) để chạy backend
- **Nginx** (hoặc reverse proxy khác) để serve frontend

### Cài đặt dependencies trên server:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python và pip
sudo apt install python3 python3-pip python3-venv -y

# Install Node.js (sử dụng nvm hoặc từ repository)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager cho backend)
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

## 🐍 2. Backend Setup

### Bước 1: Clone và setup

```bash
# Clone repository
cd /var/www  # hoặc thư mục bạn muốn
git clone <your-repo-url> ielts-test
cd ielts-test/web\ app/backend

# Tạo virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Bước 2: Cấu hình Environment Variables

Tạo file `.env` trong thư mục `backend/`:

```bash
cd backend
nano .env
```

Nội dung file `.env`:

```env
# Gemini API Keys (BẮT BUỘC)
GEMINI_API_KEY=your_primary_api_key_here
GEMINI_API_KEY_BACKUP=your_backup_api_key_here

# Optional: Database URL (không cần nếu dùng in-memory)
# DATABASE_URL=sqlite:///./test_session.db

# Optional: CORS origins (nếu cần)
# CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Bước 3: Test backend

```bash
# Test chạy backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Nếu chạy OK, dừng bằng Ctrl+C
```

### Bước 4: Chạy với PM2

Tạo file `ecosystem.config.js` trong thư mục `backend/`:

```javascript
module.exports = {
  apps: [{
    name: 'ielts-backend',
    script: 'venv/bin/uvicorn',
    args: 'app.main:app --host 0.0.0.0 --port 8000',
    cwd: '/var/www/ielts-test/web app/backend',
    interpreter: 'none',
    env: {
      PYTHONUNBUFFERED: '1'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
}
```

Chạy với PM2:

```bash
cd /var/www/ielts-test/web\ app/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Chạy lệnh này và làm theo hướng dẫn để auto-start khi reboot
```

Kiểm tra:

```bash
pm2 status
pm2 logs ielts-backend
```

## ⚛️ 3. Frontend Setup

### Bước 1: Build và setup

```bash
cd /var/www/ielts-test/web\ app/frontend

# Install dependencies
npm install

# Tạo file .env.local
nano .env.local
```

Nội dung file `.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api
# Hoặc nếu backend ở server khác:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### Bước 2: Build production

```bash
# Build Next.js app
npm run build

# Test chạy production
npm start

# Nếu OK, dừng bằng Ctrl+C
```

### Bước 3: Chạy với PM2

Tạo file `ecosystem.config.js` trong thư mục `frontend/`:

```javascript
module.exports = {
  apps: [{
    name: 'ielts-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/ielts-test/web app/frontend',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
}
```

Chạy với PM2:

```bash
cd /var/www/ielts-test/web\ app/frontend
pm2 start ecosystem.config.js
pm2 save
```

## 🌐 4. Nginx Configuration

Tạo file config cho Nginx:

```bash
sudo nano /etc/nginx/sites-available/ielts-test
```

Nội dung:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;  # Hoặc IP của server

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Hoặc IP của server

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Kích hoạt config:

```bash
sudo ln -s /etc/nginx/sites-available/ielts-test /etc/nginx/sites-enabled/
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

## 🔒 5. SSL Certificate (Optional nhưng khuyến nghị)

Sử dụng Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 📝 6. Checklist trước khi deploy

### Backend:
- [ ] File `.env` đã có `GEMINI_API_KEY` và `GEMINI_API_KEY_BACKUP`
- [ ] Đã test chạy backend thành công
- [ ] PM2 đã cấu hình và chạy
- [ ] Backend accessible tại `http://server-ip:8000/health`

### Frontend:
- [ ] File `.env.local` đã có `NEXT_PUBLIC_API_URL` đúng
- [ ] Đã build thành công với `npm run build`
- [ ] PM2 đã cấu hình và chạy
- [ ] Frontend accessible tại `http://server-ip:3000`

### Server:
- [ ] Firewall đã mở port 80, 443 (và 8000, 3000 nếu cần)
- [ ] Nginx đã cấu hình và chạy
- [ ] Domain đã trỏ về server IP (nếu dùng domain)

## 🚀 7. Deploy Process

### Lần đầu deploy:

```bash
# 1. Clone code
cd /var/www
git clone <your-repo-url> ielts-test
cd ielts-test/web\ app

# 2. Setup Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Tạo .env file
nano .env  # Nhập API keys
# Chạy với PM2
pm2 start ecosystem.config.js

# 3. Setup Frontend
cd ../frontend
npm install
# Tạo .env.local
nano .env.local  # Nhập API URL
npm run build
# Chạy với PM2
pm2 start ecosystem.config.js

# 4. Setup Nginx
sudo nano /etc/nginx/sites-available/ielts-test
# Copy config ở trên
sudo ln -s /etc/nginx/sites-available/ielts-test /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Update code (sau khi push lên git):

```bash
cd /var/www/ielts-test

# Pull code mới
git pull origin main

# Update Backend
cd web\ app/backend
source venv/bin/activate
pip install -r requirements.txt  # Nếu có dependencies mới
pm2 restart ielts-backend

# Update Frontend
cd ../frontend
npm install  # Nếu có dependencies mới
npm run build
pm2 restart ielts-frontend
```

## 🔍 8. Monitoring & Logs

### Xem logs:

```bash
# Backend logs
pm2 logs ielts-backend

# Frontend logs
pm2 logs ielts-frontend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Kiểm tra status:

```bash
pm2 status
pm2 monit  # Real-time monitoring
```

## ⚠️ 9. Troubleshooting

### Backend không chạy:
```bash
# Kiểm tra PM2
pm2 status
pm2 logs ielts-backend

# Test chạy thủ công
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend không chạy:
```bash
# Kiểm tra PM2
pm2 status
pm2 logs ielts-frontend

# Test chạy thủ công
cd frontend
npm start
```

### API không kết nối được:
- Kiểm tra `NEXT_PUBLIC_API_URL` trong `.env.local`
- Kiểm tra CORS trong backend
- Kiểm tra firewall

### Lỗi Gemini API:
- Kiểm tra API keys trong `.env`
- Kiểm tra quota/rate limit
- Xem logs: `pm2 logs ielts-backend`

## 📦 10. Alternative: Docker Deployment (Optional)

Nếu muốn dùng Docker, có thể tạo `Dockerfile` và `docker-compose.yml` (không bắt buộc).

## 🔐 11. Security Notes

1. **Không commit `.env` và `.env.local` lên git**
2. **Sử dụng HTTPS** (Let's Encrypt)
3. **Firewall**: Chỉ mở port cần thiết
4. **API Keys**: Bảo mật tốt, không share
5. **Regular updates**: Cập nhật dependencies thường xuyên

## 📞 12. Quick Commands Reference

```bash
# Restart services
pm2 restart ielts-backend
pm2 restart ielts-frontend
sudo systemctl restart nginx

# View logs
pm2 logs ielts-backend --lines 50
pm2 logs ielts-frontend --lines 50

# Stop services
pm2 stop ielts-backend
pm2 stop ielts-frontend

# Start services
pm2 start ielts-backend
pm2 start ielts-frontend
```

