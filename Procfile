web: if [ -d "backend" ]; then cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT; else uvicorn app.main:app --host 0.0.0.0 --port $PORT; fi

