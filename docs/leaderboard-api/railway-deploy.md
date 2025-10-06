# Deploy to Railway (Free Tier)

Railway is the easiest way to deploy your API with a free tier.

## Steps:

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize Railway project:**
   ```bash
   cd docs/leaderboard-api
   railway init
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

5. **Get your URL:**
   Railway will give you a URL like `https://your-app.railway.app`

6. **Update the frontend:**
   Change the API_BASE_URL in question-of-the-day.js to your Railway URL

## Benefits:
- ✅ Free tier (500 hours/month)
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Easy deployment
- ✅ Persistent storage
