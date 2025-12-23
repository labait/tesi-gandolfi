# Firebase API Key Setup Instructions

## Issue
Error: "Requests from referer https://nofomo-36b6c.firebaseapp.com/ are blocked"

## Solution
The API key has HTTP referrer restrictions that need to be updated in Google Cloud Console.

## Steps to Fix

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `nofomo-36b6c`
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your API key: `AIzaSyC33X_tX977xAFDnlD-cD4jROrTYuVqWew`
5. Click on the API key to edit it
6. Under **Application restrictions**, select **HTTP referrers (web sites)**
7. Click **Add an item** and add these referrers:

### Required Referrers:
```
https://nofomo-36b6c.firebaseapp.com/*
https://*.nofomo-36b6c.firebaseapp.com/*
http://localhost:*
http://127.0.0.1:*
```

### Optional (if you have a custom domain):
```
https://yourdomain.com/*
https://*.yourdomain.com/*
```

### For Development (if using Vite default port):
```
http://localhost:5173/*
http://localhost:5174/*
```

8. Click **Save**
9. Wait a few minutes for changes to propagate
10. Try your authentication again

## Quick Access Links
- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials?project=nofomo-36b6c)
- [Firebase Console](https://console.firebase.google.com/project/nofomo-36b6c)

## Notes
- Changes may take a few minutes to take effect
- Make sure to include both `http://` and `https://` versions if needed
- The `*` wildcard allows all paths under that domain
- For localhost, use `*` as the port to allow any port
