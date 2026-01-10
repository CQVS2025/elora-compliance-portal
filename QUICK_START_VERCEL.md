# ⚡ Quick Start: Deploy to Vercel in 15 Minutes

**Goal:** Get your ELORA Compliance Portal live on Vercel ASAP

---

## 🎯 Prerequisites (2 minutes)

1. ✅ GitHub account
2. ✅ Repository pushed to GitHub
3. ✅ Your Base44 credentials from `.env` file

---

## 🚀 Deployment Steps

### Step 1: Create Vercel Account (2 minutes)

1. Go to **[vercel.com/signup](https://vercel.com/signup)**
2. Click **"Continue with GitHub"**
3. Authorize Vercel
4. Select **Hobby** plan (free)

---

### Step 2: Import Your Project (3 minutes)

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Find **`elora-compliance-portal`** in the list
3. Click **"Import"**
4. Verify these settings (should be auto-detected):
   - Framework: **Vite** ✅
   - Build Command: **`vite build`** ✅
   - Output Directory: **`dist`** ✅

---

### Step 3: Add Environment Variables (5 minutes)

**CRITICAL STEP - Don't skip this!**

Click **"Environment Variables"** and add:

```
Name: VITE_BASE44_APP_ID
Value: [Get from your .env file]
Environments: ☑ Production ☑ Preview ☑ Development
```

```
Name: VITE_BASE44_BACKEND_URL
Value: https://api.base44.com
Environments: ☑ Production ☑ Preview ☑ Development
```

```
Name: VITE_BASE44_FUNCTIONS_VERSION
Value: prod
Environments: ☑ Production ☑ Preview ☑ Development
```

**Important:** Check ALL THREE environments for each variable!

---

### Step 4: Deploy! (2 minutes)

1. Click **"Deploy"**
2. Wait for build (1-3 minutes)
3. Watch the build logs
4. See "Congratulations!" message

---

### Step 5: Test Your App (3 minutes)

1. Click the deployment URL (e.g., `https://elora-compliance-portal-xxxx.vercel.app`)
2. App should load
3. Try logging in as `jonny@elora.com.au`
4. Verify dashboard loads

---

## ✅ Success Checklist

- [ ] App loads at Vercel URL
- [ ] No console errors (F12)
- [ ] Can log in
- [ ] Dashboard shows data
- [ ] Heidelberg user sees only their data

---

## 🆘 Troubleshooting

### Problem: Blank page after deployment

**Solution:**
```
1. Open browser console (F12)
2. Look for errors
3. Usually missing environment variables
4. Add them in Vercel → Settings → Environment Variables
5. Redeploy: Deployments → ... → Redeploy
```

### Problem: "Configuration Error" message

**Solution:**
```
1. Verify all 3 environment variables are set
2. Verify they all start with VITE_
3. Verify you selected all 3 environments
4. Redeploy after adding variables
```

### Problem: Build fails

**Solution:**
```
1. Check build logs in Vercel
2. Test locally: npm run build
3. Fix any errors shown
4. Push to GitHub
5. Vercel auto-redeploys
```

---

## 🎉 What's Next?

### Now (Optional)
- **Add custom domain:** Settings → Domains
- **Enable analytics:** Analytics → Enable
- **Set up monitoring:** UptimeRobot (free)

### Later (When Ready)
- **Migrate to Supabase:** 4-6 weeks
- **Onboard more clients:** Use multi-tenant setup
- **Optimize performance:** Lazy loading, code splitting

---

## 📚 Full Documentation

For detailed guides, see:

- **Complete Guide:** `VERCEL_DEPLOYMENT_GUIDE.md`
- **Step-by-Step Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **Environment Variables:** `.env.vercel.template`

---

## 🎊 You Did It!

Your ELORA Compliance Portal is now:
- ✅ Live on Vercel's global CDN
- ✅ Auto-deploying on every git push
- ✅ HTTPS enabled (secure)
- ✅ Ready for production use

**Deployment URL:** ___________________________
**Deployed Date:** ___________________________

---

**Need help?** Check `VERCEL_DEPLOYMENT_GUIDE.md` for detailed troubleshooting.
