# Vercel Deployment Troubleshooting Guide

## 🚨 **Issue: Login works in development but not on Vercel**

### **Root Causes:**
1. Environment variables not configured in Vercel
2. CORS issues between Vercel domain and Django backend
3. Network connectivity issues from Vercel to your server
4. Build-time vs runtime environment variable issues

## 🔧 **Step-by-Step Solution:**

### **1. Configure Environment Variables in Vercel Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `siidaa-admin` project
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: http://13.60.30.188:8000
   Environments: ✅ Production ✅ Preview ✅ Development
   ```
5. Click **Save**

### **2. Update Django CORS Settings**

In your `siidaamusic/siidaamusic/settings.py`, update the CORS configuration:

```python
# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = True  # For development
CORS_ALLOW_CREDENTIALS = True

# Add your Vercel domain (replace with your actual URL)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://your-actual-vercel-url.vercel.app",  # ← Update this!
]

# Ensure these headers are allowed
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cache-control',
    'pragma',
]
```

### **3. Redeploy Your Application**

After adding environment variables:
```bash
# Trigger a new deployment
git add .
git commit -m "Add Vercel environment configuration"
git push origin main
```

Or manually trigger a redeploy in Vercel dashboard.

### **4. Debug Your Deployment**

Visit your deployed app and go to: `https://your-app.vercel.app/vercel-debug`

This will show you:
- Current environment variables
- API connectivity status
- Network configuration
- Error details

### **5. Test the Login**

1. Go to your deployed admin dashboard
2. Try to login with your Django credentials
3. Check browser developer tools for any errors
4. Check Network tab for failed requests

## 🔍 **Common Issues and Solutions:**

### **Issue 1: Environment Variable Not Set**
**Symptoms:** API calls go to wrong URL or fail
**Solution:** Verify `NEXT_PUBLIC_API_URL` is set in Vercel dashboard

### **Issue 2: CORS Errors**
**Symptoms:** Browser shows CORS policy errors
**Solution:** Add your Vercel domain to Django CORS_ALLOWED_ORIGINS

### **Issue 3: Network Connectivity**
**Symptoms:** Requests timeout or fail to reach server
**Solution:** Ensure your Django server is accessible from internet

### **Issue 4: Django Server Not Running**
**Symptoms:** Connection refused errors
**Solution:** Make sure Django server is running on `0.0.0.0:8000`

## 🚀 **Deployment Checklist:**

- [ ] Environment variables added to Vercel dashboard
- [ ] Django CORS configured with Vercel domain
- [ ] Django server running and accessible
- [ ] Vercel app redeployed after environment changes
- [ ] Login tested on deployed app
- [ ] Debug page checked for issues

## 🔧 **Django Server Commands:**

Make sure your Django server is running with:
```bash
cd siidaamusic
python manage.py runserver 0.0.0.0:8000
```

## 📞 **If Issues Persist:**

1. Check Vercel function logs in dashboard
2. Check Django server logs for incoming requests
3. Use browser developer tools to inspect network requests
4. Test API endpoints directly in browser
5. Verify firewall settings on your server

## 🎯 **Expected Results After Fix:**

- ✅ Login works on deployed Vercel app
- ✅ API calls reach Django backend successfully
- ✅ No CORS errors in browser console
- ✅ Environment variables properly loaded
- ✅ All admin features work in production

## 📱 **Testing Steps:**

1. Visit: `https://your-app.vercel.app/login`
2. Enter Django admin credentials
3. Should redirect to dashboard with real data
4. Test CRUD operations (add/edit/delete)
5. Verify file uploads work
6. Check all navigation works properly

Your admin dashboard should now work perfectly on Vercel! 🎵