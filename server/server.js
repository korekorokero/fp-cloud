import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import { registerUser, loginUser, getAllUsers, deleteUser, updateUserSize } from './db.js';

const execAsync = promisify(exec);
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
    // Run create_tenant.sh AFTER user is saved to database
    try {
      const port = 9000 + result.userId;
      const command = `sudo ./nextcloud/create_tenant.sh ${result.userId} ${port} ${size}G`;
      console.log(`Running: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, { timeout: 300000 });
      console.log('Tenant creation output:', stdout);
      
      if (stderr) {
        console.error('Tenant creation stderr:', stderr);
      }
      
      return res.status(201).json({ 
        success: true, 
        message: 'User registered and storage created successfully',
        userId: result.userId 
      });
    } catch (error) {
      console.error('Tenant creation error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'User created but storage setup failed. Please contact administrator.',
        details: error.message
      });
    }
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

// Start tenant endpoint
app.post('/api/start-tenant', async (req, res) => {
  const { username, userId } = req.body;
  
  if (!username || !userId) {
    return res.status(400).json({ success: false, error: 'Username and userId required' });
  }
  
  try {
    const command = `sudo ./nextcloud/start_tenant.sh ${userId}`;
    const { stdout, stderr } = await execAsync(command);
    
    const port = 9000 + userId;
    
    return res.status(200).json({ 
      success: true, 
      message: 'Tenant started successfully',
      port: port,
      output: stdout
    });
  } catch (error) {
    console.error('Start tenant error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to start tenant',
      details: error.message
    });
  }
});

// Update tenant endpoint
app.post('/api/update-tenant', async (req, res) => {
  const { userId, newSize } = req.body;
  
  if (!userId || !newSize) {
    return res.status(400).json({ success: false, error: 'userId and newSize required' });
  }
  
  if (newSize < 1) {
    return res.status(400).json({ success: false, error: 'Size must be at least 1 GB' });
  }
  
  try {
    // Run update tenant script with size option
    const command = `sudo ./nextcloud/update_tenant.sh ${userId} -s ${newSize}G`;
    console.log(`Running: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    console.log('Tenant update output:', stdout);
    
    if (stderr) {
      console.error('Tenant update stderr:', stderr);
    }
    
    // Update the size in the database
    const updateResult = updateUserSize(userId, newSize);
    
    if (updateResult.success) {
      return res.status(200).json({ 
        success: true, 
        message: 'Storage size updated successfully',
        newSize: newSize
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Storage updated but failed to update database',
        details: updateResult.error
      });
    }
  } catch (error) {
    console.error('Update tenant error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update storage',
      details: error.message
    });
  }
});

// Delete tenant endpoint
app.post('/api/delete-tenant', async (req, res) => {
  const { username, userId } = req.body;
  
  if (!username || !userId) {
    return res.status(400).json({ success: false, error: 'Username and userId required' });
  }
  
  try {
    // First run the delete tenant script
    const command = `sudo ./nextcloud/delete_tenant.sh ${userId}`;
    console.log(`Running: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    console.log('Tenant deletion output:', stdout);
    
    if (stderr) {
      console.error('Tenant deletion stderr:', stderr);
    }
    
    // Then delete the user from the database
    const deleteResult = deleteUser(userId);
    
    if (deleteResult.success) {
      return res.status(200).json({ 
        success: true, 
        message: 'Storage and account deleted successfully'
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Storage deleted but failed to remove account from database',
        details: deleteResult.error
      });
    }
  } catch (error) {
    console.error('Delete tenant error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to delete storage',
      details: error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});