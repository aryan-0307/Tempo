-- ==============================================================================
-- Development Seed Data: 001_dev_seed.sql
-- Description: Idempotent seed data for development and testing.
-- ==============================================================================

-- 1. Default User (Alex Morgan)
-- Default password: Password123!
INSERT INTO users (id, username, email, password_hash, full_name, avatar_color)
VALUES (1, 'alex_morgan', 'alex@tempo.dev', '$2b$10$h3Mwa4psnAaSH2Fb095B/ONEZmVVpvjtkiaTEWtAbm/mDILcJ3eYS', 'Alex Morgan', '#84B3CE')
ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    full_name = VALUES(full_name),
    avatar_color = VALUES(avatar_color);

-- 2. Default Categories
INSERT INTO categories (id, name, slug, color) VALUES
(1, 'General', 'general', '#84B3CE'),
(2, 'Development', 'development', '#16587B'),
(3, 'Design', 'design', '#84B3CE')
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    color = VALUES(color);

-- 3. Default Projects
INSERT INTO projects (id, project_key, user_id, name, color) VALUES
(1, 'proj-1', 1, 'Work', '#16587B'),
(2, 'proj-2', 1, 'Personal', '#84B3CE'),
(3, 'proj-3', 1, 'Design System', '#16587B')
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    color = VALUES(color);

-- 4. Initial Tasks (Synchronized with Tempo Mock Database)
INSERT INTO tasks (id, user_id, project_id, category_id, title, description, priority, status, due_date, completed, display_order) VALUES
('task-1', 1, 1, 2, 'Review and finalize sprint roadmap', 'Coordinate with product team to align on Q4 deliverable milestones.', 'high', 'todo', CURDATE(), 0, 1),
('task-2', 1, 1, 1, 'Submit Q4 department budget proposal', 'Compile software licenses, cloud spend, and hardware estimates.', 'high', 'todo', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 0, 2),
('task-3', 1, 3, 3, 'Update design tokens documentation', 'Ensure all color tokens match the Venice Blue & Rock Blue palette.', 'medium', 'todo', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 0, 3),
('task-4', 1, 2, 1, 'Renew annual cloud infrastructure subscription', 'Process domain renewals and AWS reserved instances.', 'low', 'todo', CURDATE(), 0, 4),
('task-5', 1, 1, 2, 'Refactor sidebar navigation to semantic HTML', 'Replace div navigation items with accessible nav and aside landmarks.', 'medium', 'completed', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1, 5),
('task-6', 1, 2, 1, 'Schedule weekly team retrospective meeting', 'Send calendar invites and prepare Miro board retro notes.', 'low', 'completed', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 1, 6)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    priority = VALUES(priority),
    status = VALUES(status),
    due_date = VALUES(due_date),
    completed = VALUES(completed),
    display_order = VALUES(display_order);

