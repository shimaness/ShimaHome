# ShimaHome Security Features

## Overview

ShimaHome implements enterprise-grade security features to protect tenant accounts and data. This document outlines the security architecture and features.

## 🔐 Security Features

### 1. Password Security
- **Strong Password Requirements**
  - Minimum 12 characters
  - Uppercase and lowercase letters
  - Numbers and special characters
  - No common passwords (breach database check ready)
  - Cannot reuse previous password

- **Password Reset Flow**
  - Secure magic links (15-minute expiry)
  - Single-use tokens (base64url, 32 bytes)
  - Email enumeration protection
  - Auto-revokes all sessions on reset

### 2. Multi-Factor Authentication (MFA/TOTP)
- **TOTP Support**
  - Compatible with Google Authenticator, Authy, 1Password, etc.
  - 30-second time windows
  - 2-step tolerance for clock drift
  
- **Backup Codes**
  - 10 single-use recovery codes
  - SHA-256 hashed before storage
  - Shown only once at enrollment
  - Regeneration requires MFA verification

- **Trusted Devices**
  - 30-day MFA bypass for known devices
  - Device fingerprinting (UA + screen + timezone)
  - SHA-256 hashed device identifiers
  - User-managed trusted device list

### 3. Account Lockout & Rate Limiting
- **Failed Login Protection**
  - Configurable max attempts (default: 5)
  - Progressive lockout (default: 15 minutes)
  - Attempt counter shows remaining tries
  - Auto-unlock after lockout period
  - Email notification on lockout

- **Login Tracking**
  - Success/failure logging
  - IP address tracking
  - User agent logging
  - Failure reason tracking

### 4. Session Management
- **Active Session Tracking**
  - Device name and type detection
  - IP address logging
  - Last used timestamps
  - Session expiry (30 days default)

- **Session Controls**
  - View all active sessions
  - Revoke individual sessions
  - "Logout everywhere" option
  - Auto-revoke on password change

### 5. Security Event Logging
- **Audit Trail**
  - All security events logged
  - User ID and email tracking
  - IP address and user agent
  - Metadata for context
  - Indexed for fast queries

- **Tracked Events**
  - LOGIN_SUCCESS
  - LOGIN_FAILED
  - PASSWORD_RESET_REQUESTED
  - PASSWORD_RESET_COMPLETED
  - MFA_ENABLED
  - MFA_DISABLED
  - SESSION_REVOKED
  - ACCOUNT_LOCKED
  - ACCOUNT_UNLOCKED
  - NEW_DEVICE_LOGIN

### 6. Email Notifications
- **Security Alerts**
  - New device login detection
  - Password changed
  - Password reset requested
  - MFA enabled/disabled
  - Account locked
  - Email verification codes

- **Email Features**
  - HTML and plain text versions
  - Dev mode (logs only, no sending)
  - Graceful degradation on failure
  - Branded templates
  - Action links with context

### 7. Device Detection
- **Automatic Recognition**
  - Device type (desktop/mobile/tablet)
  - Browser identification (Chrome, Safari, Firefox, Edge)
  - Operating system hints
  - IP address tracking

- **New Device Alerts**
  - Automatic detection of first-time devices
  - Email notification with device details
  - 30-day learning period

## 🛡️ Security Architecture

### Defense in Depth
1. **Authentication Layer**
   - Email verification required
   - Strong password policy
   - Optional MFA

2. **Authorization Layer**
   - Role-based access control
   - Session validation
   - Token rotation

3. **Monitoring Layer**
   - Failed login tracking
   - Security event logging
   - Anomaly detection ready

4. **Response Layer**
   - Account lockout
   - Session revocation
   - Email notifications

### Data Protection
- **Password Storage**
  - bcrypt hashing (cost factor 10)
  - Salted automatically
  - Never logged or exposed

- **Token Security**
  - JWT for access tokens (15-min expiry)
  - Hashed refresh tokens (30-day expiry)
  - Rotation on use
  - Revocation support

- **MFA Secrets**
  - Base32 encoded TOTP secrets
  - Stored encrypted at rest
  - Backup codes hashed (SHA-256)

- **Session Data**
  - Device fingerprints hashed
  - IP addresses for audit only
  - No PII in logs

## 🔧 Configuration

### Environment Variables

```bash
# Security Settings
MAX_LOGIN_ATTEMPTS=5          # Failed attempts before lockout
LOCK_DURATION_MINUTES=15      # Lockout duration
ACCESS_TTL=15m                # JWT access token lifetime
REFRESH_TTL_DAYS=30           # Refresh token lifetime

# Email Configuration
EMAIL_DEV_MODE=true           # Dev mode: log instead of send
EMAIL_FROM=noreply@shimahome.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Web Origin (for links in emails)
WEB_ORIGIN=https://your-site.vercel.app
```

### SMTP Setup (Production)

#### Gmail
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password as `SMTP_PASS`

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

## 📊 Security Monitoring

### Metrics to Track
- Failed login rate
- Account lockout frequency
- MFA adoption rate
- New device detection rate
- Session duration averages
- Password reset frequency

### Alerts to Configure
- Spike in failed logins
- Mass account lockouts
- High MFA disable rate
- Unusual geographic access patterns

## 🚨 Incident Response

### Account Compromise
1. User reports suspicious activity
2. Admin reviews security events
3. Force password reset
4. Revoke all sessions
5. Enable mandatory MFA
6. Review access logs

### Brute Force Attack
1. Automatic account lockout triggers
2. Email sent to account owner
3. Review login attempt patterns
4. Block IP ranges if needed
5. Increase lockout duration temporarily

## 🔒 Best Practices

### For Users
- Use strong, unique passwords
- Enable two-factor authentication
- Don't reuse passwords across sites
- Save backup codes securely
- Review active sessions regularly
- Verify email on new devices

### For Administrators
- Monitor security event logs
- Review lockout patterns
- Keep dependencies updated
- Rotate JWT secrets periodically
- Use environment-specific secrets
- Enable SMTP in production
- Test email delivery
- Monitor email bounces

## 📱 User Experience

### Security with Convenience
- MFA bypass for trusted devices
- Clear error messages with guidance
- Remaining attempts shown
- Email notifications keep users informed
- One-click session management
- Backup codes for recovery

### Progressive Security
- Basic: Email + Password
- Enhanced: + Email Verification
- Strong: + MFA
- Enterprise: + Device Trust + Audit Trail

## 🧪 Testing

### Security Testing Checklist
- [ ] Password strength enforcement
- [ ] Account lockout after N attempts
- [ ] Email verification required
- [ ] MFA enrollment and verification
- [ ] Backup code usage
- [ ] Password reset flow
- [ ] Session revocation
- [ ] New device detection
- [ ] Email notifications sent
- [ ] Security events logged

### Penetration Testing
- Brute force protection
- Session fixation prevention
- CSRF token validation
- XSS prevention (HTML emails)
- SQL injection prevention (Prisma ORM)
- Rate limiting effectiveness

## 📈 Future Enhancements

### Planned Features
- WebAuthn/Passkeys support
- Biometric authentication
- Risk-based authentication
- Behavioral analysis
- IP reputation checking
- Geographic restrictions
- Account recovery questions
- Security question challenges

### Advanced Monitoring
- Real-time security dashboard
- Automated anomaly detection
- Machine learning for fraud detection
- Integration with security information and event management (SIEM)

## 🆘 Support

For security concerns or to report vulnerabilities:
- Email: security@shimahome.com
- Response time: < 24 hours for critical issues

## 📄 Compliance

### Standards Alignment
- OWASP Top 10 protection
- NIST password guidelines
- GDPR data protection
- SOC 2 readiness
- ISO 27001 alignment

### Data Retention
- Login attempts: 90 days
- Security events: 1 year
- Session data: Until expiry + 30 days
- Audit logs: 7 years (configurable)

---

**Last Updated**: October 2025
**Version**: 1.0
