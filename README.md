# Tempo — Minimal Productivity Workspace

A clean, high-performance, minimalist task and productivity workspace engineered with vanilla web technologies, Node.js/Express, and MySQL.

---

## 🎨 Design System

Tempo strictly implements the **Carbon & Sage Teal** design system — a sophisticated, minimal, dark aesthetic inspired by Linear, Slack, and Notion:
- **Soft Carbon & Graphite (`#151719`, `#202426`, `#303739`)**: Main canvas, sidebar navigation, topbar, and cards.
- **Sage Teal (`#6BAFA4`, `#A2D2C9`, `#83C3B7`)**: Primary buttons, active indicators, focus rings, brand accents.
- **High-Legibility Typography (`#E7EAE9`, `#A3ACAA`, `#84918E`)**: Primary headings, secondary metadata, and muted timestamps.
- **Subtle Borders & Status Colors (`#3B4444`, `#80B9A0`, `#D2AD70`, `#D98B83`, `#88AFC2`)**.

Specification: [DESIGN.md](DESIGN.md)

---

## 🏗 Architecture

- **Frontend**: Vanilla HTML5, CSS3, ES Modules (no frameworks, no bundlers, zero bloat).
  - Semantic layout with responsive sidebar drawer.
  - Reactive in-memory state store with dual synchronization (REST API + LocalStorage fallback).
  - Accessible modal dialogs, toast notifications, drag-and-drop reordering, inline title editing.
- **Backend**: Node.js & Express REST API (`server/`).
  - Layered architecture: `routes/`, `controllers/`, `middleware/`, `config/`, and `db/`.
  - Scoped development user context (`authDev.js`) prepared for Phase 5 authentication.
  - Standard HTTP semantics (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
- **Database**: MySQL 8.0 with `mysql2/promise` connection pooling.
  - Normalized schema: `users`, `categories`, `projects`, `tasks`, and `schema_migrations`.
  - Safe, versioned migration runner with statement-level tracking accounting for MySQL implicit DDL commits.
  - Parameterized SQL queries preventing injection vulnerabilities.
  - UTC date handling and timezone stability.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ or v26+)
- MySQL Server 8.0+

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Copy the template configuration and set your local MySQL credentials:
```bash
cp .env.example .env
```
Edit `.env`:
```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=tempo_db
DB_USER=root
DB_PASSWORD=your_password_here
DB_TIMEZONE=Z
```

### 4. Database Setup
```bash
# 1. Verify connection to MySQL
npm run db:verify

# 2. Run version-controlled schema migrations
npm run db:migrate

# 3. Populate development seed data
npm run db:seed
```

### 5. Start Application
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account with bcrypt password hashing |
| `POST` | `/api/auth/login` | Authenticate credentials and receive signed JWT token |
| `GET` | `/api/auth/me` | Retrieve profile of currently authenticated user |
| `POST` | `/api/auth/logout` | Clear authentication state |
| `GET` | `/api/health` | Service health and MySQL database connectivity status |
| `GET` | `/api/tasks` | List tasks (supports `?status=`, `?view=`, `?search=`, `?sort=`) |
| `GET` | `/api/tasks/:id` | Retrieve single task by ID |
| `POST` | `/api/tasks` | Create task (201 Created) |
| `PUT` | `/api/tasks/:id` | Update task fields |
| `PATCH`| `/api/tasks/:id/toggle` | Toggle task completion status |
| `DELETE`| `/api/tasks/:id` | Delete task |
| `POST` | `/api/tasks/reorder` | Transactional drag-and-drop task reordering |
| `GET` | `/api/projects` | List projects with active task counts |
| `GET` | `/api/stats` | Overview metrics (`total`, `completed`, `pending`, `overdue`) |

---

## 🧪 Automated Verification Suites

Tempo features a unified test runner covering all 9 test suites across frontend, backend, security, database, and design systems:

```bash
# Run all 9 verification suites (recommended)
npm test
# or
python tests/run_all_tests.py
```

Individual test suites:
```bash
# Verify authentication and multi-tenant security
python tests/test_auth_security.py

# Verify database integration
python tests/test_database_integration.py

# Verify REST API contracts
python tests/test_backend_api.py

# Verify schema migrations
python tests/test_phase4_2_migrations.py

# Verify strict color palette adherence
python tests/test_color_palette.py

# Verify frontend shell & layout
python tests/test_frontend_shell.py
python tests/test_main_layout.py
python tests/test_phase2_functionality.py
```

---

## 🚢 Deployment & Production Operations

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions on PM2 process management, Docker containerization, Nginx reverse proxy configuration, SSL termination, and automated MySQL backups.

---

## 📄 License
MIT License. Created by the Tempo Team.

