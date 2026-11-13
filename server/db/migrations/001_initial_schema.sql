-- ==============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Creates initial relational schema for Tempo
-- Tables: schema_migrations, users, categories, projects, tasks
-- Note: MySQL DDL operations trigger implicit commits. Table creation uses
--       IF NOT EXISTS to enable safe partial-failure retry and idempotency.
-- ==============================================================================

-- 1. Schema Migrations History Tracker
CREATE TABLE IF NOT EXISTS schema_migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    status ENUM('pending', 'applied', 'failed') NOT NULL DEFAULT 'applied',
    executed_statements INT NOT NULL DEFAULT 0,
    checksum VARCHAR(64) NULL,
    error_message TEXT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_color VARCHAR(20) DEFAULT '#84B3CE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20) DEFAULT '#84B3CE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_key VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#16587B',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_projects_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    project_id INT NULL,
    category_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    status ENUM('todo', 'in_progress', 'completed') NOT NULL DEFAULT 'todo',
    due_date DATE NOT NULL,
    completed TINYINT(1) NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_tasks_user_status (user_id, completed),
    INDEX idx_tasks_kanban (user_id, status),
    INDEX idx_tasks_due_date (due_date),
    INDEX idx_tasks_priority (priority),
    INDEX idx_tasks_display_order (display_order),
    INDEX idx_tasks_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

