@echo off
echo ========================================
echo EcoAtlas AI - Vercel Deployment Script
echo ========================================
echo.

echo Step 1: Installing Vercel CLI...
npm install -g vercel

echo.
echo Step 2: Building the project...
npm run build

echo.
echo Step 3: Deploying to Vercel...
vercel --prod

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Go to your Vercel dashboard
echo 2. Add environment variables:
echo    - REACT_APP_API_URL
echo    - REACT_APP_GOOGLE_CLIENT_ID
echo 3. Deploy your backend separately (Railway/Render/Heroku)
echo 4. Update REACT_APP_API_URL with your backend URL
echo.
echo For detailed instructions, see VERCEL_DEPLOYMENT_GUIDE.md
echo.
pause
