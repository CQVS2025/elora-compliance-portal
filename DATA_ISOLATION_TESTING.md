# Data Isolation Testing Guide - Multi-Tenant Deployment

## Context
The ELORA Fleet Compliance Portal is launching as a white-label, multi-tenant system with **Heidelberg Materials** as the first client. The user `jonny@elora.com.au` represents the Heidelberg user experience.

## Critical Requirement
**jonny@elora.com.au MUST NEVER see data from other clients under ANY circumstance.**

## Data Isolation Implementation

### Current Architecture
The system uses email domain-based data isolation:

1. **Client Identification**: Users are identified by their email domain
   - Example: `jonny@elora.com.au` → domain is `elora.com.au`
   - Example: Future client `user@heidelberg.com` → domain is `heidelberg.com`

2. **Client Branding**: Each client domain is mapped to a `Client_Branding` entity
   - Located in: `src/components/dashboard/BrandedHeader.jsx:18-20`
   - Filters by: `client_email_domain`

3. **Data Filtering**: All data queries should filter by user's client/domain
   - User profile fetched via: `base44.auth.me()`
   - Email domain extracted: `user.email.split('@')[1]`

## Test Plan for Data Isolation

### Test Case 1: Direct Database Access
**Objective**: Verify jonny@elora.com.au cannot see other clients' data through normal queries

**Steps**:
1. Create test data for two different clients:
   - Client A: `jonny@elora.com.au` (Heidelberg)
   - Client B: `testuser@otherclient.com` (Another client)
2. Create vehicles, sites, scans for each client with distinct client_id/email_domain
3. Log in as `jonny@elora.com.au`
4. Navigate to all pages: Dashboard, Sites, Vehicles, Reports, Analytics
5. Verify ONLY Heidelberg data is visible

**Expected Result**: Zero records from Client B should appear

---

### Test Case 2: URL Manipulation
**Objective**: Ensure direct URL access cannot bypass data filters

**Steps**:
1. As jonny@elora.com.au, note the ID of a Heidelberg vehicle (e.g., `vehicle_123`)
2. Create a vehicle for Client B (e.g., `vehicle_456`)
3. While logged in as jonny@elora.com.au, attempt to access Client B's vehicle:
   - Try URL patterns like `/vehicles/vehicle_456`
   - Try API calls directly in browser console
   - Try modifying filter parameters in URL

**Expected Result**:
- 404 Not Found or Access Denied
- No data leakage
- Error logged (but user data remains hidden)

---

### Test Case 3: API Call Bypassing
**Objective**: Verify API layer enforces data isolation

**Steps**:
1. Open browser DevTools Network tab
2. Log in as jonny@elora.com.au
3. Load Dashboard page
4. Inspect API calls in Network tab
5. Copy a data fetch API call (e.g., `base44.entities.Vehicle.list()`)
6. In Console, try to modify the call to remove filters:
   ```javascript
   // Normal call
   await base44.entities.Vehicle.filter({ client_email: 'jonny@elora.com.au' })

   // Attempted bypass
   await base44.entities.Vehicle.list() // Should still filter by logged-in user
   ```

**Expected Result**: API automatically enforces user context even if filters are omitted

---

### Test Case 4: Simultaneous Multi-Client Testing
**Objective**: Test concurrent access from multiple clients

**Steps**:
1. Open Browser 1 (Chrome): Log in as `jonny@elora.com.au`
2. Open Browser 2 (Firefox): Log in as `testuser@otherclient.com`
3. Perform identical actions in both browsers:
   - Create a vehicle with same name
   - Create a site with same name
   - View dashboard
4. Verify each user only sees their own data

**Expected Result**: Complete isolation between sessions

---

### Test Case 5: Search and Filter Bypass
**Objective**: Ensure search/filter functions don't leak data

**Steps**:
1. Log in as jonny@elora.com.au
2. Create unique test vehicle for Client B: "TESTCLIENTB_VEHICLE"
3. As jonny@elora.com.au, use search features:
   - Search for "TESTCLIENTB_VEHICLE" in vehicle search
   - Use advanced filters to try to access all data
   - Try SQL-injection patterns (if applicable)

**Expected Result**: Zero results, no data leakage

---

### Test Case 6: Notification Cross-Contamination
**Objective**: Verify notifications are client-scoped

**Steps**:
1. Create notification for Client B user
2. Log in as jonny@elora.com.au
3. Check notification center
4. Verify notification from Client B does NOT appear

**Expected Result**: Only Heidelberg notifications visible

**Implementation Note**: Notifications already filter by `user_email` (see `src/components/notifications/NotificationCenter.jsx:50-54`)

---

### Test Case 7: Role-Based Access Escalation
**Objective**: Ensure user roles don't grant cross-client access

**Steps**:
1. Create admin user for Client B: `admin@otherclient.com`
2. Log in as `jonny@elora.com.au` (non-admin)
3. Attempt to access admin features
4. Verify even if role is escalated, data is still client-scoped

**Expected Result**: Role permissions apply within client scope only

---

## Automated Testing Recommendations

### Unit Tests Needed
```javascript
describe('Data Isolation', () => {
  it('should filter vehicles by client domain', async () => {
    const heidelbergUser = { email: 'jonny@elora.com.au' };
    const otherUser = { email: 'test@other.com' };

    // Create vehicles for both
    await createVehicle({ client_email: heidelbergUser.email });
    await createVehicle({ client_email: otherUser.email });

    // Fetch as Heidelberg user
    const vehicles = await getVehiclesForUser(heidelbergUser);

    expect(vehicles).toHaveLength(1);
    expect(vehicles[0].client_email).toBe('jonny@elora.com.au');
  });
});
```

### Integration Tests Needed
- Test all entity types: Vehicle, Site, Customer, Scan, Refill, Maintenance, Notification
- Test all query types: list(), filter(), get(), search()
- Test all user roles: admin, manager, viewer, driver

---

## Security Checklist Before Launch

- [ ] All database entities have `client_id` or `client_email_domain` field
- [ ] All queries automatically inject client filter (server-side)
- [ ] No raw SQL queries that bypass ORM filters
- [ ] API layer validates user context on every request
- [ ] Frontend filters are for UX only, not security
- [ ] Audit logging tracks cross-client access attempts
- [ ] Regular security scans for data leakage vulnerabilities
- [ ] Penetration testing by external firm
- [ ] GDPR compliance review (if applicable)
- [ ] Incident response plan for data breach

---

## Database Schema Requirements

All tables should include client scoping:

```sql
-- Example Vehicle table
CREATE TABLE vehicles (
  id TEXT PRIMARY KEY,
  name TEXT,
  rfid TEXT,
  client_email_domain TEXT NOT NULL,  -- or client_id
  -- ... other fields
);

-- Index for performance
CREATE INDEX idx_vehicles_client ON vehicles(client_email_domain);
```

---

## Monitoring and Alerts

### Production Monitoring
1. **Alert**: User accessing data from different client domain
   - Log: User ID, attempted access, timestamp
   - Action: Block access, notify security team

2. **Alert**: Unusual data volume in queries
   - Example: User queries 10,000+ records (possible data scraping)
   - Action: Rate limit, investigate

3. **Metrics to Track**:
   - Number of cross-client access attempts
   - Average query filter effectiveness
   - Client data size growth rate

---

## Incident Response

If data leakage is discovered:

1. **Immediate**: Disable affected accounts
2. **Within 1 hour**: Identify scope of breach
3. **Within 4 hours**: Patch vulnerability
4. **Within 24 hours**: Notify affected clients
5. **Within 72 hours**: Full incident report
6. **Within 1 week**: External security audit

---

## Developer Guidelines

### When Adding New Features
1. Always filter by client context in queries
2. Never trust client-side filters for security
3. Test with multi-client datasets
4. Code review must verify data isolation
5. Add integration tests for new entities

### Code Review Checklist
- [ ] Does this query filter by client?
- [ ] Can URL manipulation bypass filters?
- [ ] Are API endpoints properly scoped?
- [ ] Is error handling secure (no data leaks)?
- [ ] Have integration tests been added?

---

## Current Implementation Status

### ✅ Implemented
- Client branding by email domain
- User authentication (base44.auth.me())
- Notification filtering by user_email

### ⚠️ Needs Verification
- All vehicle queries filter by client
- All site queries filter by client
- All scan/refill/maintenance queries filter by client
- Dashboard aggregations are client-scoped
- Reports only show client data

### ❌ Action Required
- Add server-side enforcement in Base44 backend
- Add audit logging for all data access
- Create automated integration tests
- Perform penetration testing
- Document data retention policies per client

---

## Contact for Security Issues

- **Email**: security@cqvs.com.au
- **On-Call**: [Emergency Contact]
- **Severity P0**: Immediate cross-client data leak
- **Severity P1**: Potential vulnerability discovered
- **Severity P2**: Security enhancement request
