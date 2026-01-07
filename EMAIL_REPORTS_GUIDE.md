# Email Reports Feature Guide

## Overview

The Email Reports feature provides automated, branded email delivery of fleet compliance and management reports. Users can configure scheduled reports or request instant delivery via the "Email Me Now" button.

---

## Features

### 📧 Branded Email Templates
- **Dynamic Branding**: Emails automatically use your organization's logo, colors, and company name from the `Client_Branding` database
- **Responsive Design**: Beautiful, mobile-optimized HTML emails that look professional on all devices
- **Modern Styling**: Clean, spacious layouts with visual hierarchy and professional typography

### 📊 Comprehensive Reports
Users can select from multiple report types:
- **Compliance Summary**: Vehicle compliance rates, wash tracking, and alerts
- **Maintenance Analysis**: Upcoming services, overdue maintenance, and predictive alerts
- **Cost Analysis**: Maintenance cost tracking and financial trends
- **AI-Generated Insights**: Intelligent analysis and actionable recommendations

### ⏰ Flexible Scheduling
- **Daily Reports**: Delivered every 24 hours
- **Weekly Reports**: Delivered every 7 days
- **Monthly Reports**: Delivered every 30 days
- **Instant Delivery**: "Email Me Now" button for on-demand reports

### 🎨 Customization Options
- Select specific reports or "All Reports" option
- Include/exclude charts and visualizations
- Toggle AI-generated insights
- User-specific branding based on email domain

---

## User Guide

### Accessing Email Report Settings

1. Log in to the ELORA Fleet Compliance Portal
2. Navigate to the **"Email Reports"** tab in the main dashboard
3. You'll see the Email Report Settings interface

### Configuring Email Reports

#### Step 1: Enable Email Reports
- Toggle the **"Enable Email Reports"** switch to turn on automated reports
- When disabled, no scheduled emails will be sent (but "Email Me Now" still works)

#### Step 2: Select Report Frequency
Choose how often you want to receive reports:
- **Daily**: Reports sent every day at the scheduled time
- **Weekly**: Reports sent once per week
- **Monthly**: Reports sent once per month

#### Step 3: Choose Report Types
Select which reports to include in your email:

- ✅ **Compliance Summary**: Vehicle compliance rates and wash tracking
- ✅ **Maintenance Analysis**: Upcoming services and maintenance alerts
- ✅ **Cost Analysis**: Maintenance costs and financial trends
- ✅ **AI-Generated Insights**: Intelligent analysis and recommendations

**Tip**: Use the "Select All" button to quickly include all reports, or choose specific ones based on your needs.

#### Step 4: Additional Options
- **Include Charts & Visualizations**: Add visual graphs and charts to your reports (recommended)
- **Include AI-Generated Insights**: Get intelligent analysis and actionable recommendations

#### Step 5: Save Settings
Click the **"Save Settings"** button to save your preferences.

### Using "Email Me Now"

Want a report right away? No problem!

1. Select the reports you want to receive (at least one)
2. Click the **"Email Me Now"** button
3. Your report will be generated and sent immediately to your email address

**Note**: The "Email Me Now" button respects your current report selections but ignores the frequency setting.

---

## Email Report Contents

### Example Email Structure

```
┌─────────────────────────────────────────┐
│  [Company Logo]                         │
│  Compliance Portal Report               │
├─────────────────────────────────────────┤
│                                          │
│  📊 Compliance Overview                 │
│  ┌─────────────┬─────────────┐         │
│  │ Avg Comp    │ Total Veh   │         │
│  │    85%      │     42      │         │
│  └─────────────┴─────────────┘         │
│                                          │
│  🔧 Maintenance Status                  │
│  ┌─────────────┬─────────────┐         │
│  │ Upcoming    │ Overdue     │         │
│  │     12      │      3      │         │
│  └─────────────┴─────────────┘         │
│                                          │
│  [Detailed Tables]                      │
│  [AI Insights]                          │
│                                          │
├─────────────────────────────────────────┤
│  © 2025 Your Company Name               │
└─────────────────────────────────────────┘
```

### Branding Applied

Emails automatically include:
- **Company Logo**: From `Client_Branding` database
- **Brand Colors**: Primary and secondary colors in headers and accents
- **Company Name**: Personalized throughout the email
- **Professional Footer**: Company information and copyright

---

## For Administrators

### Setting Up Branding

Email branding is pulled from the `Client_Branding` database entity based on the user's email domain.

**Example**:
- User: `jonny@elora.com.au`
- Email Domain: `elora.com.au`
- System looks up: `Client_Branding` where `client_email_domain = 'elora.com.au'`

**Required Fields**:
```javascript
{
  client_email_domain: 'heidelberg.com.au',
  company_name: 'Heidelberg Materials',
  logo_url: 'https://example.com/heidelberg-logo.png',
  primary_color: '#FF5733',
  secondary_color: '#C70039'
}
```

### Configuring User Access

Users can access Email Reports if the `email-reports` tab is in their visible tabs configuration.

**Location**: `/src/components/auth/PermissionGuard.jsx`

**Example Configuration**:
```javascript
'jonny@elora.com.au': {
  restrictedCustomer: 'HEIDELBERG MATERIALS',
  lockCustomerFilter: true,
  showAllData: false,
  defaultSite: 'all',
  hiddenTabs: ['costs', 'refills', 'devices', 'sites'],
  visibleTabs: ['compliance', 'maintenance', 'reports', 'email-reports']
}
```

### Database Schema

#### EmailReportPreferences Entity
```javascript
{
  id: string,                           // Auto-generated
  user_email: string,                   // User's email address
  enabled: boolean,                     // Email reports enabled/disabled
  frequency: 'daily' | 'weekly' | 'monthly',
  report_types: string[],              // Array of report types to include
  include_charts: boolean,             // Include visualizations
  include_ai_insights: boolean,        // Include AI analysis
  last_sent: datetime,                 // Timestamp of last sent email
  next_scheduled: datetime,            // Timestamp of next scheduled send
  created_at: datetime,
  updated_at: datetime
}
```

---

## Cloud Functions

### sendEmailReport.ts
**Purpose**: Generates and sends email reports (instant or scheduled)

**Trigger**:
- Manual via "Email Me Now" button
- Invoked by `sendScheduledReports` function

**Parameters**:
```javascript
{
  userEmail: string,
  reportTypes: string[],
  includeCharts: boolean,
  includeAiInsights: boolean
}
```

**Returns**:
```javascript
{
  success: boolean,
  message: string,
  recipient: string
}
```

### sendScheduledReports.ts
**Purpose**: Cron-triggered function that checks all users with scheduled reports and sends them

**Trigger**: Scheduled (daily cron job recommended)

**Process**:
1. Fetch all `EmailReportPreferences` where `enabled = true`
2. Check if each user is due for a report based on `frequency` and `last_sent`
3. Invoke `sendEmailReport` for each due user
4. Update `last_sent` and `next_scheduled` timestamps

**Returns**:
```javascript
{
  success: boolean,
  message: string,
  results: {
    total: number,
    sent: number,
    skipped: number,
    failed: number,
    errors: Array<{email: string, error: string}>
  }
}
```

---

## Technical Implementation

### Email Template System

**Location**: `/src/utils/emailTemplates.js`

The system provides modular template functions:

- `generateEmailHeader(branding)`: Creates branded header with logo
- `generateEmailFooter(branding)`: Creates branded footer
- `generateMetricCard(title, value, subtitle, color)`: Metric display cards
- `generateDataTable(headers, rows)`: Responsive data tables
- `generateSectionHeader(title, icon)`: Section dividers
- `generateAlert(title, message, type)`: Alert/callout boxes
- `generateCompleteEmailTemplate(branding, content)`: Full HTML wrapper

### Report Generation Logic

Reports are generated server-side in `sendEmailReport.ts` using:

1. **Data Fetching**: Query vehicles, maintenance records, costs
2. **Permission Filtering**: Respect user's role and assigned vehicles/sites
3. **Data Processing**: Calculate compliance rates, upcoming maintenance, costs
4. **AI Insights**: Optional LLM invocation for intelligent analysis
5. **HTML Generation**: Combine data with branded templates
6. **Email Sending**: Deliver via Base44 `SendEmail` integration

---

## Scheduling Setup

### Recommended Cron Configuration

To run scheduled reports daily at 8:00 AM:

```bash
0 8 * * * curl -X POST https://your-base44-url/functions/sendScheduledReports
```

**Alternative Frequencies**:
- **Hourly**: `0 * * * *` (checks every hour, sends if due)
- **Twice Daily**: `0 8,16 * * *` (8 AM and 4 PM)
- **Weekly**: `0 8 * * 1` (Every Monday at 8 AM)

### Base44 Cloud Scheduler

If using Base44's built-in scheduler, configure in your Base44 dashboard:

```javascript
{
  functionName: 'sendScheduledReports',
  schedule: '0 8 * * *',
  timezone: 'Australia/Sydney'
}
```

---

## Troubleshooting

### Email Not Received

**Check**:
1. Email reports are enabled in settings
2. At least one report type is selected
3. Frequency schedule is correct
4. Check spam/junk folder
5. Verify email address is correct in user profile

**Admin Debugging**:
```javascript
// Check user preferences
await base44.asServiceRole.entities.EmailReportPreferences.filter({
  user_email: 'user@example.com'
});

// Check last sent timestamp
// If last_sent is recent, user may not be due for next report
```

### Branding Not Showing

**Check**:
1. `Client_Branding` entity exists for user's email domain
2. Logo URL is accessible (publicly hosted image)
3. Color codes are valid hex format (e.g., `#FF5733`)

**Fallback**: System uses default ELORA branding if no client branding found

### Reports Missing Data

**Check**:
1. User has permission to view the data (check role and assigned vehicles)
2. Vehicles/maintenance records exist in the database
3. Date range filters are not excluding all data

### "Email Me Now" Button Disabled

**Reasons**:
- No report types selected (must select at least one)
- Already sending (button disabled during send process)

---

## Best Practices

### For Users

1. **Start with Weekly**: Weekly reports provide good balance of frequency and information overload
2. **Select Relevant Reports**: Only include reports you'll actually read
3. **Enable AI Insights**: AI provides actionable recommendations based on your data
4. **Test with "Email Me Now"**: Verify your settings before enabling scheduled reports

### For Administrators

1. **Set Up Branding First**: Configure `Client_Branding` before users start using email reports
2. **Test Thoroughly**: Send test emails to verify branding, data, and formatting
3. **Monitor Delivery**: Check `sendScheduledReports` logs for failed deliveries
4. **Optimize Scheduling**: Choose off-peak hours for sending bulk reports
5. **Educate Users**: Share this guide with users to maximize adoption

---

## FAQ

**Q: Can I change my email address?**
A: Yes, update your email in the user profile. Email report preferences are tied to your email address.

**Q: Can I schedule reports at a specific time of day?**
A: Currently, all scheduled reports are sent when the cron job runs (typically 8 AM). Individual time customization is not yet available.

**Q: How long are reports stored?**
A: Reports are generated fresh each time and not stored. Only preferences and send timestamps are saved.

**Q: Can I share my report settings with my team?**
A: No, settings are per-user. Each team member must configure their own preferences.

**Q: What happens if I disable email reports?**
A: Scheduled emails stop immediately. Your settings are saved and will resume if you re-enable.

**Q: Can I get reports for multiple customers?**
A: Reports respect your user permissions. If you have access to multiple customers, reports will include data from all accessible customers unless filtered by user config.

---

## Support

For technical issues or questions:
- **Email**: tech@cqvs.com.au
- **Documentation**: See related guides in repository
- **Issues**: Create a GitHub issue with `[Email Reports]` tag

---

## Changelog

### Version 1.0.0 (2025-01-07)
- ✨ Initial release
- ✅ Branded email templates
- ✅ Multi-report support (compliance, maintenance, costs, AI insights)
- ✅ Frequency scheduling (daily, weekly, monthly)
- ✅ "Email Me Now" instant delivery
- ✅ User-specific preferences
- ✅ Mobile-responsive email design

---

## Related Documentation

- **Multi-Tenant Setup**: `MULTI_TENANT_SETUP_GUIDE.md`
- **Client Branding**: See `Client_Branding` entity documentation
- **User Permissions**: `src/components/auth/PermissionGuard.jsx`
- **Email Templates**: `src/utils/emailTemplates.js`

---

**Last Updated**: January 7, 2025
**Version**: 1.0.0
**Maintained By**: CQVS Development Team
