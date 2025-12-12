import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create/open database
const db = new Database(path.join(__dirname, 'users.db'));

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Hash password
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Register new user
async function registerUser(username, password, size) {
  try {
    const hashedPassword = await hashPassword(password);
    const stmt = db.prepare('INSERT INTO users (username, password, size) VALUES (?, ?, ?)');
    const result = stmt.run(username, hashedPassword, size);
    return { success: true, userId: result.lastInsertRowid };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return { success: false, error: 'Username already exists' };
    }
    return { success: false, error: error.message };
  }
}

// Login user
async function loginUser(username, password) {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);
    
    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }
    
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      return { success: false, error: 'Invalid username or password' };
    }
    
    return { success: true, user: { id: user.id, username: user.username, size: user.size } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get all users (for debugging)
function getAllUsers() {
  const stmt = db.prepare('SELECT id, username, size, created_at FROM users');
  return stmt.all();
}

export {
  registerUser,
  loginUser,
  getAllUsers,
  db
};