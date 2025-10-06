# Deploy BioReader Leaderboard API to Render

Since you're already using Render, this will be easy!

## Step-by-Step Instructions:

### 1. Push to GitHub (if not already done)
```bash
# If you haven't already, create a GitHub repo and push your code
git add .
git commit -m "Add leaderboard API"
git push origin main
```

### 2. Go to Render Dashboard
1. Visit https://render.com
2. Sign in to your account
3. Click "New +" → "Web Service"

### 3. Connect Your Repository
1. **Connect GitHub**: Link your repository
2. **Select Repository**: Choose your usaboquestions repo
3. **Select Branch**: Choose `main`

### 4. Configure the Service
- **Name**: `bioreader-leaderboard-api` (or any name you prefer)
- **Root Directory**: `docs/leaderboard-api`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Choose "Free" (750 hours/month)

### 5. Deploy!
1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Wait for deployment to complete (2-3 minutes)

### 6. Get Your API URL
Once deployed, you'll get a URL like:
`https://bioreader-leaderboard-api.onrender.com`

### 7. Update Frontend
Update the API URL in `docs/question-of-the-day.js`:

```javascript
// Change this line:
const API_BASE_URL = 'http://localhost:3001/api';

// To your Render URL:
const API_BASE_URL = 'https://your-app-name.onrender.com/api';
```

### 8. Test Global Leaderboards
1. Deploy your updated frontend to Render
2. Test on multiple devices
3. Leaderboards should now be global!

## Render Configuration Summary:
- **Root Directory**: `docs/leaderboard-api`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node.js
- **Plan**: Free

## Troubleshooting:
- If deployment fails, check the logs in Render dashboard
- Make sure the root directory is set to `docs/leaderboard-api`
- Ensure all dependencies are in `package.json`
