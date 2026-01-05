# Client Onboarding Checklist

## Client Information

- **Client Name:** ___________________________
- **Email Domain:** ___________________________
- **Primary Contact:** ___________________________
- **Contact Email:** ___________________________
- **Contact Phone:** ___________________________
- **Go-Live Date:** ___________________________
- **Onboarding Lead:** ___________________________

---

## Pre-Onboarding Preparation

### 1. Gather Client Information

- [ ] Obtain client legal name (as it should appear in system)
- [ ] Confirm email domain (e.g., `client.com`)
- [ ] Get list of all user emails who need access
- [ ] Determine user role types for each user
- [ ] Collect site information (addresses, contact details)
- [ ] Obtain vehicle list with RFID tags
- [ ] Request branding assets (logo, brand colors)
- [ ] Clarify feature access requirements (which tabs to show/hide)
- [ ] Confirm compliance targets (weekly wash requirements)
- [ ] Understand historical data import needs (if any)

### 2. Technical Preparation

- [ ] Set up development/staging environment for testing
- [ ] Prepare database backup before making changes
- [ ] Review current multi-tenant configuration
- [ ] Test with Heidelberg user (`jonny@elora.com.au`) as reference
- [ ] Prepare rollback plan in case of issues

---

## Phase 1: System Configuration

### Step 1: Database Setup

- [ ] Create Customer record in database
  - Customer name: ___________________________
  - Email domain: ___________________________
  - Status: `active`
  - Created by: ___________________________
  - Date: ___________________________

- [ ] Verify customer record created successfully
  - Customer ID/Ref: ___________________________

### Step 2: Branding Configuration

- [ ] Upload client logo to storage
  - Logo URL: ___________________________
  - Dimensions: _________ x _________
  - Format: PNG / SVG / JPG

- [ ] Create `Client_Branding` record
  - `client_email_domain`: ___________________________
  - `logo_url`: ___________________________
  - `primary_color`: ___________________________ (Hex code)
  - `secondary_color`: ___________________________ (Hex code)
  - `company_name`: ___________________________

- [ ] Test branding on staging environment
  - Logo displays correctly: ☐
  - Colors apply correctly: ☐
  - Company name shows: ☐

### Step 3: Site Import

For each site:

**Site 1:**
- [ ] Site name: ___________________________
- [ ] Address: ___________________________
- [ ] City/State/Postal: ___________________________
- [ ] Contact name: ___________________________
- [ ] Contact phone: ___________________________
- [ ] Contact email: ___________________________
- [ ] Status: active / inactive / maintenance
- [ ] Site created in database: ☐
- [ ] Site ID/Ref: ___________________________

**Site 2:**
- [ ] Site name: ___________________________
- [ ] Address: ___________________________
- [ ] City/State/Postal: ___________________________
- [ ] Contact name: ___________________________
- [ ] Contact phone: ___________________________
- [ ] Contact email: ___________________________
- [ ] Status: active / inactive / maintenance
- [ ] Site created in database: ☐
- [ ] Site ID/Ref: ___________________________

**Site 3:**
- [ ] _(Copy above for additional sites)_

### Step 4: Vehicle Import

- [ ] Prepare vehicle import spreadsheet
  - Columns: Vehicle Name, RFID Tag, Site Assignment, Target Washes
  - Total vehicles: ___________________________

- [ ] Import vehicles to database
  - Import method: Manual / Script / Bulk Upload
  - Total imported: ___________________________
  - Failed imports: ___________________________

- [ ] Verify vehicle data
  - All vehicles have valid RFID tags: ☐
  - All vehicles assigned to sites: ☐
  - All vehicles have compliance targets: ☐
  - All vehicles linked to correct customer: ☐

### Step 5: User Access Configuration

**Select Configuration Pattern:**

- [ ] Pattern A: Restricted User (Heidelberg style - see only own data)
- [ ] Pattern B: Domain-Wide Access (see all data)
- [ ] Pattern C: Partial Access (see multiple customers)
- [ ] Custom Pattern: ___________________________

**For Each User:**

**User 1:**
- [ ] Email: ___________________________
- [ ] Role: Restricted Client / Client Admin / Site Manager / Driver / Super Admin
- [ ] Restricted Customer: ___________________________ (or "N/A")
- [ ] Lock Customer Filter: Yes / No
- [ ] Show All Data: Yes / No
- [ ] Visible Tabs: ___________________________
- [ ] Hidden Tabs: ___________________________
- [ ] Configuration added to `USER_SPECIFIC_CONFIG`: ☐

**User 2:**
- [ ] Email: ___________________________
- [ ] Role: ___________________________
- [ ] Restricted Customer: ___________________________
- [ ] Lock Customer Filter: Yes / No
- [ ] Show All Data: Yes / No
- [ ] Visible Tabs: ___________________________
- [ ] Hidden Tabs: ___________________________
- [ ] Configuration added to `USER_SPECIFIC_CONFIG`: ☐

**User 3:**
- [ ] _(Copy above for additional users)_

### Step 6: Create User Accounts

- [ ] Generate secure passwords for all users
  - Password pattern: ___________________________
  - Stored securely: ☐

For each user:
- [ ] Create user account in Base44
  - Email: ___________________________
  - Password: (stored securely)
  - Role: ___________________________
  - Account created: ☐

---

## Phase 2: Data Import & Validation

### Step 1: Historical Data Import (Optional)

- [ ] Determine historical data scope
  - Start date: ___________________________
  - End date: ___________________________
  - Data types: Scans / Maintenance / Refills / Other

- [ ] Import historical wash scans
  - Total scans: ___________________________
  - Date range: ___________________________
  - Import successful: ☐

- [ ] Import historical maintenance records
  - Total records: ___________________________
  - Date range: ___________________________
  - Import successful: ☐

- [ ] Import historical refill data
  - Total refills: ___________________________
  - Date range: ___________________________
  - Import successful: ☐

### Step 2: Data Validation

- [ ] Verify all customer data is isolated
  - Test query: `SELECT * FROM vehicles WHERE customer_ref = 'CLIENT_REF'`
  - Expected count: ___________________________
  - Actual count: ___________________________
  - Match: ☐

- [ ] Verify all sites link to correct customer
  - Query results: ___________________________
  - All sites correct: ☐

- [ ] Verify all vehicles link to correct customer
  - Query results: ___________________________
  - All vehicles correct: ☐

- [ ] Check for duplicate RFID tags
  - Duplicates found: ___________________________
  - Duplicates resolved: ☐

---

## Phase 3: Testing

### Step 1: Login & Authentication Test

- [ ] Test login for User 1
  - Email: ___________________________
  - Login successful: ☐
  - Redirected to dashboard: ☐

- [ ] Test login for User 2
  - Email: ___________________________
  - Login successful: ☐
  - Redirected to dashboard: ☐

### Step 2: Branding Test

- [ ] Verify client branding appears
  - Logo displays on header: ☐
  - Primary color applies: ☐
  - Secondary color applies: ☐
  - Company name shows: ☐
  - Mobile view correct: ☐

### Step 3: Data Isolation Test

- [ ] User sees ONLY their customer's data
  - Dashboard shows correct customer: ☐
  - Vehicle count matches expected: ___________________________
  - Site count matches expected: ___________________________
  - No other customer data visible: ☐

- [ ] Test URL manipulation
  - Try accessing other customer vehicle URL: ☐
  - Result: 404 / Access Denied / Other: ___________________________
  - Data protected: ☐

- [ ] Test customer filter
  - Filter is locked (if configured): ☐
  - Lock icon visible: ☐
  - Tooltip shows on hover: ☐
  - Cannot change customer: ☐

### Step 4: Banner & Visual Indicators Test

- [ ] Restricted user banner displays (if applicable)
  - Banner shows: "Viewing [CUSTOMER NAME] Only": ☐
  - Banner color: Amber/Yellow: ☐
  - Warning icon visible: ☐

- [ ] Customer filter lock indicator
  - Lock icon appears on filter: ☐
  - Tooltip text: "Customer filter is locked for your account": ☐

### Step 5: Tab Access Test

- [ ] Verify correct tabs are visible
  - Expected tabs: ___________________________
  - Actual tabs: ___________________________
  - Match: ☐

- [ ] Verify hidden tabs are not accessible
  - Expected hidden: ___________________________
  - Try direct URL access to hidden tab: ☐
  - Result: Redirected / 403 / Hidden: ___________________________

### Step 6: Feature Access Test

- [ ] Test Compliance tab
  - Vehicle table loads: ☐
  - Data is correct: ☐
  - Wash history visible: ☐
  - Maintenance records visible: ☐

- [ ] Test Maintenance tab (if visible)
  - Maintenance records load: ☐
  - Can add new maintenance: ☐ (if permitted)
  - Data is correct: ☐

- [ ] Test Reports tab (if visible)
  - Reports generate: ☐
  - Export works: ☐ (if permitted)
  - Data is correct: ☐

- [ ] Test Users tab (if visible)
  - User list loads: ☐
  - Can only see own customer's users: ☐
  - Edit permissions work: ☐ (if permitted)

### Step 7: Empty State Test (For New Clients)

- [ ] Verify empty state shows when no vehicles
  - Welcome message displays: ☐
  - Quick start guide shows: ☐
  - Icons and formatting correct: ☐

- [ ] Verify empty state shows when no sites
  - Welcome message displays: ☐
  - Site setup guide shows: ☐
  - "Add First Site" button works: ☐

### Step 8: Mobile Responsiveness Test

- [ ] Test on mobile device
  - Dashboard loads: ☐
  - Branding visible: ☐
  - Tables are responsive: ☐
  - Filters work: ☐

### Step 9: Performance Test

- [ ] Dashboard loads within acceptable time
  - Load time: ___________ seconds
  - Acceptable: < 3 seconds: ☐

- [ ] Vehicle table pagination works
  - Pagination controls visible: ☐
  - Navigation between pages works: ☐

- [ ] Filters apply without lag
  - Filter response time: ___________ seconds
  - Acceptable: < 1 second: ☐

---

## Phase 4: User Training & Documentation

### Step 1: Prepare Training Materials

- [ ] Create client-specific user guide
  - Include screenshots with their branding: ☐
  - Document their specific tab access: ☐
  - Add contact information for support: ☐

- [ ] Prepare training video (optional)
  - Record walkthrough: ☐
  - Upload to shared location: ☐
  - Share link with client: ☐

### Step 2: Conduct Training Session

- [ ] Schedule training session
  - Date: ___________________________
  - Time: ___________________________
  - Attendees: ___________________________

- [ ] Cover key topics:
  - [ ] Login process
  - [ ] Dashboard overview
  - [ ] Vehicle compliance tracking
  - [ ] Viewing wash history
  - [ ] Running reports
  - [ ] Adding maintenance records (if permitted)
  - [ ] Managing sites (if permitted)
  - [ ] Managing users (if permitted)

- [ ] Q&A session
  - Questions documented: ☐
  - Answers provided: ☐

### Step 3: Provide Credentials

- [ ] Send credentials to each user
  - Method: Secure email / Password manager / Other: ___________________________
  - All users received credentials: ☐

- [ ] Instruct users to change password on first login
  - Password change enforced: ☐

---

## Phase 5: Go-Live

### Step 1: Pre-Launch Checklist

- [ ] All configuration complete: ☐
- [ ] All testing passed: ☐
- [ ] Client approved setup: ☐
- [ ] Training completed: ☐
- [ ] Support team briefed: ☐
- [ ] Monitoring set up: ☐

### Step 2: Launch

- [ ] Deploy to production
  - Deployment time: ___________________________
  - Deployment successful: ☐

- [ ] Verify production configuration
  - Branding correct: ☐
  - Data isolation working: ☐
  - All users can log in: ☐

### Step 3: Post-Launch Monitoring

- [ ] Monitor for 24 hours after launch
  - Login errors: ___________________________
  - Data issues: ___________________________
  - Performance issues: ___________________________

- [ ] Check with client after 24 hours
  - Client feedback: ___________________________
  - Issues reported: ___________________________
  - Issues resolved: ☐

- [ ] Check again after 1 week
  - Client satisfaction: ___________________________
  - Feature requests: ___________________________
  - Issues reported: ___________________________

---

## Phase 6: Post-Launch Support

### Step 1: Support Handoff

- [ ] Brief support team on client setup
  - Configuration details shared: ☐
  - Known issues documented: ☐
  - Support contacts established: ☐

### Step 2: Ongoing Monitoring

- [ ] Set up alerts for data isolation violations
  - Alert configured: ☐
  - Alert recipient: ___________________________

- [ ] Schedule regular check-ins
  - Frequency: Weekly / Monthly / Quarterly
  - Next check-in: ___________________________

### Step 3: Future Enhancements

- [ ] Document feature requests
  - Request 1: ___________________________
  - Request 2: ___________________________
  - Request 3: ___________________________

- [ ] Plan for adding more users
  - Expected growth: ___________________________
  - Next user addition: ___________________________

---

## Troubleshooting & Issue Log

### Issues Encountered During Onboarding

**Issue 1:**
- Description: ___________________________
- Resolution: ___________________________
- Date resolved: ___________________________

**Issue 2:**
- Description: ___________________________
- Resolution: ___________________________
- Date resolved: ___________________________

**Issue 3:**
- Description: ___________________________
- Resolution: ___________________________
- Date resolved: ___________________________

---

## Sign-Off

### Technical Team

- [ ] Configuration complete and tested
  - Name: ___________________________
  - Signature: ___________________________
  - Date: ___________________________

### Client

- [ ] Reviewed and approved setup
  - Name: ___________________________
  - Title: ___________________________
  - Signature: ___________________________
  - Date: ___________________________

### Project Manager

- [ ] Onboarding complete
  - Name: ___________________________
  - Signature: ___________________________
  - Date: ___________________________

---

## Reference

- **Setup Guide:** `MULTI_TENANT_SETUP_GUIDE.md`
- **Testing Guide:** `DATA_ISOLATION_TESTING.md`
- **Heidelberg Reference User:** `jonny@elora.com.au`
- **Support Email:** tech@cqvs.com.au

---

**Onboarding Date:** ___________________________
**Go-Live Date:** ___________________________
**Onboarding Lead:** ___________________________
**Client Name:** ___________________________
**Status:** Not Started / In Progress / Complete
