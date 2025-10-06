# Deploy to Vercel (Free Tier)

Vercel is great for Node.js APIs with excellent free tier.

## Steps:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Create vercel.json:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

3. **Deploy:**
   ```bash
   cd docs/leaderboard-api
   vercel
   ```

4. **Get your URL:**
   Vercel will give you a URL like `https://your-app.vercel.app`

5. **Update frontend:**
   Change API_BASE_URL to your Vercel URL

## Benefits:
- ✅ Free tier (100GB bandwidth/month)
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Easy deployment
- ✅ Serverless (scales automatically)
