# Tempo — Production Deployment & Operations Guide

This document provides complete instructions for configuring, deploying, monitoring, and maintaining Tempo in production environments.

---

## 1. System Requirements

- **Operating System**: Linux (Ubuntu 22.04 LTS / Debian 12 recommended), macOS, or Windows Server.
- **Node.js**: v18.0.0 or higher (v20+ recommended).
- **Database**: MySQL 8.0 or higher (or MariaDB 10.6+).
- **Memory**: Minimum 512MB RAM (1GB+ recommended).
- **Disk**: 1GB free storage for application files and MySQL volumes.

---

## 2. Production Environment Configuration

Create a production `.env` file on your server. **Never commit this file to version control.**

```env
# Node Environment
NODE_ENV=production
PORT=3000

# MySQL Connection Details
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=tempo_db
DB_USER=tempo_prod_user
DB_PASSWORD=USE_A_STRONG_RANDOM_PASSWORD
DB_CONNECTION_LIMIT=20
DB_WAIT_FOR_CONNECTIONS=true
DB_CONNECT_TIMEOUT=10000
DB_TIMEZONE=Z

# Authentication & Cryptography
JWT_SECRET=GENERATE_A_64_CHAR_RANDOM_STRING_HERE
JWT_EXPIRES_IN=7d
```

> **Generating a secure JWT Secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 3. Database Initialization & Migrations

Execute database migrations to prepare the production schema:

```bash
# 1. Verify database connectivity
npm run db:verify

# 2. Run version-controlled schema migrations
npm run db:migrate
```

*(Optional: Do not run `npm run db:seed` in production unless you wish to create the initial demo workspaces).*

---

## 4. Deployment Methods

### Option A: PM2 Process Manager (Recommended for Bare Metal & VPS)

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Start application using ecosystem configuration:**
   ```bash
   pm2 start ecosystem.config.cjs --env production
   ```

3. **Configure automatic startup on system reboot:**
   ```bash
   pm2 startup
   pm2 save
   ```

4. **Monitoring & Management:**
   ```bash
   pm2 status          # Check instance status
   pm2 logs tempo-app  # Stream real-time logs
   pm2 restart tempo-app # Zero-downtime reload
   ```

---

### Option B: Docker & Docker Compose (Containerized Deployment)

1. **Build and start services:**
   ```bash
   docker compose up -d --build
   ```

2. **Run migrations inside container:**
   ```bash
   docker compose exec app npm run db:migrate
   ```

3. **Check container logs & health:**
   ```bash
   docker compose logs -f
   docker compose ps
   ```

---

## 5. Reverse Proxy Configuration (Nginx with SSL)

Configure Nginx as a reverse proxy in front of Node.js:

```nginx
server {
    listen 80;
    server_name tempo.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tempo.example.com;

    ssl_certificate /etc/letsencrypt/live/tempo.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tempo.example.com/privkey.pem;

    # SSL hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

---

## 6. Health Checks & Monitoring

The `/api/health` endpoint provides comprehensive diagnostic data:

```bash
curl http://localhost:3000/api/health
```

Example response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "database": "connected",
  "uptime": 86420,
  "memoryUsageMB": {
    "rss": 42,
    "heapTotal": 24,
    "heapUsed": 16
  },
  "environment": "production",
  "timestamp": "2026-11-13T12:00:00.000Z"
}
```

---

## 7. Database Backup & Disaster Recovery

### Automated Nightly Backup
```bash
mysqldump -u tempo_prod_user -p tempo_db | gzip > /backups/tempo_db_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Backup
```bash
gunzip < /backups/tempo_db_YYYYMMDD_HHMMSS.sql.gz | mysql -u tempo_prod_user -p tempo_db
```

