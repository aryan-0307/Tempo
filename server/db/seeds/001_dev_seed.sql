-- ==============================================================================
-- Development Seed Data: 001_dev_seed.sql (PostgreSQL Edition)
-- Description: Idempotent seed data for development and testing.
-- ==============================================================================

-- 1. Default User (Alex Morgan)
-- Default password: Password123!
INSERT INTO users (username, email, password_hash, full_name, avatar_color)
VALUES ('alex_morgan', 'alex@tempo.dev', '$2b$10$h3Mwa4psnAaSH2Fb095B/ONEZmVVpvjtkiaTEWtAbm/mDILcJ3eYS', 'Alex Morgan', '#84B3CE')
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    avatar_color = EXCLUDED.avatar_color;

-- 2. Default Categories
INSERT INTO categories (name, slug, color) VALUES
('General', 'general', '#84B3CE'),
('Development', 'development', '#16587B'),
('Design', 'design', '#84B3CE')
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    color = EXCLUDED.color;

-- 3. Default Projects
INSERT INTO projects (project_key, user_id, name, color) VALUES
('proj-1', 1, 'Work', '#16587B'),
('proj-2', 1, 'Personal', '#84B3CE'),
('proj-3', 1, 'Design System', '#16587B')
ON CONFLICT (project_key) DO UPDATE SET 
    name = EXCLUDED.name,
    color = EXCLUDED.color;

-- 4. Initial Tasks (Synchronized with Tempo Database)
INSERT INTO tasks (id, user_id, project_id, category_id, title, description, priority, status, due_date, completed, display_order) VALUES
('task-1', 1, 1, 2, 'Review and finalize sprint roadmap', 'Coordinate with product team to align on Q4 deliverable milestones.', 'high', 'todo', CURRENT_DATE, FALSE, 1),
('task-2', 1, 1, 1, 'Submit Q4 department budget proposal', 'Compile software licenses, cloud spend, and hardware estimates.', 'high', 'todo', (CURRENT_DATE - INTERVAL '2 days')::date, FALSE, 2),
('task-3', 1, 3, 3, 'Update design tokens documentation', 'Ensure all color tokens match the Venice Blue & Rock Blue palette.', 'medium', 'todo', (CURRENT_DATE + INTERVAL '1 day')::date, FALSE, 3),
('task-4', 1, 2, 1, 'Renew annual cloud infrastructure subscription', 'Process domain renewals and AWS reserved instances.', 'low', 'todo', CURRENT_DATE, FALSE, 4),
('task-5', 1, 1, 2, 'Refactor sidebar navigation to semantic HTML', 'Replace div navigation items with accessible nav and aside landmarks.', 'medium', 'completed', (CURRENT_DATE - INTERVAL '1 day')::date, TRUE, 5),
('task-6', 1, 2, 1, 'Schedule weekly team retrospective meeting', 'Send calendar invites and prepare Miro board retro notes.', 'low', 'completed', (CURRENT_DATE - INTERVAL '3 days')::date, TRUE, 6)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    priority = EXCLUDED.priority,
    status = EXCLUDED.status,
    due_date = EXCLUDED.due_date,
    completed = EXCLUDED.completed,
    display_order = EXCLUDED.display_order;
