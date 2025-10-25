# 🔧 Deployment Fix Guide

## Issue: Deployment Failed on Render & Vercel

### Quick Fix Summary

I've updated the `package.json` to include Prisma generation in the build process. Now follow these steps:

---

## ✅ Step 1: Push the Fix

```bash
cd c:\Users\shima\Documents\ShimaHome
git add .
git commit -m "Fix: Add prisma generate to build process"
git push origin main
```

This will trigger automatic redeployment.

---

## ✅ Step 2: Verify Render Configuration

Go to Render dashboard and verify these settings:

### Build Command (should be):
```bash
npm install && npx prisma generate && npx prisma db push && npm run build
```

### Start Command (should be):
```bash
npm start
```

### Environment Variables (must have):
```
DATABASE_URL=your-neon-connection-string
JWT_SECRET=your-secret
ACCESS_TTL=15m
REFRESH_TTL_DAYS=30
EMAIL_DEV_MODE=true
WEB_ORIGIN=https://your-vercel-url.vercel.app
```

**If Build Command is different**, update it in Render:
1. Go to your service settings
2. Click "Edit"
3. Update "Build Command"
4. Click "Save Changes"
5. Manual redeploy

---

## ✅ Step 3: Verify Vercel Configuration

Vercel should auto-detect Next.js settings, but verify:

### Root Directory:
```
apps/web
```

### Build Command:
```
next build
```

### Output Directory:
```
.next
```

### Environment Variables (must have):
```
API_BASE_URL=https://your-render-api.onrender.com
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
```

---

## 🔍 Common Deployment Errors & Fixes

### Error 1: "Cannot find module '@prisma/client'"
**Fix**: Added `postinstall` script to generate Prisma client
- Solution: Already fixed in package.json

### Error 2: "prisma.propertyListing is not a function"
**Fix**: Prisma client not regenerated with new schema
- Solution: Added `prisma generate` to build script

### Error 3: "Module not found: Can't resolve '../../../shared'"
**Fix**: Workspace dependency issue
- Solution: Ensure all packages installed

### Error 4: TypeScript compilation errors
**Possible Issues**:
- Missing type definitions
- Import path errors
- Circular dependencies

**Quick Check**:
```bash
cd services/api
npm run build
# Should complete without errors
```

### Error 5: "Database connection refused"
**Fix**: DATABASE_URL environment variable not set correctly
- Solution: Check Render environment variables
- Ensure connection string includes `?sslmode=require`

---

## 🚨 If Render Build Still Fails

### Manual Fix Steps:

1. **Check Logs**:
   - Go to Render dashboard
   - Click on failed deploy
   - Read the error message carefully

2. **Common Issues**:
   
   **a) Prisma Schema Error**:
   ```bash
   # Run locally to verify schema is valid
   cd services/api
   npx prisma validate
   npx prisma generate
   ```

   **b) TypeScript Compilation Error**:
   ```bash
   cd services/api
   npm run build
   # Fix any TypeScript errors shown
   ```

   **c) Missing Dependencies**:
   ```bash
   cd services/api
   npm install
   # Check if all dependencies install successfully
   ```

3. **Force Clean Build on Render**:
   - Go to Render dashboard
   - Service Settings
   - Click "Manual Deploy"
   - Select "Clear build cache & deploy"

---

## 🚨 If Vercel Build Still Fails

### Manual Fix Steps:

1. **Check Logs**:
   - Go to Vercel dashboard
   - Click on failed deployment
   - Look at "Build Logs" tab

2. **Common Issues**:

   **a) Next.js Build Error**:
   ```bash
   cd apps/web
   npm run build
   # Fix any errors shown
   ```

   **b) TypeScript Type Error**:
   - Check if all .tsx files have correct imports
   - Verify API route files are properly typed

   **c) Missing Environment Variables**:
   - Go to Vercel project settings
   - Environment Variables tab
   - Ensure `API_BASE_URL` and `NEXT_PUBLIC_SITE_URL` are set

3. **Force Redeploy**:
   - Go to Vercel dashboard
   - Deployments tab
   - Click "Redeploy" on latest commit

---

## 🔧 Local Testing Before Push

Always test locally first:

```bash
# Test API Build
cd services/api
npx prisma generate
npm run build
npm start
# Visit http://localhost:4000/properties

# Test Web Build  
cd ../../apps/web
npm run build
npm start
# Visit http://localhost:3000
```

If both work locally, they should work on deployment.

---

## 📋 Deployment Checklist

Before pushing:
- [ ] `npx prisma validate` passes
- [ ] `npm run build` works in services/api
- [ ] `npm run build` works in apps/web
- [ ] No TypeScript errors
- [ ] All environment variables set
- [ ] Git committed and pushed

After pushing:
- [ ] Render build starts automatically
- [ ] Vercel build starts automatically
- [ ] Check logs for any errors
- [ ] Visit deployed URLs to verify

---

## 🆘 Last Resort: Fresh Deploy

If nothing works, try a fresh deploy:

### For Render:
1. Delete existing service
2. Create new Web Service
3. Connect GitHub repo
4. Set Root Directory: `services/api`
5. Build Command: `npm install && npx prisma generate && npx prisma db push && npm run build`
6. Start Command: `npm start`
7. Add all environment variables
8. Deploy

### For Vercel:
1. Delete existing project
2. Import from GitHub
3. Select repository
4. Root Directory: `apps/web`
5. Framework: Next.js (auto-detected)
6. Add environment variables
7. Deploy

---

## 📞 Debugging Help

If you share the error logs, I can provide specific fixes:

1. **Render Error**: Copy last 30 lines of build log
2. **Vercel Error**: Copy build error from logs
3. **Share here** and I'll diagnose

---

## ✅ Success Indicators

Deployment successful when:
- ✅ Render shows: "Live" status
- ✅ Vercel shows: "Ready" status  
- ✅ API URL returns: `[]` for `/properties`
- ✅ Web URL loads without errors
- ✅ No console errors in browser

---

**Let's get this deployed! Follow Step 1 first (push the fix), then check if it auto-deploys successfully.**
