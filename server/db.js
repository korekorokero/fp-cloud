import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const db = new Database('server/users.db');

// Drop and recreate the table with size column
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export async function registerUser(username, password, size) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password, size) VALUES (?, ?, ?)');
    const result = stmt.run(username, hashedPassword, size);
    return { success: true, message: 'User registered successfully', userId: result.lastInsertRowid };
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      return { success: false, error: 'Username already exists' };
    }
    return { success: false, error: error.message };
  }
}

export async function loginUser(username, password) {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);
    
    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }
    
    const match = await bcrypt.compare(password, user.password);
    
    if (match) {
      return { 
        success: true, 
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          size: user.size
        }
      };
    } else {
      return { success: false, error: 'Invalid username or password' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

export function getAllUsers() {
  const stmt = db.prepare('SELECT id, username, size, created_at FROM users');
  return stmt.all();
}

export function deleteUser(userId) {
  try {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(userId);
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: error.message };
  }
}

export function updateUserSize(userId, newSize) {
  try {
    const stmt = db.prepare('UPDATE users SET size = ? WHERE id = ?');
    const result = stmt.run(newSize, userId);
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error('Update user size error:', error);
    return { success: false, error: error.message };
  }
}