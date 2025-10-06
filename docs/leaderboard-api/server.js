const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Data file path
const DATA_FILE = path.join(__dirname, 'leaderboard-data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  const initialData = {
    weekly: [],
    monthly: []
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Helper function to get current week number
function getCurrentWeek() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

// Helper function to get current month
function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM format
}

// Helper function to read data
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return { weekly: [], monthly: [] };
  }
}

// Helper function to write data
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
}

// Helper function to update leaderboard
function updateLeaderboard(leaderboard, username, points, weekOrMonth) {
  const existingIndex = leaderboard.findIndex(entry => entry.username === username && entry.period === weekOrMonth);
  
  if (existingIndex >= 0) {
    // Update existing entry
    leaderboard[existingIndex].points = Math.max(leaderboard[existingIndex].points, points);
    leaderboard[existingIndex].lastUpdated = new Date().toISOString();
  } else {
    // Add new entry
    leaderboard.push({
      username,
      points,
      period: weekOrMonth,
      lastUpdated: new Date().toISOString()
    });
  }
  
  // Sort by points (descending) and keep top 10
  leaderboard.sort((a, b) => b.points - a.points);
  return leaderboard.slice(0, 10);
}

// Routes

// Get leaderboards
app.get('/api/leaderboards', (req, res) => {
  try {
    const data = readData();
    res.json({
      success: true,
      data: {
        weekly: data.weekly || [],
        monthly: data.monthly || []
      }
    });
  } catch (error) {
    console.error('Error getting leaderboards:', error);
    res.status(500).json({ success: false, error: 'Failed to get leaderboards' });
  }
});

// Update leaderboard
app.post('/api/leaderboard/update', (req, res) => {
  try {
    const { username, points, type } = req.body;
    
    if (!username || typeof points !== 'number' || !type) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const data = readData();
    const currentWeek = getCurrentWeek();
    const currentMonth = getCurrentMonth();
    
    if (type === 'weekly') {
      data.weekly = updateLeaderboard(data.weekly, username, points, currentWeek);
    } else if (type === 'monthly') {
      data.monthly = updateLeaderboard(data.monthly, username, points, currentMonth);
    } else {
      return res.status(400).json({ success: false, error: 'Invalid type. Use "weekly" or "monthly"' });
    }
    
    if (writeData(data)) {
      res.json({ success: true, message: 'Leaderboard updated successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update leaderboard' });
    }
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    res.status(500).json({ success: false, error: 'Failed to update leaderboard' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Leaderboard API is running' });
});

app.listen(PORT, () => {
  console.log(`Leaderboard API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
