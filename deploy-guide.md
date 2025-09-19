# 🌐 EcoAtlas AI Production Deployment Guide

## 🎯 **Quick Deploy to Your Domain**

### **Step 1: Update Google OAuth**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Edit your OAuth 2.0 Client ID
3. Add your production domain:
   - **Authorized JavaScript origins:** `https://yourdomain.com`
   - **Authorized redirect URIs:** `https://yourdomain.com`

### **Step 2: Environment Variables**

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

**Backend (.env.production):**
```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-for-production
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=https://yourdomain.com
```

### **Step 3: Build Frontend**
```bash
npm run build
```

### **Step 4: Deploy Options**

#### **Option A: Netlify (Easiest)**
1. Go to [Netlify](https://netlify.com)
2. Drag and drop your `build` folder
3. Set up custom domain
4. Deploy backend to Railway/Heroku

#### **Option B: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
vercel --prod

# Deploy backend
cd backend
vercel --prod
```

#### **Option C: Your Own Server**
1. Upload `build` folder to your server
2. Set up Nginx/Apache
3. Configure SSL certificate
4. Set up PM2 for Node.js backend

### **Step 5: Update DNS**
Point your domain to your hosting provider:
- **A Record:** `@` → `your-server-ip`
- **CNAME:** `www` → `yourdomain.com`

### **Step 6: SSL Certificate**
- **Let's Encrypt** (free)
- **Cloudflare** (free)
- **Your hosting provider**

## 🔧 **Production Checklist**

- [ ] Google OAuth updated for production domain
- [ ] Environment variables set for production
- [ ] Frontend built (`npm run build`)
- [ ] Backend deployed to production server
- [ ] Domain DNS configured
- [ ] SSL certificate installed
- [ ] OAuth tested on production domain

## 🚀 **Quick Start Commands**

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Deploy backend
cd backend
vercel --prod
```

## 📞 **Need Help?**

1. **Domain setup** - Check your domain registrar
2. **Hosting** - Choose Netlify, Vercel, or your own server
3. **SSL** - Use Let's Encrypt or Cloudflare
4. **OAuth** - Update Google Console settings

Your EcoAtlas AI will be live on your domain! 🎉
