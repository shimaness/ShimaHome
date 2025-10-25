# ShimaHome Testing Guide

## 🚀 Deployment Checklist

### Step 1: Verify API Deployment (Render)
1. Go to https://dashboard.render.com/
2. Check your `shimahome-api` service
3. Look for latest deploy with commit: "Revolutionary Property Discovery System"
4. Status should be: **Live** ✅
5. Check logs for: "Nest application successfully started"

**Test API Health**:
```bash
curl https://your-api-url.onrender.com/properties
# Should return: []
```

### Step 2: Verify Web Deployment (Vercel)
1. Go to https://vercel.com/dashboard
2. Check your ShimaHome project
3. Latest deployment should show: "Revolutionary Property Discovery System"
4. Status: **Ready** ✅
5. Visit: https://your-site.vercel.app

### Step 3: Verify Database Migrations
**Important**: New schema needs to be applied!

Run Prisma migrations:
```bash
cd services/api
npx prisma db push
```

**New Tables Created**:
- ✅ PropertyListing
- ✅ PropertyUnit
- ✅ UnitPhoto

**Verify**:
```bash
npx prisma studio
# Check that new tables exist
```

---

## 🧪 Complete Testing Flow

### Test 1: Welcome Experience

1. **Register New Account**
   - Go to `/register`
   - Email: `landlord@test.com`
   - Password: `Test12345!@#$`
   - Role: **LANDLORD**
   - Click "Register"

2. **Verify Email**
   - Check console logs for verification code (dev mode)
   - Or check your email inbox
   - Enter 6-digit code
   - Click "Verify"

3. **Login**
   - Go to `/login`
   - Enter credentials
   - **Expected**: See welcome splash screen! 🎉
   - Should show:
     - Animated gradient background
     - Floating house icon
     - 3 feature cards
     - Loading dots
   - After 3 seconds → Redirects to landlord dashboard

**✅ Pass**: Welcome screen appears and redirects correctly
**❌ Fail**: If redirects immediately without splash

---

### Test 2: Landlord Profile & Verification

1. **Create Landlord Profile**
   - Navigate to `/landlord/onboarding`
   - Fill in:
     ```
     Full Name: John Doe
     Phone: +254712345678
     ID Number: 12345678
     Residence Area: Nairobi
     ```
   - Click "Save and continue"

2. **Phone Verification**
   - Select: Phone
   - Click "Send code"
   - Check console for 6-digit code
   - Enter code
   - Click "Confirm"
   - **Expected**: Green success message

3. **Upload Ownership Document**
   - Choose file: Any PDF or image
   - Click "Upload and continue"
   - **Expected**: Document uploaded successfully

**✅ Pass**: Profile created, phone verified, document uploaded
**❌ Fail**: Any step shows error

---

### Test 3: Property Registration (The Main Event!)

1. **Navigate to Property Registration**
   - Go to `/landlord/properties/register`
   - You should see a 4-step progress indicator

2. **Step 1: Create Property**
   ```
   Property Name: Onesmus Hostels
   Location: Meru
   Address: Meru Town, Near Meru University
   Description: Modern student hostels with 24/7 security
   ```
   - Click "Create Property & Continue"
   - **Expected**: Success message + move to Step 2

3. **Step 2: Add Unit**
   ```
   Unit Name: On 2
   Unit Type: One Bedroom (dropdown)
   Monthly Rent: 8000
   Deposit: 8000
   Description: Spacious 1BR with balcony and modern fittings
   ```
   - Click "Create Unit & Continue"
   - **Expected**: Success message + move to Step 3

4. **Step 3: Upload Tagged Photos** ⭐ CRITICAL TEST

   **Upload Bedroom Photos**:
   - Select "Bedroom" from dropdown
   - Choose 2-3 photos of a bedroom
   - Click "Upload Photos"
   - **Expected**: "3 photos uploaded for BEDROOM"

   **Upload Kitchen Photos**:
   - Select "Kitchen" from dropdown
   - Choose 2 photos
   - Click "Upload Photos"
   - **Expected**: "2 photos uploaded for KITCHEN"

   **Upload Toilet Photos**:
   - Select "Toilet" from dropdown
   - Choose 1 photo
   - Click "Upload Photos"
   - **Expected**: "1 photo uploaded for TOILET"

   **Upload Compound Photos**:
   - Select "Compound" from dropdown
   - Choose 2 photos
   - Click "Upload Photos"
   - **Expected**: "2 photos uploaded for COMPOUND"

   **Verify Upload Summary**:
   - Should show: "✓ 8 photo(s) uploaded successfully"
   - Should list: "BEDROOM: 3, KITCHEN: 2, TOILET: 1, COMPOUND: 2"

   - Click "Continue to Status"

5. **Step 4: Set Occupancy**
   - Click on "VACANT" card (green)
   - Click "Complete Registration"
   - **Expected**: Success screen with 🎉

6. **Success Screen Options**:
   - Try "Add Another Unit" → Should reset to Step 2
   - Or "Go to Dashboard"

**✅ Pass**: Property created, unit added, 8+ photos uploaded with tags, status set
**❌ Fail**: Any upload fails or photos don't show tags

---

### Test 4: Tenant Discovery Feed (The Wow Moment!)

1. **Register as Tenant**
   - Open incognito window
   - Go to `/register`
   - Email: `tenant@test.com`
   - Password: `Test12345!@#$`
   - Role: **TENANT**
   - Verify email

2. **Login as Tenant**
   - Enter credentials
   - **Expected**: Welcome splash → Redirects to `/discover`

3. **View Discovery Feed**
   - **Expected to See**:
     - Large card with property photo
     - "Onesmus Hostels"
     - "Unit: On 2"
     - "📍 Meru"
     - "🏠 1 Bedroom"
     - "KES 8,000 per month"
     - "📸 8 photos"

4. **Test Filters**
   - Click "Filters" button
   
   **Test Location Filter**:
   - Type "Meru" in Location
   - **Expected**: Shows "Onesmus Hostels"
   - Type "Nairobi"
   - **Expected**: "No homes found"

   **Test Unit Type Filter**:
   - Select "One Bedroom"
   - **Expected**: Shows your unit
   - Select "Bedsitter"
   - **Expected**: "No homes found"

   **Test Max Rent Filter**:
   - Enter "10000"
   - **Expected**: Shows your unit (rent is 8000)
   - Enter "5000"
   - **Expected**: "No homes found"

5. **View Photo Gallery**
   - Scroll down in the card
   - **Expected**: See grid of 8 photos
   - Each photo should show its tag:
     - "BEDROOM" under bedroom photos
     - "KITCHEN" under kitchen photos
     - "TOILET" under toilet photo
     - "COMPOUND" under compound photos

6. **Test Navigation**
   - Click left arrow (←)
   - **Expected**: Button disabled (only one property)
   - Click right arrow (→)
   - **Expected**: Button disabled

**✅ Pass**: Property appears, all photos visible with tags, filters work
**❌ Fail**: No properties shown or photos missing

---

### Test 5: Multiple Units (Bonus Test)

1. **Login as Landlord**
   - Go to `/landlord/properties/register`

2. **Add Another Unit**
   - Click "Add Another Unit to Onesmus Hostels"
   - Or create from Step 2

3. **Create Second Unit**:
   ```
   Unit Name: A1
   Unit Type: Bedsitter
   Monthly Rent: 5000
   Deposit: 5000
   Description: Cozy bedsitter perfect for students
   ```

4. **Upload Photos for A1**:
   - Upload at least 5 photos with different tags
   - Set as VACANT

5. **Test Discovery as Tenant**:
   - **Expected**: See "1 of 2" at bottom
   - Click → arrow
   - **Expected**: Shows second unit
   - Test filters with "Bedsitter"

**✅ Pass**: Can add multiple units, discovery shows both, navigation works
**❌ Fail**: Second unit doesn't appear

---

### Test 6: Occupancy Toggle

1. **Login as Landlord**
   - Find one of your units

2. **Mark as Occupied**
   - Change status from VACANT to OCCUPIED
   - Save

3. **Test Discovery as Tenant**
   - **Expected**: Unit no longer appears in feed
   - Only VACANT units visible

4. **Mark as Vacant Again**
   - **Expected**: Unit reappears in tenant feed

**✅ Pass**: OCCUPIED units hidden, VACANT units shown
**❌ Fail**: OCCUPIED units still visible

---

## 🐛 Common Issues & Fixes

### Issue 1: Welcome Screen Doesn't Appear
**Symptom**: Login redirects directly without splash

**Fix**:
```bash
# Check if userRole cookie is set
# Browser DevTools → Application → Cookies
# Should see: userRole=LANDLORD or userRole=TENANT
```

**Solution**: Check `/api/auth/login/route.ts` - line 44-46

### Issue 2: No Properties in Discovery Feed
**Symptom**: "No homes found" message

**Check**:
1. Property status is ACTIVE (not UNDER_REVIEW)
2. Unit occupancyStatus is VACANT
3. Photos were uploaded successfully

**Fix in Prisma Studio**:
```sql
-- Update property to ACTIVE
UPDATE "PropertyListing" SET status = 'ACTIVE' WHERE id = 'your-property-id';
```

### Issue 3: Photos Don't Upload
**Symptom**: Upload fails or shows error

**Check**:
1. File size < 10MB
2. File type is JPG, PNG, or WebP
3. `uploads/` directory exists and is writable

**Fix**:
```bash
# Create uploads directory
mkdir -p services/api/uploads/units
chmod 755 services/api/uploads
```

### Issue 4: Tagged Photos Not Showing
**Symptom**: Photos appear but no tags

**Check**:
- Database has `photoTag` field populated
- Tags are valid enum values

**Fix in Prisma Studio**:
- Check `UnitPhoto` table
- Verify `photoTag` column has values like "BEDROOM", "KITCHEN"

### Issue 5: Filters Don't Work
**Symptom**: Filters have no effect

**Check**:
1. Location is exact match (case-insensitive)
2. UnitType matches enum exactly
3. MaxRent is numeric

**Debug**:
```javascript
// Browser console
console.log(filteredListings);
```

---

## 📊 Success Criteria

### ✅ Deployment Success
- [ ] API is live on Render
- [ ] Web is live on Vercel
- [ ] Database migrations ran
- [ ] No console errors

### ✅ Landlord Flow Success
- [ ] Can register with LANDLORD role
- [ ] Email verification works
- [ ] Welcome splash appears on login
- [ ] Can create landlord profile
- [ ] Can verify phone
- [ ] Can upload ownership document
- [ ] Can create property
- [ ] Can add unit with rent
- [ ] Can upload photos with tags
- [ ] Can see photo count per tag
- [ ] Can set occupancy status

### ✅ Tenant Flow Success
- [ ] Can register with TENANT role
- [ ] Email verification works
- [ ] Welcome splash appears on login
- [ ] Redirects to /discover
- [ ] Can see vacant properties
- [ ] Photos appear in gallery
- [ ] Photo tags display correctly
- [ ] Location filter works
- [ ] Unit type filter works
- [ ] Max rent filter works
- [ ] Can navigate between properties
- [ ] Pagination shows correct count

### ✅ Photo System Success
- [ ] Can upload multiple photos at once
- [ ] Each photo gets a tag
- [ ] Tags display in upload summary
- [ ] Tags visible in discovery feed
- [ ] Photos organized by tag
- [ ] 10 tag categories work

### ✅ Security Success
- [ ] Can only modify own properties
- [ ] Ownership document required
- [ ] Admin approval needed (status: UNDER_REVIEW)
- [ ] OCCUPIED units hidden from tenants
- [ ] Unauthorized access blocked

---

## 🎯 Performance Benchmarks

### Expected Load Times
- Welcome splash: < 1 second to render
- Discovery feed: < 2 seconds to load
- Photo upload: < 3 seconds per photo
- Filter application: Instant (< 100ms)

### Expected Data
- Property creation: ~500ms
- Unit creation: ~300ms
- Photo upload: ~2 seconds (with processing)
- Discovery query: < 1 second (with 100 units)

---

## 📱 Browser Compatibility

### Test On:
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

### Expected Behavior:
- All features work across browsers
- Animations smooth on all devices
- Photo upload works on mobile
- Swipe gestures work (future)

---

## 🎉 What Success Looks Like

### Perfect Test Run:
1. ✅ Welcome splash is beautiful and smooth
2. ✅ Landlord can create "Onesmus Hostels" in 5 minutes
3. ✅ Can upload 10+ photos with different tags
4. ✅ Photos organized: "BEDROOM: 3, KITCHEN: 2, TOILET: 2, COMPOUND: 3"
5. ✅ Tenant sees property immediately
6. ✅ All 10 photos visible with correct tags
7. ✅ Filters work perfectly
8. ✅ Zero console errors
9. ✅ Fast and responsive

**When this works, you have a revolutionary property discovery platform!** 🚀

---

## 📞 Need Help?

If any test fails:
1. Check console for errors (F12)
2. Check Render logs for API errors
3. Check Prisma Studio for data
4. Verify environment variables
5. Try incognito mode (clear cookies)

**Common Fix**: Clear browser cache and cookies, then test again.

---

**Ready to test? Follow the steps above and check off each one!** ✅
