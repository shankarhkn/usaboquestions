// API Configuration
// Update this file when you deploy to change the API URL

const config = {
  // Local development
  local: 'http://localhost:3001/api',
  
  // Cloud deployments (update these with your actual URLs)
  railway: 'https://your-app.railway.app/api',
  render: 'https://your-app.onrender.com/api', 
  vercel: 'https://your-app.vercel.app/api',
  
  // Current environment (change this to switch between local/cloud)
  current: 'local' // Change to 'railway', 'render', or 'vercel' when deployed
};

// Export the current API URL
module.exports = {
  API_BASE_URL: config[config.current] || config.local
};
