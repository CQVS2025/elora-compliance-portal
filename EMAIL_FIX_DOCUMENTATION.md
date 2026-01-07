# Email Sending Error - Fix Documentation

## Problem Summary
The email sending function was failing with a 500 error: "Request failed with status code 500"

## Root Cause Analysis

### Issue #1: Unsupported 'from' Parameter
The code was using a `from` parameter that is **not supported** by Base44's `Core.SendEmail` integration.

**Incorrect Code:**
```typescript
await base44.asServiceRole.integrations.Core.SendEmail({
  from: 'noreply@elora.com.au',  // ❌ NOT SUPPORTED
  to: userEmail,
  subject: 'Subject',
  body: emailHTML
});
```

**Correct Code:**
```typescript
await base44.asServiceRole.integrations.Core.SendEmail({
  to: userEmail,
  subject: 'Subject',
  body: emailHTML
});
```

### Issue #2: External Email Address Limitation
Base44's `Core.SendEmail` has a significant limitation: **it can only send emails to registered users within your Base44 app**. It does NOT support sending to external email addresses.

## Immediate Fix Applied
✅ Removed the unsupported `from` parameter from the SendEmail call in `functions/sendEmailReport.ts:135-139`

This should resolve the 500 error if the recipient is a registered user in the app.

## Long-Term Solution: Use Resend Integration

If you need to send emails to external addresses (users not registered in your Base44 app), you must set up the **Resend integration**.

### Why Resend?
- Supports sending to ANY email address (not just app users)
- Allows custom sender domains (e.g., noreply@elora.com.au)
- Supports file attachments
- Professional email delivery service

### How to Set Up Resend Integration

1. **Requirements:**
   - Base44 Builder tier or above
   - Backend functions enabled in your app
   - Resend account with API key

2. **Setup Steps:**
   - Create a Resend account at https://resend.com
   - Add your custom domain to Resend (e.g., elora.com.au)
   - Get your Resend API key
   - Add Resend integration to your Base44 app via the AI chat or integrations page
   - Update your backend function to use `base44.integrations.Resend.SendEmail()` instead of `Core.SendEmail()`

3. **Updated Code Example:**
```typescript
await base44.asServiceRole.integrations.Resend.SendEmail({
  from: 'noreply@elora.com.au',  // ✅ Supported with custom domain
  to: userEmail,
  subject: `${branding.company_name} - Fleet Compliance Report`,
  html: emailHTML  // Note: Resend uses 'html' parameter for HTML content
});
```

## Testing the Current Fix

1. Deploy the updated function to Base44
2. Test with a user email that is registered in your Base44 app
3. If still getting 500 errors, check the Base44 function logs for more details
4. If you need to send to external addresses, proceed with Resend integration setup

## References
- [Base44 SendEmail Documentation](https://docs.base44.com/sdk-docs/type-aliases/integrations)
- [Base44 Resend Integration Guide](https://docs.base44.com/Integrations/Resend-integration)
- [Resend with Base44 Setup](https://resend.com/docs/knowledge-base/base44-integration)
- [Base44 Troubleshooting](https://docs.base44.com/Community-and-support/Troubleshooting)

## Next Steps

1. ✅ Deploy the current fix (remove `from` parameter)
2. Test with registered app users
3. If sending to external addresses is required, set up Resend integration
4. Update code to use Resend.SendEmail() for production use
