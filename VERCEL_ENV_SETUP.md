# 🔧 Vercel Environment Variables Setup

## ⚠️ CRITICAL: These Must Be Set!

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

---

## 📋 Required Variables

### 1. NextAuth Configuration
```bash
# Generate this secret first!
# Run in terminal: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

NEXTAUTH_SECRET=YOUR_GENERATED_SECRET_HERE
NEXTAUTH_URL=https://your-project.vercel.app
```

**How to generate NEXTAUTH_SECRET**:
```bash
# Windows PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OR use this online: https://generate-secret.vercel.app/32
```

**Example**:
```
NEXTAUTH_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
NEXTAUTH_URL=https://shima-home-web-tqls.vercel.app
```

### 2. API Connection
```bash
# Replace with YOUR Render API URL
API_BASE_URL=https://shimahome-api.onrender.com

# Same as your Vercel URL
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

**Example**:
```
API_BASE_URL=https://shimahome-api-xyz.onrender.com
NEXT_PUBLIC_SITE_URL=https://shima-home-web-tqls.vercel.app
```

---

## 📝 Step-by-Step Instructions

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Click on your **ShimaHome** project
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)

### Step 2: Add Each Variable
For **each** variable above:

1. Click **Add New** button
2. **Name**: Copy the variable name (e.g., `NEXTAUTH_SECRET`)
3. **Value**: Paste the value
4. **Environment**: Select ALL THREE:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **Save**

### Step 3: Redeploy
After adding all 4 variables:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋯** (three dots)
4. Click **Redeploy**
5. Wait 2-3 minutes

---

## ✅ Verification Checklist

After redeployment, check:
- [ ] No `NO_SECRET` errors in Vercel logs
- [ ] No `ECONNREFUSED` errors
- [ ] Site loads without 500 errors
- [ ] Console shows no auth errors

---

## 🔍 How to Find Your Render API URL

1. Go to https://dashboard.render.com/
2. Click on your **shimahome-api** service
3. Look at the top - you'll see the URL
4. Copy it (example: `https://shimahome-api-abc123.onrender.com`)
5. Use this as your `API_BASE_URL`

---

## 🆘 Still Getting Errors?

### Error: "NO_SECRET"
**Solution**: NEXTAUTH_SECRET not set correctly
- Make sure you clicked "Save"
- Make sure you selected all 3 environments
- Try redeploying

### Error: "ECONNREFUSED 127.0.0.1:4000"
**Solution**: API_BASE_URL not set
- Add `API_BASE_URL` with your Render URL
- Must start with `https://`
- Must NOT end with `/`

### Error: NextAuth callback error
**Solution**: NEXTAUTH_URL must match your Vercel domain exactly
- Go to your Vercel project
- Copy the **exact** production URL
- Use that as NEXTAUTH_URL

---

## 📸 Visual Guide

```
Vercel Dashboard
  └─ Your Project
      └─ Settings
          └─ Environment Variables
              └─ Add New
                  ├─ Name: NEXTAUTH_SECRET
                  ├─ Value: [paste generated secret]
                  └─ Environments: ✅ All
```

---

## ⚡ Quick Copy-Paste Template

```bash
# Replace the values with your actual data!

NEXTAUTH_SECRET=GENERATE_THIS_FIRST
NEXTAUTH_URL=https://your-vercel-url.vercel.app
API_BASE_URL=https://your-render-api.onrender.com
NEXT_PUBLIC_SITE_URL=https://your-vercel-url.vercel.app
```

---

**After setting these, your Vercel deployment will work!** ✅
