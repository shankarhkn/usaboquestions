#!/usr/bin/env node

// Script to update the frontend with the Render API URL
const fs = require('fs');
const path = require('path');

const RENDER_URL = process.argv[2];

if (!RENDER_URL) {
  console.log('Usage: node update-frontend.js <your-render-url>');
  console.log('Example: node update-frontend.js https://bioreader-leaderboard-api.onrender.com');
  process.exit(1);
}

// Ensure the URL has the /api path
const API_URL = RENDER_URL.endsWith('/api') ? RENDER_URL : `${RENDER_URL}/api`;

const frontendFile = path.join(__dirname, '..', 'question-of-the-day.js');

if (!fs.existsSync(frontendFile)) {
  console.error('Frontend file not found:', frontendFile);
  process.exit(1);
}

// Read the current file
let content = fs.readFileSync(frontendFile, 'utf8');

// Update the API_BASE_URL
const oldPattern = /const API_BASE_URL = \(\(\) => \{[\s\S]*?\}\)\(\);/;
const newCode = `const API_BASE_URL = '${API_URL}';`;

if (oldPattern.test(content)) {
  content = content.replace(oldPattern, newCode);
  fs.writeFileSync(frontendFile, content);
  console.log('✅ Updated frontend with Render API URL:', API_URL);
  console.log('📁 Updated file:', frontendFile);
} else {
  console.error('❌ Could not find API_BASE_URL pattern in frontend file');
  console.log('Please manually update the API URL in question-of-the-day.js');
}
