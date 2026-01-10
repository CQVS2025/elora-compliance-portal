# 🚀 Vercel Deployment Checklist - Quick Reference

## Pre-Deployment (5 minutes)

### Local Environment Check
- [ ] `npm install` completes successfully
- [ ] `npm run build` completes without errors
- [ ] `npm run preview` shows working app
- [ ] No console errors when testing locally
- [ ] `.env` file exists with all required variables
- [ ] `.gitignore` includes `.env` (never commit secrets!)

### Repository Check
- [ ] All changes committed to Git
- [ ] Pushed to GitHub (`git push origin main`)
- [ ] Repository is public or accessible to Vercel
- [ ] Branch name is correct (main/master)

---

## Vercel Account Setup (3 minutes)

- [ ] Vercel account created at [vercel.com](https://vercel.com)
- [ ] Connected to GitHub account
- [ ] Authorized Vercel to access repositories
- [ ] Correct plan selected (Hobby/Pro)

---

## Project Import & Configuration (5 minutes)

- [ ] Repository imported to Vercel
- [ ] Framework detected as **Vite**
- [ ] Build command: `vite build`
- [ ] Output directory: `dist`
- [ ] Install command: `npm install`

---

## Environment Variables (3 minutes)

Add these in Vercel Dashboard → Settings → Environment Variables:

- [ ] `VITE_BASE44_APP_ID` = `_______________` (from your .env)
- [ ] `VITE_BASE44_BACKEND_URL` = `https://api.base44.com`
- [ ] `VITE_BASE44_FUNCTIONS_VERSION` = `prod`

**Important:** Select all three environments for each variable:
- [x] Production
- [x] Preview
- [x] Development

---

## Initial Deployment (2 minutes)

- [ ] Click "Deploy" button
- [ ] Wait for build to complete (1-3 minutes)
- [ ] Build logs show no errors
- [ ] Deployment successful

---

## Post-Deployment Verification (10 minutes)

### Basic Functionality
- [ ] Visit Vercel URL (e.g., `https://elora-compliance-portal-xxxx.vercel.app`)
- [ ] App loads without errors
- [ ] Open browser console (F12) - no errors
- [ ] Login page displays correctly
- [ ] Can login with test credentials

### Authentication Test
- [ ] Login as `jonny@elora.com.au` (Heidelberg test user)
- [ ] Authentication successful
- [ ] Redirected to dashboard
- [ ] Session persists on page refresh

### Dashboard Test
- [ ] Dashboard loads data
- [ ] Vehicle table displays
- [ ] Filters work (customer, site, date range)
- [ ] Charts/graphs render correctly
- [ ] No API errors in console

### Data Isolation Test (Critical!)
- [ ] Heidelberg user sees only Heidelberg data
- [ ] Customer filter is locked (cannot change)
- [ ] Banner shows "Viewing HEIDELBERG MATERIALS Only"
- [ ] Lock icon visible on customer filter
- [ ] No other customers visible in any dropdowns

### Navigation Test
- [ ] All tabs load correctly
- [ ] Hidden tabs don't appear (costs, refills, devices, sites for Heidelberg)
- [ ] Visible tabs work (compliance, maintenance, reports, users)
- [ ] Mobile view responsive (test on phone or resize browser)

---

## Custom Domain Setup (Optional - 15 minutes)

### Add Domain in Vercel
- [ ] Go to Settings → Domains
- [ ] Add domain: `portal.elora.com.au`
- [ ] Note DNS instructions provided by Vercel

### Configure DNS
- [ ] Log into domain registrar (Namecheap/Google Domains/etc.)
- [ ] Add DNS records as instructed by Vercel
- [ ] Wait for DNS propagation (5-30 minutes)

### Verify Domain
- [ ] Vercel shows "Valid Configuration"
- [ ] SSL certificate issued (automatic)
- [ ] HTTPS works: `https://portal.elora.com.au`
- [ ] HTTP redirects to HTTPS

---

## Multi-Tenant Domain Setup (If Applicable - 10 minutes)

For each client subdomain:

### Heidelberg Materials
- [ ] Add domain in Vercel: `heidelberg.portal.elora.com.au`
- [ ] Configure DNS CNAME record
- [ ] Wait for DNS propagation
- [ ] Test: Visit `https://heidelberg.portal.elora.com.au`
- [ ] Verify Heidelberg branding loads
- [ ] Verify data isolation works

### Future Clients (Repeat for Each)
- [ ] Add client subdomain in Vercel
- [ ] Configure DNS
- [ ] Update client branding in database
- [ ] Test subdomain
- [ ] Verify data isolation

---

## Automatic Deployment Setup (2 minutes)

- [ ] Go to Settings → Git
- [ ] Verify production branch is set (main/master)
- [ ] Enable preview deployments (should be on by default)
- [ ] Test: Make a change, push to GitHub
- [ ] Verify Vercel auto-deploys

### Test Auto-Deploy
```bash
# Make a small change
echo "// test deployment" >> README.md

# Commit and push
git add README.md
git commit -m "Test auto-deployment"
git push origin main

# Check Vercel dashboard - should auto-deploy
```

- [ ] Deployment triggered automatically
- [ ] Build completes successfully
- [ ] Changes visible on production URL

---

## Performance & Security (5 minutes)

### Security Headers
- [ ] `vercel.json` file present in repository
- [ ] Security headers configured (X-Frame-Options, etc.)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] No mixed content warnings in browser

### Performance
- [ ] Asset caching enabled (check Network tab in DevTools)
- [ ] Images loading quickly
- [ ] First page load under 3 seconds
- [ ] Lighthouse score > 80 (run in Chrome DevTools)

### SEO (Optional)
- [ ] Page title correct: "ELORA Fleet Compliance Portal"
- [ ] Meta description present
- [ ] Favicon displays (check browser tab)

---

## Analytics & Monitoring (Optional - 5 minutes)

### Vercel Analytics
- [ ] Go to Analytics tab in Vercel
- [ ] Click "Enable Analytics" (free on Pro plan)
- [ ] Verify tracking code added automatically

### Error Monitoring (Optional)
Consider setting up:
- [ ] Sentry for error tracking
- [ ] UptimeRobot for uptime monitoring (free tier available)
- [ ] LogRocket for session replay (optional)

---

## Final Production Checklist

### User Acceptance Testing
- [ ] Heidelberg user can login
- [ ] Heidelberg sees only their data
- [ ] All features work as expected
- [ ] Mobile view works
- [ ] No console errors
- [ ] Performance acceptable

### Documentation
- [ ] Production URL documented: `_______________`
- [ ] Environment variables documented
- [ ] Custom domains documented
- [ ] Rollback plan documented

### Stakeholder Communication
- [ ] Product owner notified of deployment
- [ ] Heidelberg client notified (if ready for production)
- [ ] Support team briefed
- [ ] Credentials shared securely

---

## Rollback Plan (In Case of Issues)

If deployment fails or has critical issues:

### Method 1: Instant Rollback via Vercel
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Previous version restored in 30 seconds

### Method 2: Redeploy from GitHub
1. Revert Git commit: `git revert HEAD`
2. Push to GitHub: `git push origin main`
3. Vercel auto-deploys reverted version

### Method 3: Disable Domain (Emergency)
1. Go to Settings → Domains
2. Remove problematic domain
3. Users can't access until fixed

---

## Common Issues & Solutions

### Issue: Build Fails
**Check:**
- [ ] Build logs in Vercel dashboard
- [ ] Verify `npm run build` works locally
- [ ] Check all dependencies in `package.json`
- [ ] Verify Node.js version compatibility

### Issue: Blank Page After Deployment
**Check:**
- [ ] Browser console for JavaScript errors
- [ ] Environment variables set correctly in Vercel
- [ ] Redeploy after adding environment variables
- [ ] Verify `dist/index.html` exists in build

### Issue: "Configuration Error" Message
**Check:**
- [ ] All three environment variables set in Vercel
- [ ] Environment selected (Production, Preview, Development)
- [ ] Redeploy after adding variables
- [ ] Variable names start with `VITE_`

### Issue: Custom Domain Not Working
**Check:**
- [ ] DNS records configured correctly
- [ ] Wait 24 hours for DNS propagation
- [ ] Use `dig portal.elora.com.au` to check DNS
- [ ] Verify domain ownership in Vercel

---

## Success Criteria

Your deployment is successful when:

✅ **Accessibility**
- [ ] App accessible at Vercel URL
- [ ] Custom domain working (if configured)
- [ ] HTTPS enabled with valid certificate
- [ ] Fast load times (<3 seconds)

✅ **Functionality**
- [ ] Authentication works
- [ ] Dashboard loads with data
- [ ] All features operational
- [ ] Multi-tenant isolation working

✅ **Reliability**
- [ ] No console errors
- [ ] No broken API calls
- [ ] Auto-deployments working
- [ ] Environment variables secure

✅ **Production Ready**
- [ ] Client approved
- [ ] Support team briefed
- [ ] Monitoring enabled
- [ ] Rollback plan tested

---

## Post-Deployment Tasks

### Within 24 Hours
- [ ] Monitor for errors in Vercel logs
- [ ] Check user feedback from Heidelberg
- [ ] Verify all features working in production
- [ ] Test on different devices/browsers

### Within 1 Week
- [ ] Review analytics data
- [ ] Optimize performance based on metrics
- [ ] Address any user-reported issues
- [ ] Plan next feature deployment

### Ongoing
- [ ] Monitor uptime and performance
- [ ] Keep dependencies updated
- [ ] Regular security audits
- [ ] Plan Supabase migration (4-6 weeks)

---

## Next Steps After Successful Deployment

1. **Add More Clients**
   - Onboard next client to multi-tenant system
   - Configure their subdomain
   - Test data isolation

2. **Optimize Performance**
   - Implement lazy loading
   - Optimize images
   - Code splitting

3. **Plan Supabase Migration**
   - Frontend is now on Vercel ✅
   - Backend still on Base44 (works fine for now)
   - Schedule migration in 4-6 weeks
   - Frontend code barely changes during migration

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Production URL:** _______________
**Status:** [ ] Not Started [ ] In Progress [ ] Complete ✅

---

**Need Help?**
- Vercel Documentation: https://vercel.com/docs
- Support: support@vercel.com
- Community: https://github.com/vercel/vercel/discussions
