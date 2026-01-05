# Multi-Tenant White-Label Setup Guide

## Overview

The ELORA Fleet Compliance Portal is a multi-tenant, white-label system designed to serve multiple clients with complete data isolation and customized branding. This guide explains how to configure and onboard new clients.

## Table of Contents

1. [User Configuration System](#user-configuration-system)
2. [Heidelberg Materials Reference Setup](#heidelberg-materials-reference-setup)
3. [Adding a New Client](#adding-a-new-client)
4. [User Role Types](#user-role-types)
5. [Admin Configuration Panel](#admin-configuration-panel)
6. [Troubleshooting](#troubleshooting)

---

## User Configuration System

### Configuration Hierarchy

The system uses a two-tier configuration system:

1. **User-Specific Config** (highest priority) - For individual user restrictions
2. **Domain-Based Config** - For domain-level defaults

Configuration is managed in `/src/components/auth/PermissionGuard.jsx`

### User-Specific Configuration

```javascript
const USER_SPECIFIC_CONFIG = {
  'user@example.com': {
    restrictedCustomer: 'CUSTOMER NAME',  // Customer name to match (case-insensitive)
    lockCustomerFilter: true,              // Prevent changing customer filter
    showAllData: false,                    // Only show data for restricted customer
    defaultSite: 'all',                    // Default site selection
    hiddenTabs: [],                        // Tabs to hide (e.g., ['costs', 'refills'])
    visibleTabs: ['compliance', ...]       // Tabs to show (overrides hiddenTabs)
  }
};
```

### Domain-Based Configuration

```javascript
const DOMAIN_CONFIG = {
  'clientdomain.com': {
    showAllData: true,                     // Show all data for this domain
    defaultCustomer: 'all',                // Default customer selection
    defaultSite: 'all',                    // Default site selection
    hiddenTabs: [],                        // Tabs to hide
    visibleTabs: ['compliance', ...]       // Tabs to show
  }
};
```

---

## Heidelberg Materials Reference Setup

**User:** `jonny@elora.com.au`
**Represents:** Heidelberg Materials client experience

### Current Configuration

```javascript
'jonny@elora.com.au': {
  restrictedCustomer: 'HEIDELBERG MATERIALS',
  lockCustomerFilter: true,
  showAllData: false,
  defaultSite: 'all',
  hiddenTabs: ['costs', 'refills', 'devices', 'sites'],
  visibleTabs: ['compliance', 'maintenance', 'reports', 'users']
}
```

### What This Means

- ✅ Can ONLY see Heidelberg Materials data
- ✅ Cannot switch to other customers (filter is locked)
- ✅ Can access: Compliance, Maintenance, Reports, Users tabs
- ❌ Cannot access: Costs, Refills, Devices, Sites tabs
- ✅ Sees banner: "Restricted Access - Viewing HEIDELBERG MATERIALS Only"
- ✅ Lock icon on customer filter with tooltip

---

## Adding a New Client

### Step 1: Prepare Client Data

Before adding configuration, ensure you have:

- [ ] Client name (as it appears in database)
- [ ] Client email domain (e.g., `newclient.com`)
- [ ] List of client user emails
- [ ] List of sites for this client
- [ ] List of vehicles with RFID tags
- [ ] Client branding assets (logo, colors)
- [ ] Tab access requirements

### Step 2: Add Client Branding

1. Create entry in `Client_Branding` table:

```javascript
{
  client_email_domain: 'newclient.com',
  logo_url: 'https://example.com/newclient-logo.png',
  primary_color: '#1E40AF',        // Brand primary color
  secondary_color: '#3B82F6',      // Brand secondary color
  company_name: 'New Client Inc.'
}
```

2. Upload logo to your storage solution
3. Update `logo_url` with the actual URL

### Step 3: Configure User Access

Choose one of the following patterns:

#### Pattern A: Restricted User (Like Heidelberg)

Best for: Clients who should only see their own data

```javascript
// In USER_SPECIFIC_CONFIG
'user@newclient.com': {
  restrictedCustomer: 'NEW CLIENT INC',  // Must match customer name in DB
  lockCustomerFilter: true,
  showAllData: false,
  defaultSite: 'all',
  hiddenTabs: ['costs'],  // Optional: hide specific tabs
  visibleTabs: ['compliance', 'maintenance', 'reports']
}
```

#### Pattern B: Domain-Wide Access

Best for: Internal users or clients with multiple sub-clients

```javascript
// In DOMAIN_CONFIG
'newclient.com': {
  showAllData: true,
  defaultCustomer: 'all',
  defaultSite: 'all',
  hiddenTabs: [],
  visibleTabs: ['compliance', 'maintenance', 'costs', 'refills', 'devices', 'sites', 'reports', 'users']
}
```

#### Pattern C: Partial Access

Best for: Users who can see multiple clients but not all

```javascript
'manager@newclient.com': {
  restrictedCustomer: null,  // Can see multiple customers
  lockCustomerFilter: false,
  showAllData: true,
  defaultSite: 'all',
  hiddenTabs: ['users'],  // Hide admin features
  visibleTabs: ['compliance', 'maintenance', 'costs', 'refills', 'devices', 'sites', 'reports']
}
```

### Step 4: Import Client Data

Use the Base44 API or database import tools to add:

1. **Customer Record**
```javascript
await base44.entities.Customer.create({
  name: 'NEW CLIENT INC',
  email_domain: 'newclient.com',
  status: 'active'
});
```

2. **Site Records**
```javascript
await base44.entities.Site.create({
  name: 'Main Wash Station',
  customer_ref: customerRef,
  address: '123 Main St',
  city: 'Sydney',
  state: 'NSW',
  postal_code: '2000',
  contact_name: 'Site Manager',
  contact_phone: '+61 2 1234 5678',
  contact_email: 'site@newclient.com',
  status: 'active'
});
```

3. **Vehicle Records**
```javascript
await base44.entities.Vehicle.create({
  name: 'Truck 001',
  rfid: 'RFID123456',
  site_id: siteRef,
  customer_id: customerRef,
  target_washes: 12,  // Weekly target
  status: 'active'
});
```

### Step 5: Test the Setup

1. **Login Test**
   - Log in as client user
   - Verify branding appears (logo, colors)
   - Verify restricted banner shows (if applicable)

2. **Data Isolation Test**
   - Verify only client data is visible
   - Try URL manipulation to access other client data
   - Confirm 404/Access Denied responses

3. **Tab Access Test**
   - Verify only allowed tabs are visible
   - Verify hidden tabs don't appear in navigation

4. **Filter Test**
   - Test customer filter (should be locked if configured)
   - Test site filter
   - Test date range filter

### Step 6: Create User Accounts

For each client user:

```javascript
await base44.auth.createUser({
  email: 'user@newclient.com',
  password: 'SecurePassword123!',
  role: 'viewer',  // or 'admin', 'manager', etc.
  assigned_customer: customerRef
});
```

---

## User Role Types

### 1. Super Admin (Internal)

**Email Pattern:** `*@elora.com.au` (except restricted users)

**Access:**
- ✅ All customers
- ✅ All sites
- ✅ All tabs
- ✅ All features
- ✅ User management
- ✅ System configuration

**Configuration:**
```javascript
'admin@elora.com.au': {
  showAllData: true,
  defaultCustomer: 'all',
  defaultSite: 'all',
  visibleTabs: ['compliance', 'maintenance', 'costs', 'refills', 'devices', 'sites', 'reports', 'users']
}
```

### 2. Restricted Client User (Heidelberg Pattern)

**Email Pattern:** Specific users (e.g., `jonny@elora.com.au`, `user@client.com`)

**Access:**
- ✅ Single customer only
- 🔒 Locked customer filter
- ⚠️ Limited tabs (configurable)
- ❌ Cannot see other clients
- ❌ No user management

**Configuration:**
```javascript
'user@client.com': {
  restrictedCustomer: 'CLIENT NAME',
  lockCustomerFilter: true,
  showAllData: false,
  hiddenTabs: ['costs', 'refills', 'devices', 'sites'],
  visibleTabs: ['compliance', 'maintenance', 'reports']
}
```

### 3. Client Admin

**Email Pattern:** `admin@client.com`

**Access:**
- ✅ All sites for their customer
- ✅ All tabs
- ✅ User management (for their customer)
- ✅ Full feature access
- ❌ Cannot see other customers

**Configuration:**
```javascript
'admin@client.com': {
  restrictedCustomer: 'CLIENT NAME',
  lockCustomerFilter: true,
  showAllData: false,
  visibleTabs: ['compliance', 'maintenance', 'costs', 'refills', 'devices', 'sites', 'reports', 'users']
}
```

### 4. Site Manager

**Email Pattern:** `manager@client.com`

**Access:**
- ✅ Specific sites only
- ⚠️ Limited to assigned vehicles
- ⚠️ Most tabs visible
- ❌ No user management
- ❌ No system-wide access

**Configuration:**
```javascript
'manager@client.com': {
  restrictedCustomer: 'CLIENT NAME',
  lockCustomerFilter: true,
  showAllData: false,
  assignedSites: ['site1', 'site2'],
  hiddenTabs: ['users'],
  visibleTabs: ['compliance', 'maintenance', 'costs', 'refills', 'devices', 'sites', 'reports']
}
```

### 5. Driver/Viewer

**Email Pattern:** `driver@client.com`

**Access:**
- ✅ View own vehicle data
- ✅ Mobile-friendly dashboard
- ❌ No editing
- ❌ Limited tabs
- ❌ No export

**Configuration:**
```javascript
'driver@client.com': {
  restrictedCustomer: 'CLIENT NAME',
  lockCustomerFilter: true,
  showAllData: false,
  assignedVehicles: ['vehicle1'],
  visibleTabs: ['compliance'],
  canEditVehicles: false,
  canExportData: false
}
```

---

## Admin Configuration Panel

### Future Enhancement: UI-Based Configuration

Currently, user configuration requires editing `/src/components/auth/PermissionGuard.jsx`.

**Planned Features:**

1. **Admin Settings Page** (`/admin/settings`)
   - User access configuration UI
   - No code changes required
   - Real-time updates

2. **Configuration Options:**
   - Assign customer restrictions per user
   - Configure visible/hidden tabs
   - Lock/unlock customer filters
   - Set default selections

3. **User Management:**
   - Create new users with presets
   - Apply role templates
   - Bulk configuration updates

### Interim Solution: Configuration Helper Script

Create a configuration generator script:

```javascript
// scripts/generate-user-config.js
const generateUserConfig = (email, customerName, roleType) => {
  const templates = {
    restrictedClient: {
      restrictedCustomer: customerName,
      lockCustomerFilter: true,
      showAllData: false,
      hiddenTabs: ['costs', 'refills', 'devices', 'sites'],
      visibleTabs: ['compliance', 'maintenance', 'reports']
    },
    clientAdmin: {
      restrictedCustomer: customerName,
      lockCustomerFilter: true,
      showAllData: false,
      visibleTabs: ['compliance', 'maintenance', 'costs', 'refills', 'devices', 'sites', 'reports', 'users']
    },
    siteManager: {
      restrictedCustomer: customerName,
      lockCustomerFilter: true,
      showAllData: false,
      hiddenTabs: ['users'],
      visibleTabs: ['compliance', 'maintenance', 'costs', 'refills', 'devices', 'sites', 'reports']
    }
  };

  return {
    [email]: templates[roleType]
  };
};

// Usage:
console.log(generateUserConfig('user@heidelberg.com', 'HEIDELBERG MATERIALS', 'restrictedClient'));
```

---

## Troubleshooting

### User sees data from multiple customers

**Cause:** `showAllData: true` or no restrictedCustomer set

**Fix:**
```javascript
'user@client.com': {
  restrictedCustomer: 'CLIENT NAME',  // Add this
  showAllData: false,                 // Set to false
  lockCustomerFilter: true
}
```

### Customer filter is not locked

**Cause:** `lockCustomerFilter` not set or set to `false`

**Fix:**
```javascript
'user@client.com': {
  lockCustomerFilter: true  // Must be true
}
```

### Banner not showing

**Cause:** Missing `restrictedCustomerName` prop

**Fix:** Verify in `Dashboard.jsx`:
```javascript
<FilterSection
  lockCustomerFilter={userConfig?.lockCustomerFilter}
  restrictedCustomerName={userConfig?.restrictedCustomer}  // Must be passed
/>
```

### Wrong customer selected

**Cause:** Customer name mismatch or timing issue

**Fix:**
1. Check customer name spelling in config matches database exactly
2. Verify auto-selection logic in `Dashboard.jsx:158-162`
3. Clear browser cache and reload

### Tabs not hiding

**Cause:** Configuration conflicts between `hiddenTabs` and `visibleTabs`

**Fix:** Use ONLY ONE of these options:
```javascript
// Option 1: Use visibleTabs (recommended)
visibleTabs: ['compliance', 'maintenance', 'reports']

// Option 2: Use hiddenTabs
hiddenTabs: ['costs', 'refills', 'devices', 'sites', 'users']
```

### Empty state not showing

**Cause:** New client has no data yet

**Fix:** This is expected behavior. The empty state guides new clients:
- Shows "Welcome! Add your first vehicle"
- Provides quick start guide
- This is intentional for better onboarding

---

## Client Onboarding Checklist Template

See `CLIENT_ONBOARDING_CHECKLIST.md` for the complete onboarding process.

---

## Security Considerations

### Data Isolation

- ✅ All queries filter by `client_email_domain` or `customer_id`
- ✅ Frontend filters are for UX only, NOT security
- ✅ Backend enforces user context on every request
- ⚠️ Never rely on client-side filtering for security

### Best Practices

1. **Always test data isolation** after adding a new client
2. **Use the Heidelberg user** (`jonny@elora.com.au`) as reference
3. **Document all custom configurations** in this file
4. **Review access logs** regularly for anomalies
5. **Test with multiple concurrent logins** to verify isolation

### Testing Checklist

- [ ] User can only see their customer's data
- [ ] Customer filter is locked (if configured)
- [ ] Correct tabs are visible/hidden
- [ ] Banner shows correct customer name
- [ ] Branding (logo, colors) appears correctly
- [ ] Cannot access other customer data via URL manipulation
- [ ] Cannot access other customer data via API calls
- [ ] Filters work correctly (customer, site, date)
- [ ] Empty states show for new clients
- [ ] Mobile view works (if applicable)

---

## Contact

For questions about multi-tenant setup:

- **Technical Lead:** [Your Name]
- **Email:** tech@cqvs.com.au
- **Documentation:** This file + `DATA_ISOLATION_TESTING.md`

---

**Last Updated:** 2026-01-05
**Version:** 1.0
**Heidelberg Launch:** In Progress
