import express from 'express';
import cors from 'cors';
import { registerUser, loginUser, getAllUsers } from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { username, password, size } = req.body;
  
  if (!username || !password || !size) {
    return res.status(400).json({ success: false, error: 'Username, password, and size required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
  }
  
  if (size < 1) {
    return res.status(400).json({ success: false, error: 'Size must be at least 1 GB' });
  }
  
  const result = await registerUser(username, password, size);
  
  if (result.success) {
    return res.status(201).json(result);
  } else {
    return res.status(400).json(result);
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }
  
  const result = await loginUser(username, password);
  
  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(401).json(result);
  }
});

// Get all users (debugging only - remove in production)
app.get('/api/users', (req, res) => {
  const users = getAllUsers();
  res.json(users);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});