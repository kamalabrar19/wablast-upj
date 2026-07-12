#!/bin/bash
# ==============================
# WA Blast UPJ — Deploy Script
# ==============================
# Jalankan di VPS (Ubuntu 22.04+)
# Usage: bash deploy.sh
# ==============================

set -e

echo "=== 1. Update system ==="
apt update && apt upgrade -y

echo "=== 2. Install dependencies ==="
apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx

echo "=== 3. Enable Docker ==="
systemctl enable --now docker

echo "=== 4. Clone / pull project ==="
if [ -d /opt/wablast ]; then
  cd /opt/wablast
  git pull
else
  git clone <your-repo-url> /opt/wablast
  cd /opt/wablast
fi

echo "=== 5. Setup environment ==="
if [ ! -f .env ]; then
  cp .env.production .env
  echo ">>> EDIT FILE .env TERLEBIH DAHULU <<<"
  echo "    nano /opt/wablast/.env"
  echo "    - Isi DB_PASSWORD"
  echo "    - Generate NEXTAUTH_SECRET: openssl rand -base64 32"
  echo "    - Isi NEXTAUTH_URL dengan domain"
  exit 1
fi

echo "=== 6. Build & start containers ==="
docker compose up -d --build

echo "=== 7. Setup Nginx ==="
cat > /etc/nginx/sites-available/wablast << 'NGINX'
server {
    listen 80;
    server_name blast.upj.ac.id;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/wablast /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== 8. Setup SSL (Certbot) ==="
certbot --nginx -d blast.upj.ac.id --non-interactive --agree-tos -m admin@upj.ac.id

echo "=== Selesai! ==="
echo "Aplikasi berjalan di https://blast.upj.ac.id"
