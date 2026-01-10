# 🚀 Vercel Deployment Guide - ELORA Compliance Portal

## Complete Step-by-Step Guide to Deploy Your App to Vercel

**Estimated Time:** 30-45 minutes
**Difficulty:** Beginner-Friendly
**Cost:** Free (Hobby tier) or $20/month (Pro tier)

---

## 📋 Prerequisites

Before you begin, ensure you have:

- [x] GitHub account with this repository pushed
- [x] Your Base44 credentials (from `.env` file)
- [x] A credit card (for Vercel Pro if needed, but free tier works initially)
- [x] Node.js installed locally (to test build)

---

## Part 1: Local Build Test (5 minutes)

Before deploying to Vercel, let's ensure your app builds correctly.

### Step 1: Test Local Build

```bash
# Navigate to your project directory
cd /home/user/elora-compliance-portal

# Install dependencies (if not already installed)
npm install

# Run a production build
npm run build

# Preview the production build
npm run preview
```

**Expected Output:**
```
✓ built in 3.2s
dist/index.html                   0.45 kB
dist/assets/index-a1b2c3d4.css   234.56 kB
dist/assets/index-e5f6g7h8.js    567.89 kB
```

**If build fails:** Fix any errors before proceeding. Common issues:
- Missing environment variables (non-critical for build, add them in Vercel)
- Linting errors (run `npm run lint:fix`)
- Import errors (check file paths)

### Step 2: Verify Preview Works

Open the preview URL (typically `http://localhost:4173`) and verify:
- [ ] App loads without errors
- [ ] UI renders correctly
- [ ] No console errors (F12 Developer Tools)

✅ **Once build succeeds, proceed to Vercel deployment.**

---

## Part 2: Vercel Account Setup (3 minutes)

### Step 1: Create Vercel Account

1. Go to [https://vercel.com/signup](https://vercel.com/signup)
2. Click **"Continue with GitHub"** (recommended)
3. Authorize Vercel to access your GitHub account
4. Choose **Hobby** plan (free)

### Step 2: Install Vercel CLI (Optional but Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
```

Follow the prompts to authenticate.

---

## Part 3: Deploy to Vercel (10 minutes)

### Method A: Deploy via Vercel Dashboard (Easiest)

#### Step 1: Import Repository

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Find **`elora-compliance-portal`** in the list
4. Click **"Import"**

#### Step 2: Configure Project

**Framework Preset:** Vite
**Root Directory:** `./` (leave as default)
**Build Command:** `vite build` (auto-detected)
**Output Directory:** `dist` (auto-detected)
**Install Command:** `npm install` (auto-detected)

**These should all be auto-detected. Verify they match:**

```
Framework Preset: Vite
Build Command: vite build
Output Directory: dist
Install Command: npm install
Development Command: vite
```

#### Step 3: Add Environment Variables

Click **"Environment Variables"** and add the following:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_BASE44_APP_ID` | `your_actual_app_id` | Production, Preview, Development |
| `VITE_BASE44_BACKEND_URL` | `https://api.base44.com` | Production, Preview, Development |
| `VITE_BASE44_FUNCTIONS_VERSION` | `prod` | Production, Preview, Development |

**Where to find these values:**
- Check your local `.env` file (DO NOT commit this file!)
- Or check Base44 dashboard for your app ID

**Important:** Select all three environments (Production, Preview, Development) for each variable.

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 1-3 minutes for build to complete
3. Watch the build logs in real-time

**Expected Build Time:** 1-3 minutes

#### Step 5: Verify Deployment

Once deployed, you'll see:

```
🎉 Congratulations! Your project is now deployed!

https://elora-compliance-portal-xxxx.vercel.app
```

Click the URL to visit your live app!

---

### Method B: Deploy via CLI (Advanced)

```bash
# From your project directory
cd /home/user/elora-compliance-portal

# Deploy to Vercel
vercel

# Follow the prompts:
# Set up and deploy? Yes
# Which scope? Your account
# Link to existing project? No
# What's your project's name? elora-compliance-portal
# In which directory is your code located? ./
# Want to override settings? No

# Add environment variables
vercel env add VITE_BASE44_APP_ID
vercel env add VITE_BASE44_BACKEND_URL
vercel env add VITE_BASE44_FUNCTIONS_VERSION

# Deploy to production
vercel --prod
```

---

## Part 4: Custom Domain Setup (15 minutes)

### Option A: Use Vercel Subdomain (Free, Instant)

Your app is already live at:
```
https://elora-compliance-portal-xxxx.vercel.app
```

**Pros:** Free, instant, HTTPS included
**Cons:** Not branded, Vercel in URL

---

### Option B: Custom Domain (Recommended for Production)

#### Step 1: Purchase/Use Your Domain

If you don't have a domain yet:
- [Namecheap](https://namecheap.com) - ~$10/year
- [Google Domains](https://domains.google) - ~$12/year
- Or use your existing domain

**Recommended domain structure:**
- Main app: `portal.elora.com.au`
- Heidelberg: `heidelberg.portal.elora.com.au`
- Client 2: `client2.portal.elora.com.au`

#### Step 2: Add Domain in Vercel

1. Go to your project in Vercel
2. Click **"Settings"** → **"Domains"**
3. Enter your domain (e.g., `portal.elora.com.au`)
4. Click **"Add"**

#### Step 3: Configure DNS

Vercel will show you which DNS records to add. Typically:

**For root domain (portal.elora.com.au):**
```
Type: A
Name: portal
Value: 76.76.21.21
```

**For subdomain (heidelberg.portal.elora.com.au):**
```
Type: CNAME
Name: heidelberg.portal
Value: cname.vercel-dns.com
```

**Or use Vercel DNS (easier):**
```
Type: NS
Name: portal
Value: ns1.vercel-dns.com
Value: ns2.vercel-dns.com
```

#### Step 4: Wait for DNS Propagation

- **Typical time:** 5-30 minutes
- **Maximum time:** 24-48 hours
- **Check status:** Vercel dashboard shows "Valid Configuration" when ready

#### Step 5: Verify SSL Certificate

Once DNS propagates, Vercel automatically:
- ✅ Provisions SSL certificate (free via Let's Encrypt)
- ✅ Enables HTTPS
- ✅ Redirects HTTP → HTTPS

Visit `https://portal.elora.com.au` to verify!

---

## Part 5: Multi-Tenant Domain Setup (10 minutes)

### Adding Client-Specific Domains

Your app supports white-label branding per domain. Here's how to set it up:

#### Step 1: Add Subdomains in Vercel

For each client, add their subdomain:

1. **Vercel Dashboard** → **Settings** → **Domains**
2. Add domains:
   - `heidelberg.portal.elora.com.au`
   - `client2.portal.elora.com.au`
   - `client3.portal.elora.com.au`

#### Step 2: Configure DNS for Each Subdomain

Add CNAME records in your DNS provider:

```
Type: CNAME
Name: heidelberg.portal
Value: cname.vercel-dns.com

Type: CNAME
Name: client2.portal
Value: cname.vercel-dns.com
```

#### Step 3: Update Client Branding in Database

Ensure each client has branding configured with their domain:

```sql
-- In your Base44 database
INSERT INTO Client_Branding (
  client_email_domain,
  domain,
  logo_url,
  primary_color,
  company_name
) VALUES (
  'heidelberg.com.au',
  'heidelberg.portal.elora.com.au',
  'https://heidelberg.com/logo.png',
  '#FF5722',
  'Heidelberg Materials'
);
```

#### Step 4: Test Each Domain

Visit each domain and verify:
- [ ] Correct logo displays
- [ ] Correct brand colors apply
- [ ] Correct company name shows
- [ ] Data isolation works (only see their data)

---

## Part 6: Automatic Deployments (5 minutes)

### Enable Automatic Deployments from GitHub

Vercel automatically deploys when you push to GitHub!

#### How It Works:

```
git push origin main
    ↓
GitHub receives push
    ↓
Vercel detects change
    ↓
Automatic build starts
    ↓
Deployed in 1-3 minutes
```

#### Configure Deployment Branches:

1. **Vercel Dashboard** → **Settings** → **Git**
2. **Production Branch:** `main` (or `master`)
3. **Preview Branches:** All branches (enabled by default)

**Now every PR gets a preview URL!**

Example:
```
PR #42: "Add new feature"
Preview URL: https://elora-compliance-portal-git-feature-xxxx.vercel.app
```

---

## Part 7: Environment Variables Management (5 minutes)

### Adding/Updating Environment Variables

#### Via Dashboard:

1. **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Enter name and value
4. Select environments (Production, Preview, Development)
5. Click **"Save"**

**Important:** After adding/changing environment variables, you must redeploy:
- Go to **Deployments** → Click **"..."** → **"Redeploy"**

#### Via CLI:

```bash
# Add new variable
vercel env add VITE_NEW_VARIABLE production

# List all variables
vercel env ls

# Remove variable
vercel env rm VITE_OLD_VARIABLE production

# Pull environment variables to local
vercel env pull
```

---

## Part 8: Monitoring & Analytics (5 minutes)

### Enable Vercel Analytics

1. **Vercel Dashboard** → **Analytics** tab
2. Click **"Enable Analytics"**
3. Add one line to your `index.html`:

```html
<!-- Already handled by Vercel automatically -->
```

**What you get:**
- ✅ Page views
- ✅ Unique visitors
- ✅ Top pages
- ✅ Real-time traffic
- ✅ Web Vitals (Core Web Vitals)

**Free tier:** 2,500 page views/month
**Pro tier:** Unlimited analytics

---

## Part 9: Performance Optimization (Optional)

### Configure Headers for Better Performance

Create `vercel.json` in your project root (already created for you):

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

This caches your assets for 1 year, improving load times.

---

## Part 10: Troubleshooting

### Common Issues and Solutions

#### Issue 1: Build Fails with "Module not found"

**Cause:** Missing dependencies or incorrect import paths

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Test build locally
npm run build
```

#### Issue 2: Environment Variables Not Working

**Cause:** Variables not set in Vercel or not prefixed with `VITE_`

**Solution:**
- All environment variables MUST start with `VITE_` to be exposed to frontend
- Verify variables in Vercel dashboard
- Redeploy after adding variables

#### Issue 3: Custom Domain Shows "Invalid Configuration"

**Cause:** DNS records not configured correctly

**Solution:**
- Wait 24 hours for DNS propagation
- Verify DNS records with: `dig portal.elora.com.au`
- Use Vercel's DNS for easier setup

#### Issue 4: App Shows Blank Page

**Cause:** JavaScript errors or incorrect build output

**Solution:**
- Check browser console (F12) for errors
- Verify `dist/index.html` exists after build
- Check Vercel build logs for errors

#### Issue 5: "Configuration Error" on App Load

**Cause:** Missing Base44 environment variables

**Solution:**
- Add all three environment variables in Vercel
- Ensure they're set for Production environment
- Redeploy after adding

---

## Part 11: Deployment Checklist

### Pre-Deployment Checklist

- [ ] Local build succeeds (`npm run build`)
- [ ] Preview works locally (`npm run preview`)
- [ ] All environment variables documented
- [ ] `.gitignore` includes `.env` (never commit secrets!)
- [ ] `package.json` has correct scripts
- [ ] No hardcoded secrets in code

### Post-Deployment Checklist

- [ ] App loads at Vercel URL
- [ ] No console errors in browser
- [ ] Authentication works
- [ ] Dashboard data loads
- [ ] Environment variables working
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (HTTPS)
- [ ] Automatic deployments enabled

### Production Readiness Checklist

- [ ] Custom domain configured
- [ ] SSL/HTTPS working
- [ ] Analytics enabled
- [ ] Error monitoring set up (optional: Sentry)
- [ ] Performance optimized (vercel.json)
- [ ] Multi-tenant domains configured
- [ ] Client branding tested
- [ ] Data isolation verified

---

## Part 12: Next Steps

### After Deployment

1. **Test with Heidelberg User**
   - Login as `jonny@elora.com.au`
   - Verify restricted access works
   - Check branding displays correctly
   - Test all features

2. **Set Up Monitoring**
   - Enable Vercel Analytics
   - Consider Sentry for error tracking
   - Set up uptime monitoring (UptimeRobot, free)

3. **Plan Supabase Migration**
   - Your frontend is now on Vercel
   - Backend still on Base44 (works fine!)
   - When ready, migrate backend to Supabase (4-6 weeks)
   - Frontend code barely changes during migration

4. **Onboard Next Client**
   - Add their subdomain in Vercel
   - Configure branding in database
   - Test data isolation
   - Provide credentials

---

## Cost Breakdown

### Vercel Pricing (as of 2026)

**Hobby (Free):**
- ✅ Unlimited projects
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ❌ No custom domain SSL (actually free now!)
- ❌ No analytics (basic only)

**Pro ($20/month):**
- ✅ Everything in Hobby
- ✅ Unlimited bandwidth
- ✅ Advanced analytics
- ✅ Password protection
- ✅ Priority support
- ✅ Commercial use allowed

**When to upgrade:**
- **Stay on Free:** 1-5 clients, <100GB bandwidth/month
- **Upgrade to Pro:** 5+ clients, need analytics, commercial use

---

## Support & Resources

### Vercel Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Vite Deployment Guide](https://vercel.com/guides/deploying-vite-with-vercel)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)

### Community
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Vercel Discord](https://vercel.com/discord)

### Contact
- Vercel Support: support@vercel.com
- This Guide: Created by Claude Code

---

## Summary

You've successfully deployed your ELORA Compliance Portal to Vercel! 🎉

**What you achieved:**
- ✅ Production-ready hosting on Vercel
- ✅ Automatic deployments from GitHub
- ✅ Custom domain support
- ✅ Multi-tenant white-label setup
- ✅ SSL/HTTPS enabled
- ✅ Preview deployments for every PR

**Your app is now:**
- 🌍 Globally distributed on Vercel's CDN
- ⚡ Lightning-fast with edge caching
- 🔒 Secure with automatic HTTPS
- 🚀 Auto-deploying on every git push

**Next milestone:** Migrate backend from Base44 to Supabase (when ready)

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Production URL:** _________________
**Status:** ✅ Live
