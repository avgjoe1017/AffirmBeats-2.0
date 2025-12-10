# Quick Guide: Finding Your Sentry DSN

## The Fastest Way:

1. **Go to**: https://sentry.io
2. **Sign in** (or create account)
3. **Click "Create Project"** (if you don't have one)
4. **Select "Node.js"**
5. **Name it** and click "Create"
6. **The DSN is shown on the next page** - copy it!

## If You Already Have a Project:

1. **Click on your project** in Sentry
2. **Go to**: Settings → Client Keys (DSN)
3. **Copy the DSN** (the URL that starts with `https://`)

## What It Looks Like:

```
https://abc123@o123456.ingest.sentry.io/1234567
```

Just copy the entire URL and paste it into your `.env` file as:

```bash
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/1234567
```

That's it!

