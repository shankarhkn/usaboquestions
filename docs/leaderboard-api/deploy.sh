#!/bin/bash

echo "🚀 BioReader Leaderboard API Deployment Helper"
echo "=============================================="
echo ""
echo "Choose your deployment platform:"
echo "1) Railway (Recommended - Easiest)"
echo "2) Render (Good free tier)"
echo "3) Vercel (Serverless)"
echo "4) Manual deployment instructions"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🚂 Deploying to Railway..."
        echo "Installing Railway CLI..."
        npm install -g @railway/cli
        echo "Please login to Railway:"
        railway login
        echo "Initializing Railway project..."
        railway init
        echo "Deploying..."
        railway up
        echo "✅ Deployed! Get your URL from Railway dashboard"
        echo "Update API_BASE_URL in question-of-the-day.js with your Railway URL"
        ;;
    2)
        echo "🎨 Deploying to Render..."
        echo "1. Push this folder to GitHub"
        echo "2. Go to https://render.com"
        echo "3. Create new Web Service"
        echo "4. Connect your GitHub repo"
        echo "5. Select this folder as root"
        echo "6. Build Command: npm install"
        echo "7. Start Command: npm start"
        echo "8. Deploy!"
        echo "✅ Update API_BASE_URL with your Render URL"
        ;;
    3)
        echo "▲ Deploying to Vercel..."
        echo "Installing Vercel CLI..."
        npm install -g vercel
        echo "Deploying..."
        vercel
        echo "✅ Deployed! Update API_BASE_URL with your Vercel URL"
        ;;
    4)
        echo "📖 Manual Deployment Options:"
        echo "- Railway: https://railway.app"
        echo "- Render: https://render.com"
        echo "- Vercel: https://vercel.com"
        echo "- Heroku: https://heroku.com"
        echo "- DigitalOcean: https://digitalocean.com"
        echo ""
        echo "After deployment, update the API_BASE_URL in question-of-the-day.js"
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        ;;
esac

echo ""
echo "🔧 After deployment:"
echo "1. Get your API URL from the platform"
echo "2. Update API_BASE_URL in docs/question-of-the-day.js"
echo "3. Test the leaderboards on multiple devices"
echo ""
echo "📱 Your leaderboards will now be truly global!"
