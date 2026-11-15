# Tempo — Production Deployment & Operations Guide

This document provides complete instructions for configuring, deploying, monitoring, and maintaining Tempo in production environments with **PostgreSQL**, **Neon PostgreSQL**, and **Render**.

---

## 1. System Requirements

- **Operating System**: Linux (Ubuntu 22.04 LTS / Debian 12 recommended), macOS, or Windows Server.
- **Node.js**: v18.0.0 or higher (v20+ or v26+ recommended).
- **Database**: PostgreSQL 14+ or a serverless PostgreSQL database such as [Neon PostgreSQL](https://neon.tech).
- **Memory**: Minimum 512MB RAM (1GB+ recommended).
- **Disk**: 1GB free storage for application files and database data.

---

## 2. Production Environment Configuration

Create a production `.env` file on your server or configure environment variables in your cloud provider. **Never commit `.env` to version control.**

### Option A: Cloud Deployment (Render + Neon PostgreSQL)
```env
# Node Environment
NODE_ENV=production

# Render automatically supplies PORT, but specify for local preview
PORT=3000

# Neon PostgreSQL Managed Connection
DATABASE_URL=postgres://tempo_user:your_secure_password@ep-cool-cloud-12345.us-east-2.aws.neon.tech/tempo_db?sslmode=require
DB_SSL=true
DB_CONNECTION_LIMIT=20
DB_WAIT_FOR_CONNECTIONS=true
DB_CONNECT_TIMEOUT=10000

# Authentication & Cryptography
JWT_SECRET=GENERATE_A_64_CHAR_RANDOM_STRING_HERE
JWT_EXPIRES_IN=7d
```

### Option B: Self-Hosted PostgreSQL (Discrete Parameters)
```env
NODE_ENV=production
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=tempo_db
DB_USER=tempo_prod_user
DB_PASSWORD=USE_A_STRONG_RANDOM_PASSWORD
DB_SSL=false
DB_CONNECTION_LIMIT=20
DB_WAIT_FOR_CONNECTIONS=true
DB_CONNECT_TIMEOUT=10000

JWT_SECRET=GENERATE_A_64_CHAR_RANDOM_STRING_HERE
JWT_EXPIRES_IN=7d
```

> **Generating a secure JWT Secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 3. Deploying on Render with Neon PostgreSQL

### Step 1: Provision a Free Neon PostgreSQL Database
1. Go to [Neon](https://neon.tech) and create a new project named `tempo-db`.
2. In the Neon Console, navigate to **Dashboard** and copy the **Connection string** (select `Node.js` or `Pooled connection`).
3. Ensure the connection string ends with `?sslmode=require`.

### Step 2: Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository (`aryan-0307/Tempo`).
3. Set the following build and start configurations:
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run db:migrate && npm start`
4. Add the following **Environment Variables** in the Render settings:
   - `DATABASE_URL`: Your full Neon PostgreSQL pooled connection string.
   - `DB_SSL`: `true`
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: A secure 64-character random string.
   - `JWT_EXPIRES_IN`: `7d`
5. Render automatically sets `PORT`, and `server/server.js` automatically binds to `0.0.0.0:${PORT}`.
6. Click **Create Web Service**. Render will build the repository, verify the build, run the idempotent schema migrations, and boot the web application.

---

## 4. Database Setup, Migrations & Zero-Data-Loss Migration

### 4.1. Run Migrations & Verification
```bash
# 1. Verify PostgreSQL connection (checks live health via SELECT 1)
npm run db:verify

# 2. Run version-controlled schema migrations
npm run db:migrate

# 3. (Optional) Populate development seed data
npm run db:seed
```

### 4.2. Safe Migration from Legacy MySQL (Zero Data Loss)
Tempo includes built-in scripts to safely export all data from a MySQL 8.0 instance and import it into PostgreSQL:
```bash
# 1. Export MySQL records to JSON backup
npm run db:export
# Saved to: server/db/backups/mysql_data_export.json

# 2. Import into PostgreSQL with conflict resolution & sequence synchronization
npm run db:import
```

The import utility automatically respects foreign key dependencies:
1. `users` (preserves existing bcrypt password hashes, avatars, and timestamps)
2. `categories` (upserts default and custom categories)
3. `projects` (upserts user projects)
4. `tasks` (upserts tasks, statuses, priorities, due dates, and display orders)
5. `schema_migrations` (synchronizes migration tracking history)
6. Advances all serial primary key sequences (`setval`)

---

## 5. Alternative Deployment Methods

### Option A: PM2 Process Manager (Bare Metal & VPS)

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Start application using PM2:**
   ```bash
   pm2 start server/server.js --name "tempo-app" --env production
   ```

3. **Configure automatic startup on system reboot:**
   ```bash
   pm2 startup
   pm2 save
   ```

4. **Monitoring & Management:**
   ```bash
   pm2 status            # Check instance status
   pm2 logs tempo-app    # Stream real-time logs
   pm2 restart tempo-app # Zero-downtime reload
   ```

---

### Option B: Docker & Docker Compose (Containerized Deployment)

The included `docker-compose.yml` runs PostgreSQL 16 Alpine and the Tempo Node.js backend:

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

## 6. Reverse Proxy Configuration (Nginx with SSL)

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

## 7. Health Checks & Diagnostics

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
  "timestamp": "2026-11-15T12:00:00.000Z"
}
```

---

## 8. PostgreSQL Backup & Disaster Recovery

### Automated Nightly Backup
```bash
pg_dump -U tempo_prod_user -h 127.0.0.1 -d tempo_db -F c -b -v -f /backups/tempo_db_$(date +%Y%m%d_%H%M%S).dump
```

For Neon PostgreSQL:
```bash
pg_dump "$DATABASE_URL" -F c -b -v -f /backups/tempo_neon_$(date +%Y%m%d_%H%M%S).dump
```

### Restore Backup
```bash
pg_restore -U tempo_prod_user -h 127.0.0.1 -d tempo_db -v /backups/tempo_db_YYYYMMDD_HHMMSS.dump
```


