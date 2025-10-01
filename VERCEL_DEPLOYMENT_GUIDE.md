# EcoAtlas AI - Vercel Deployment Guide

This guide will help you deploy your EcoAtlas AI application to Vercel. Your project has both a React frontend and a Node.js backend, so we'll cover deployment options for both.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Node.js**: Version 18.x or higher
4. **Vercel CLI** (optional): `npm i -g vercel`

## Deployment Options

### Option 1: Frontend Only (Recommended for Quick Start)

Deploy just the React frontend to Vercel and host the backend separately.

### Option 2: Full Stack (Advanced)

Deploy both frontend and backend using Vercel Functions.

---

## Option 1: Frontend-Only Deployment (Recommended)

### Step 1: Prepare Your Repository

1. **Commit all changes** to your GitHub repository:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

### Step 2: Deploy to Vercel

#### Method A: Using Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect it's a React app
5. Configure the following settings:
   - **Framework Preset**: Create React App
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

#### Method B: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. In your project root, run:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Link to existing project? **No**
   - Project name: `ecoatlas-ai` (or your preferred name)
   - Directory: `./` (current directory)
   - Override settings? **No**

### Step 3: Configure Environment Variables

In your Vercel dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add the following variables:

   ```
   REACT_APP_API_URL = https://your-backend-url.herokuapp.com/api
   REACT_APP_GOOGLE_CLIENT_ID = your_actual_google_client_id_here
   ```

   **Note**: Replace `your-backend-url.herokuapp.com` with your actual backend URL.

### Step 4: Deploy Backend Separately

Since your backend uses SQLite and file system, you'll need to deploy it to a platform that supports persistent storage:

#### Option A: Railway
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select the `backend` folder
4. Add environment variables from `backend/env.example`
5. Deploy

#### Option B: Render
1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set root directory to `backend`
5. Add environment variables
6. Deploy

#### Option C: Heroku
1. Install Heroku CLI
2. Create a new app: `heroku create your-app-name`
3. Set environment variables: `heroku config:set JWT_SECRET=your-secret`
4. Deploy: `git subtree push --prefix backend heroku main`

---

## Option 2: Full Stack Deployment (Advanced)

### Step 1: Convert Backend to Vercel Functions

Create API routes in the `api` folder:

1. **Create `api/auth.js`**:
   ```javascript
   // Move your auth logic here
   // This will be available at /api/auth
   ```

2. **Create `api/sensors.js`**:
   ```javascript
   // Move your sensor API logic here
   // This will be available at /api/sensors
   ```

### Step 2: Update Frontend API Calls

Update your frontend to use relative API paths:
```javascript
// Instead of: http://localhost:3001/api
// Use: /api
const API_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';
```

### Step 3: Deploy to Vercel

1. Follow the same steps as Option 1
2. Your API routes will be automatically deployed as serverless functions

---

## Environment Variables Setup

### Frontend Variables (Vercel Dashboard)

```
REACT_APP_API_URL = /api (for full-stack) or https://your-backend-url.com/api (for frontend-only)
REACT_APP_GOOGLE_CLIENT_ID = your_google_client_id
```

### Backend Variables (if deploying separately)

```
PORT = 3001
JWT_SECRET = your-super-secret-jwt-key
EMAIL_USER = your-email@gmail.com
EMAIL_PASS = your-app-password
FRONTEND_URL = https://your-vercel-app.vercel.app
DATABASE_URL = ./auth.db
BCRYPT_ROUNDS = 12
JWT_EXPIRES_IN = 24h
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 5
```

---

## Post-Deployment Checklist

### ✅ Frontend
- [ ] Site loads without errors
- [ ] Google Sign-In works
- [ ] Theme switching works
- [ ] All components render correctly
- [ ] Mobile responsiveness works

### ✅ Backend (if separate)
- [ ] API endpoints respond correctly
- [ ] Authentication works
- [ ] Database operations work
- [ ] Email functionality works
- [ ] CORS is configured for your Vercel domain

### ✅ Integration
- [ ] Frontend can communicate with backend
- [ ] Real-time data updates work
- [ ] File uploads work (if applicable)
- [ ] All features work in production

---

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Node.js version (should be 18.x+)
   - Ensure all dependencies are in `package.json`
   - Check for TypeScript errors

2. **Environment Variables Not Working**
   - Ensure variables start with `REACT_APP_` for frontend
   - Redeploy after adding new variables
   - Check variable names match exactly

3. **API Calls Failing**
   - Verify CORS settings in backend
   - Check API URL configuration
   - Ensure backend is deployed and accessible

4. **Google Sign-In Issues**
   - Update authorized domains in Google Console
   - Add your Vercel domain to authorized origins
   - Check client ID configuration

### Getting Help

- Check Vercel deployment logs in the dashboard
- Use browser developer tools to debug frontend issues
- Check backend logs on your hosting platform
- Review the Vercel documentation: [vercel.com/docs](https://vercel.com/docs)

---

## Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update Google OAuth settings with new domain

---

## Performance Optimization

1. **Enable Vercel Analytics** in project settings
2. **Configure caching** for static assets
3. **Optimize images** using Vercel's Image Optimization
4. **Enable compression** in Vercel settings

---

## Security Considerations

1. **Never commit** `.env` files
2. **Use strong JWT secrets** in production
3. **Enable HTTPS** (automatic with Vercel)
4. **Configure CORS** properly
5. **Rate limiting** on API endpoints
6. **Input validation** on all forms

---

## Next Steps

After successful deployment:

1. Set up monitoring and analytics
2. Configure automated deployments from GitHub
3. Set up staging environment
4. Implement CI/CD pipeline
5. Add error tracking (Sentry, etc.)

---

## Support

If you encounter issues:

1. Check the deployment logs in Vercel dashboard
2. Review this guide for common solutions
3. Check Vercel documentation
4. Contact support if needed

**Happy Deploying! 🚀**
