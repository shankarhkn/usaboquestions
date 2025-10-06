# Deploy to Render (Free Tier)

Render offers a generous free tier for Node.js apps.

## Steps:

1. **Create a GitHub repository** with your leaderboard-api folder

2. **Go to Render.com** and sign up

3. **Create a new Web Service:**
   - Connect your GitHub repo
   - Select the leaderboard-api folder
   - Use these settings:
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Environment: Node

4. **Deploy:**
   - Render will automatically deploy
   - You'll get a URL like `https://your-app.onrender.com`

5. **Update frontend:**
   Change API_BASE_URL to your Render URL

## Benefits:
- ✅ Free tier (750 hours/month)
- ✅ Automatic deployments from GitHub
- ✅ HTTPS included
- ✅ Persistent storage
- ✅ No credit card required
