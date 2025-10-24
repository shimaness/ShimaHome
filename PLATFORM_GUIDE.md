# ShimaHome Platform Guide

## 🌟 Platform Vision

ShimaHome is a revolutionary property discovery platform that connects verified landlords with tenants through an innovative, secure, and visual experience. We've built a futuristic system that emphasizes security, transparency, and user delight.

---

## 🎬 Welcome Experience

### Animated Splash Screen
When users log in, they're greeted with a stunning animated welcome screen:
- **Gradient Background**: Smooth indigo → purple → pink transition
- **Animated Logo**: Floating house icon with pulse effect
- **Feature Cards**: 3 animated cards highlighting platform benefits
  - 🔒 Secure & Verified
  - 🏠 Quality Homes
  - ⚡ Instant Matching
- **Smart Routing**: Automatically redirects based on user role
  - Landlords → Dashboard
  - Tenants → Discovery Feed
- **Duration**: 3-second immersive experience

---

## 🏢 Landlord Journey: Property Registration

### Phase 1: Security & Verification
Before listing properties, landlords must complete a rigorous verification process:

1. **Profile Creation**
   - Full name
   - ID number
   - Phone number
   - Residence area

2. **Phone/Email Verification**
   - 6-digit OTP codes
   - 10-minute expiry
   - Prevents fake accounts

3. **Ownership Document Upload**
   - Title deeds
   - Sale agreements
   - Lease agreements
   - **Purpose**: Prevents property fraud

### Phase 2: Property Registration (The Innovation!)

#### Step 1: Create Property
Landlords create the main property listing:
```
Property Name: "Onesmus Hostels"
Location: "Meru"
Address: "Meru Town, Near Meru University"
Description: "Modern hostels with 24/7 security"
```

**Key Innovation**: Properties are containers for multiple units (rooms/houses)

#### Step 2: Add Units to Property
For each room/house in the property:
```
Unit Name: "On 2"
Unit Type: ONE_BEDROOM (dropdown)
Monthly Rent: KES 8,000
Deposit: KES 8,000
Description: "Spacious 1BR with balcony"
```

**Unit Types Available**:
- Single Room
- Bedsitter
- One Bedroom
- Two Bedroom
- Three Bedroom
- Studio
- Other

#### Step 3: Visual Documentation (Revolutionary!)
Upload photos **with intelligent tagging**:

**Photo Categories**:
- 🛏️ **Bedroom** - Main sleeping area
- 🛋️ **Living Room** - Seating area
- 🍳 **Kitchen** - Cooking space
- 🚽 **Toilet** - WC
- 🚿 **Bathroom** - Shower/bathtub
- 🌿 **Balcony** - Outdoor space
- 🏡 **Compound** - Shared outdoor area
- 🏠 **Exterior** - Building outside view
- 🚗 **Parking** - Parking area
- 📷 **Other** - Miscellaneous

**Why This Matters**:
- Tenants see **exactly** what they're getting
- Photos are organized by room type
- No misleading images
- Complete transparency

**Upload Process**:
1. Select photo category (e.g., "Bedroom")
2. Choose multiple photos at once
3. Upload (processed, compressed, EXIF stripped)
4. Repeat for each room type
5. See real-time upload count per category

#### Step 4: Set Occupancy Status
Mark the unit as:
- 🏠 **VACANT** - Available for rent (appears on discovery feed)
- 🔒 **OCCUPIED** - Currently rented (hidden from search)
- 🔧 **MAINTENANCE** - Under repair (hidden from search)

**Smart Visibility**:
- Only VACANT units appear to tenants
- Landlords can toggle status anytime
- Prevents wasted inquiries

### Phase 3: Admin Approval
Properties enter "UNDER_REVIEW" status:
- Admin verifies ownership documents
- Checks property legitimacy
- Approves to "ACTIVE" status
- **Anti-Fraud**: Prevents scammers

---

## 🔍 Tenant Journey: Home Discovery

### Discovery Feed (Tinder-Style!)

#### Visual-First Experience
Tenants see homes as **beautiful cards** with:
- **Cover Image**: Best exterior/compound photo
- **Property Name**: e.g., "Onesmus Hostels"
- **Unit Name**: e.g., "On 2"
- **Location Badge**: Meru 📍
- **Unit Type Badge**: 1 Bedroom 🏠
- **Price**: KES 8,000/month 💰
- **Photo Count**: 📸 12 photos

#### Navigation
- **← →** Arrow buttons to swipe between listings
- **Keyboard**: Arrow keys work too
- **Pagination**: "3 of 47" homes

#### Smart Filtering
Click "Filters" button to show:

1. **Location Filter**
   - Type: "Mombasa"
   - Matches: Case-insensitive, partial
   - Example: "momb" finds "Mombasa"

2. **Unit Type Filter**
   - Dropdown: Single Room, Bedsitter, 1BR, 2BR, etc.
   - Only shows selected type

3. **Max Rent Filter**
   - Input: KES amount
   - Shows units ≤ this amount
   - Example: 10000 shows all units under 10k

**Filter Logic**:
- All filters work together (AND logic)
- Results update instantly
- "No homes found" if too restrictive
- Clear filters button to reset

#### Photo Gallery
See all unit photos grouped by category:
- Grid layout (4 columns)
- Each photo shows its tag (e.g., "BEDROOM")
- Click to view full size (future enhancement)

#### Action Buttons
- **Contact Landlord** - Opens chat/phone
- **Save for Later** - Bookmark for future

---

## 🔐 Security Architecture

### Landlord Security
1. **Multi-Step Verification**
   - Email verification
   - Phone OTP
   - ID number validation
   - Ownership document upload

2. **Document Review**
   - Admin manually approves properties
   - Prevents fake listings
   - Verifies ownership authenticity

3. **Property Ownership Checks**
   - Can only modify own properties
   - Database-level user ID validation
   - Unauthorized access rejected

### Tenant Protection
1. **Verified Listings Only**
   - Only approved properties visible
   - Ownership verified by admin
   - No scam properties

2. **Complete Transparency**
   - See all room photos before visiting
   - Tagged photos = no surprises
   - Honest representation

3. **Secure Account System**
   - All existing security features apply:
     - Password reset
     - MFA/TOTP
     - Session management
     - Login history

---

## 🎨 Design Philosophy

### User Experience Principles

1. **Progressive Disclosure**
   - Welcome → Onboard → Discover
   - Step-by-step property registration
   - Never overwhelm users

2. **Visual Storytelling**
   - Photos tell the story
   - Tagged categories = organized viewing
   - Swipeable cards = engaging

3. **Instant Feedback**
   - Progress indicators
   - Success messages
   - Upload counts
   - Real-time validation

4. **Mobile-First**
   - Responsive design
   - Touch-friendly buttons
   - Swipe gestures ready

### Color System
- **Primary**: Indigo (#4F46E5) - Trust, professionalism
- **Secondary**: Purple (#9333EA) - Premium, quality
- **Accent**: Pink (#EC4899) - Energy, excitement
- **Success**: Green (#10B981) - Positive actions
- **Warning**: Orange (#F59E0B) - Attention needed
- **Error**: Red (#EF4444) - Critical issues

---

## 📊 Database Architecture

### Property Hierarchy
```
LandlordProfile
  └─ PropertyListing (e.g., "Onesmus Hostels")
      └─ PropertyUnit (e.g., "On 2" - 1BR)
          └─ UnitPhoto (tagged: BEDROOM, KITCHEN, etc.)
```

### Key Relationships
1. **One Landlord** → Many Properties
2. **One Property** → Many Units
3. **One Unit** → Many Photos (tagged)

### Smart Indexing
- `location + status` → Fast location searches
- `unitType + occupancyStatus` → Fast type filters
- `unitId + photoTag` → Quick photo lookups

---

## 🚀 API Endpoints

### Landlord Endpoints
```
POST /landlord/properties
  - Create new property listing

POST /landlord/properties/:propertyId/units
  - Add unit to property

POST /landlord/units/:unitId/photos
  - Upload tagged photo (FormData: file, photoTag)

PATCH /landlord/units/:unitId/occupancy
  - Update occupancy status
```

### Discovery Endpoints
```
GET /discover
  ?location=Meru
  &unitType=ONE_BEDROOM
  &maxRent=10000
  - Get filtered vacant units
```

---

## 🎯 Future Enhancements

### Phase 1: Communications
- [ ] In-app messaging (landlord ↔ tenant)
- [ ] Video calls for virtual tours
- [ ] Push notifications

### Phase 2: Bookings
- [ ] Reserve unit (holding fee)
- [ ] Payment integration (M-Pesa, card)
- [ ] Digital lease agreements

### Phase 3: AI Features
- [ ] Image recognition (verify room types)
- [ ] Price recommendations (ML model)
- [ ] Smart matching (preferences learning)

### Phase 4: Social Features
- [ ] Reviews & ratings
- [ ] Landlord reputation score
- [ ] Tenant verification badges

### Phase 5: Advanced
- [ ] 3D virtual tours
- [ ] AR furniture placement
- [ ] Neighborhood insights (schools, transport)
- [ ] Utility cost estimates

---

## 📱 User Flows

### Landlord Flow
```
1. Register account → Email verification
2. Create landlord profile → Phone OTP
3. Upload ownership document → Admin approval
4. Create property ("Onesmus Hostels")
5. Add unit ("On 2" - 1BR - KES 8000)
6. Upload photos (Bedroom, Kitchen, Toilet, Compound)
7. Set status (VACANT)
8. ✅ Unit appears on discovery feed
```

### Tenant Flow
```
1. Register account → Email verification
2. Login → Welcome splash (3 seconds)
3. Discovery feed → See vacant units
4. Apply filters (Location: Meru, Type: 1BR, Max: 10000)
5. Swipe through results
6. View photos (organized by room)
7. Contact landlord
8. Schedule viewing
9. Sign lease (future)
```

---

## 🛠️ Tech Stack

### Frontend (Next.js)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI**: Custom animated components
- **Forms**: Native HTML + React state
- **Images**: Next/Image optimization

### Backend (NestJS)
- **Framework**: NestJS 10
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: JWT + MFA
- **File Upload**: Multer + Sharp
- **Security**: bcrypt, crypto

### Infrastructure
- **API**: Render (Node.js)
- **Web**: Vercel (Edge)
- **Database**: Neon (Serverless Postgres)
- **Storage**: Local filesystem (uploads/)
- **Email**: Nodemailer (SMTP)

---

## 🔢 Key Metrics to Track

### Platform Health
- [ ] Total properties listed
- [ ] Total units available
- [ ] Average photos per unit
- [ ] Occupancy rate (VACANT vs OCCUPIED)

### User Engagement
- [ ] Daily active users
- [ ] Discovery feed views
- [ ] Filter usage rate
- [ ] Average session duration

### Conversion
- [ ] Landlord verification completion rate
- [ ] Property listing completion rate
- [ ] Tenant contact rate
- [ ] Booking conversion (future)

---

## 💡 Innovation Highlights

### What Makes ShimaHome Different?

1. **Tagged Photo System** ⭐⭐⭐
   - Industry-first categorized photo upload
   - Tenants see organized room views
   - No misleading listings

2. **Property → Unit Hierarchy** ⭐⭐⭐
   - Reflects real-world structure
   - One property, many units
   - Scalable for large complexes

3. **Real-Time Occupancy** ⭐⭐
   - Always up-to-date availability
   - No wasted inquiries
   - Toggle-based simplicity

4. **Security-First Landlord Verification** ⭐⭐⭐
   - Multi-step authentication
   - Document verification
   - Admin approval workflow
   - Prevents property fraud

5. **Visual Discovery Experience** ⭐⭐
   - Tinder-style swipeable cards
   - Beautiful, engaging UI
   - Photo-first presentation
   - Smart filtering

6. **Welcome Experience** ⭐
   - Animated splash screen
   - Role-based routing
   - Brand immersion

---

## 🎓 For Developers

### Running Locally

```bash
# Terminal 1: API
cd services/api
npm run start:dev

# Terminal 2: Web
cd apps/web
npm run dev
```

### Database Migrations
```bash
cd services/api
npx prisma db push
npx prisma studio # View data
```

### Testing Property Flow
1. Register as landlord
2. Verify phone (check console for code)
3. Upload dummy ownership doc
4. Create property
5. Add unit
6. Upload 5+ photos with different tags
7. Set to VACANT
8. Login as tenant
9. Visit /discover
10. See your unit! 🎉

---

## 📞 Support

- **Documentation**: This file + DEPLOYMENT.md + SECURITY.md
- **Issues**: GitHub Issues
- **Email**: dev@shimahome.com

---

**Built with ❤️ for the future of property discovery**

*ShimaHome - Where Security Meets Innovation*
