# ShimaHome Deployment Guide

Complete guide for deploying ShimaHome with all security features enabled.

## Prerequisites

- Neon Postgres database (or any PostgreSQL)
- Render account (for API hosting)
- Vercel account (for web hosting)
- GitHub repository
- SMTP credentials (Gmail, SendGrid, or AWS SES)

## 📋 Deployment Checklist

### 1. Database Setup (Neon)

1. Create a new Neon project at https://console.neon.tech/
2. Create a database named `shimahome`
3. Copy the connection string (make sure pooling is OFF)
4. Format: `postgresql://user:pass@host/shimahome?sslmode=require`

### 2. Email Service Setup

Choose one of the following:

#### Option A: Gmail (Quick Setup)
1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an App Password for "Mail"
4. Use these settings:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

#### Option B: SendGrid (Recommended for Production)
1. Sign up at https://sendgrid.com/
2. Create an API key
3. Use these settings:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

#### Option C: AWS SES (Enterprise)
1. Set up AWS SES in your region
2. Verify your domain
3. Get SMTP credentials
4. Use these settings:
   ```
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-ses-username
   SMTP_PASS=your-ses-password
   ```

### 3. API Deployment (Render)

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Render Web Service**
   - Go to https://dashboard.render.com/
   - New → Web Service
   - Connect your GitHub repository
   - Select `shimaness/ShimaHome`

3. **Configure Service**
   ```
   Name: shimahome-api
   Root Directory: services/api
   Environment: Node
   Branch: main
   Build Command: npm install && npx prisma generate && npx prisma db push && npm run build
   Start Command: npm run start
   ```

4. **Environment Variables**
   Add these in Render dashboard:

   ```bash
   # Database
   DATABASE_URL=your-neon-connection-string

   # JWT
   JWT_SECRET=generate-a-strong-random-secret-here
   ACCESS_TTL=15m
   REFRESH_TTL_DAYS=30

   # Email (PRODUCTION MODE)
   EMAIL_DEV_MODE=false
   EMAIL_FROM=noreply@shimahome.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # Email Verification
   EMAIL_CODE_TTL_MIN=15

   # Security
   MAX_LOGIN_ATTEMPTS=5
   LOCK_DURATION_MINUTES=15

   # Web Origin
   WEB_ORIGIN=https://your-site.vercel.app
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Copy your API URL: `https://shimahome-api-XXXX.onrender.com`

6. **Verify API**
   - Visit: `https://your-api-url.onrender.com/properties`
   - Should return: `[]`

### 4. Web Deployment (Vercel)

1. **Connect to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository

2. **Configure Project**
   ```
   Framework Preset: Next.js
   Root Directory: apps/web
   Build Command: (leave default)
   Output Directory: (leave default)
   ```

3. **Environment Variables**
   Add in Vercel dashboard:

   ```bash
   API_BASE_URL=https://shimahome-api-XXXX.onrender.com
   NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
   ```

   Select: ✓ Production ✓ Preview ✓ Development

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Copy your Vercel URL

5. **Update API WEB_ORIGIN**
   - Go back to Render
   - Update `WEB_ORIGIN` to your actual Vercel URL
   - Save (triggers redeploy)

### 5. Post-Deployment Verification

#### Test Email Delivery
1. Register a new account
2. Check email for verification code
3. Verify the code works
4. Check spam folder if not received

#### Test Security Features
1. **Password Reset**
   - Go to `/forgot-password`
   - Enter email
   - Check email for reset link
   - Reset password
   - Verify old sessions are logged out

2. **Account Lockout**
   - Try logging in with wrong password 5 times
   - Verify account is locked
   - Check email for lockout notification
   - Wait 15 minutes or reset password

3. **MFA Setup**
   - Go to `/profile/security`
   - Enable 2FA
   - Scan QR code with authenticator app
   - Save backup codes
   - Check email for MFA enabled notification

4. **New Device Detection**
   - Log in from different browser
   - Check email for new device notification

5. **Session Management**
   - Go to `/profile/security/sessions`
   - View active sessions
   - Revoke a session
   - Verify it logs out

## 🔧 Configuration Tips

### JWT Secret Generation
```bash
# Generate a strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Email Testing (Dev Mode)
For development/testing without SMTP:
```bash
EMAIL_DEV_MODE=true
```
Emails will be logged to console instead of sent.

### Security Hardening
```bash
# Stricter lockout
MAX_LOGIN_ATTEMPTS=3
LOCK_DURATION_MINUTES=30

# Shorter token lifetimes
ACCESS_TTL=5m
REFRESH_TTL_DAYS=7
```

## 🚨 Troubleshooting

### API Won't Start
- Check DATABASE_URL format
- Verify Prisma migrations ran
- Check Render logs for errors
- Ensure Node version matches (20+)

### Emails Not Sending
- Verify EMAIL_DEV_MODE=false
- Check SMTP credentials
- Test SMTP connection separately
- Check email service logs
- Verify sender email is allowed

### MFA Not Working
- Check device time sync
- Verify TOTP secret generated
- Try backup code instead
- Check browser console for errors

### Session Issues
- Clear browser cookies
- Check token expiry settings
- Verify DATABASE_URL connection
- Check for clock skew

## 📊 Monitoring

### Render Logs
- View real-time logs in Render dashboard
- Filter by "error" or "security"
- Download logs for analysis

### Email Delivery
- Monitor bounce rates
- Check spam complaints
- Verify sender reputation

### Security Events
Query via Prisma Studio or SQL:
```sql
SELECT * FROM "SecurityEvent" 
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY "createdAt" DESC;
```

### Failed Logins
```sql
SELECT email, COUNT(*) as attempts
FROM "LoginAttempt"
WHERE succeeded = false 
AND "createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY email
ORDER BY attempts DESC;
```

## 🔄 Updates & Maintenance

### Deploying Updates
1. Push changes to GitHub
2. Render auto-deploys API (5-10 min)
3. Vercel auto-deploys Web (2-3 min)
4. Monitor logs for errors

### Database Migrations
When schema changes:
```bash
# Local development
npx prisma db push

# Production (Render does this automatically)
# Included in Build Command
```

### Rotating Secrets
1. Generate new JWT_SECRET
2. Update in Render
3. Wait for deployment
4. All users will need to re-login

### Backup Database
Neon provides automatic backups:
- Point-in-time recovery
- Branches for testing
- Export via pg_dump

## 🔐 Security Best Practices

### API Keys
- Never commit .env files
- Use environment variables
- Rotate regularly
- Use different keys per environment

### Monitoring
- Set up alerts for failed logins
- Monitor account lockouts
- Track MFA adoption rate
- Review security events weekly

### Updates
- Keep dependencies updated
- Monitor security advisories
- Test updates in preview first
- Have rollback plan

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **NestJS Docs**: https://docs.nestjs.com

## ✅ Production Checklist

Before going live:

- [ ] Database configured with strong password
- [ ] JWT_SECRET is unique and strong
- [ ] EMAIL_DEV_MODE=false
- [ ] SMTP credentials verified
- [ ] WEB_ORIGIN set correctly
- [ ] Test email delivery
- [ ] Test password reset
- [ ] Test MFA enrollment
- [ ] Test account lockout
- [ ] Test new device detection
- [ ] Verify all environment variables
- [ ] Set up monitoring alerts
- [ ] Review security logs
- [ ] Test from multiple devices
- [ ] Test from different networks
- [ ] Backup database
- [ ] Document admin procedures

---

**Deployment Status**: ✅ Auto-deploy enabled via GitHub
**Estimated Setup Time**: 30-45 minutes
**Last Updated**: October 2025
