/**
 * Users Repository (Phase 5)
 * Parameterized SQL queries for user authentication, accounts, and profile data.
 */

import { pool } from '../pool.js';

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
        full_name AS fullName, 
        avatar_color AS avatarColor, 
        DATE_FORMAT(created_at, '%Y-%m-%dT%T.000Z') AS createdAt
      FROM users 
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
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
        full_name AS fullName, 
        avatar_color AS avatarColor
      FROM users 
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [email.trim()]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Finds user by username (case-insensitive check for uniqueness)
   */
  async findByUsername(username) {
    const query = `
      SELECT id, username, email 
      FROM users 
      WHERE LOWER(username) = LOWER(?)
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [username.trim()]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Creates a new user account with hashed password
   */
  async create({ username, email, passwordHash, fullName, avatarColor = '#6BAFA4' }) {
    const insertSql = `
      INSERT INTO users (username, email, password_hash, full_name, avatar_color)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(insertSql, [
      username.trim(),
      email.trim().toLowerCase(),
      passwordHash,
      fullName.trim(),
      avatarColor
    ]);

    const newUserId = result.insertId;

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
        'INSERT INTO projects (project_key, user_id, name, color) VALUES (?, ?, ?, ?)',
        [p.key, userId, p.name, p.color]
      );
    }
  }
};

