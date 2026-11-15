/**
 * Users Repository (PostgreSQL Edition)
 * Parameterized SQL queries for user authentication, accounts, and profile data.
 */

import { pool } from '../pool.js';

function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.fullName || row.full_name,
    avatarColor: row.avatarColor || row.avatar_color,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : (row.createdAt || new Date().toISOString())
  };
}

export const usersRepository = {
  /**
   * Finds user by primary key ID (omits password hash)
   */
  async findById(id) {
    const query = `
      SELECT 
        id, 
        username, 
        email, 
        full_name AS "fullName", 
        avatar_color AS "avatarColor", 
        created_at AS "createdAt"
      FROM users 
      WHERE id = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows.length > 0 ? formatUser(rows[0]) : null;
  },

  /**
   * Finds user by email (includes password_hash for credential validation)
   */
  async findByEmail(email) {
    const query = `
      SELECT 
        id, 
        username, 
        email, 
        password_hash, 
        full_name AS "fullName", 
        avatar_color AS "avatarColor"
      FROM users 
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [email.trim()]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      password_hash: row.password_hash,
      fullName: row.fullName || row.full_name,
      avatarColor: row.avatarColor || row.avatar_color
    };
  },

  /**
   * Finds user by username (case-insensitive check for uniqueness)
   */
  async findByUsername(username) {
    const query = `
      SELECT id, username, email 
      FROM users 
      WHERE LOWER(username) = LOWER($1)
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [username.trim()]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Creates a new user account with hashed password
   */
  async create({ username, email, passwordHash, fullName, avatarColor = '#6BAFA4' }) {
    const insertSql = `
      INSERT INTO users (username, email, password_hash, full_name, avatar_color)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const result = await pool.query(insertSql, [
      username.trim(),
      email.trim().toLowerCase(),
      passwordHash,
      fullName.trim(),
      avatarColor
    ]);

    const newUserId = result.rows[0].id;

    // Create standard default projects for new user
    await this.createDefaultProjects(newUserId);

    return this.findById(newUserId);
  },

  /**
   * Seeds default projects for a newly registered user
   */
  async createDefaultProjects(userId) {
    const defaultProjects = [
      { key: `proj-work-${userId}`, name: 'Work', color: '#6BAFA4' },
      { key: `proj-personal-${userId}`, name: 'Personal', color: '#80B9A0' },
      { key: `proj-design-${userId}`, name: 'Design System', color: '#88AFC2' }
    ];

    for (const p of defaultProjects) {
      await pool.query(
        'INSERT INTO projects (project_key, user_id, name, color) VALUES ($1, $2, $3, $4)',
        [p.key, userId, p.name, p.color]
      );
    }
  }
};

export default usersRepository;
