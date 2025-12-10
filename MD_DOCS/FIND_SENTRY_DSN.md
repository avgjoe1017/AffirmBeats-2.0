# How to Find Your Sentry DSN

**Having trouble finding the DSN?** Here's exactly where to look:

---

## Method 1: Right After Creating Project (Easiest)

1. **After you create a new project**, Sentry shows you a setup page
2. **Look for a code block** that says something like:
   ```javascript
   Sentry.init({
     dsn: "https://xxxxx@xxxxx.ingest.sentry.io/xxxxx",
   });
   ```
3. **Copy the URL** inside the quotes (the part that starts with `https://`)

---

## Method 2: From Project Settings

1. **Go to your Sentry dashboard**: [sentry.io](https://sentry.io)
2. **Click on your project** (e.g., "Recenter Backend")
3. **Go to Settings**:
   - Look for **"Settings"** in the left sidebar
   - Or click the gear icon ⚙️
4. **Click "Client Keys (DSN)"**:
   - In the Settings menu, find **"Client Keys (DSN)"**
   - It's usually under "Projects" → "Your Project" → "Client Keys (DSN)"
5. **Copy the DSN**:
   - You'll see a URL that looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
   - Click the **copy button** (📋) next to it
   - Or select and copy the entire URL

---

## Method 3: From Project Overview

1. **Go to your project** in Sentry
2. **Look at the top of the page** - sometimes the DSN is shown there
3. **Or look for "Installation" or "Setup"** tabs/sections

---

## Method 4: If You Can't Find It

### Create a New Project (if needed):

1. **Go to**: [sentry.io](https://sentry.io)
2. **Click "Create Project"** (big button, usually top right)
3. **Select "Node.js"** as the platform
4. **Name it**: `Recenter Backend`
5. **Click "Create Project"**
6. **The DSN will be shown immediately** on the next page

---

## What the DSN Looks Like

The DSN is a URL that looks like this:

```
https://abc123def456@o123456.ingest.sentry.io/1234567
```

**Key characteristics**:
- ✅ Starts with `https://`
- ✅ Has `@` symbol in the middle
- ✅ Contains `ingest.sentry.io`
- ✅ Ends with a number
- ✅ Usually 3 parts separated by `/`

**Example**:
```
https://a1b2c3d4e5f6@o123456.ingest.sentry.io/1234567890
```

---

## Common Issues

### "I don't see Client Keys (DSN)"

**Try**:
1. Make sure you're in the **correct project**
2. Look for **"Settings"** → **"Projects"** → **"Your Project Name"**
3. Scroll down in the Settings page
4. Look for tabs: "General", "Client Keys", "Alerts", etc.

### "I see multiple DSNs"

**Use the first one** (usually the default/primary DSN). They all work the same.

### "The DSN looks different"

**That's okay!** As long as it:
- Starts with `https://`
- Contains `sentry.io`
- Has `@` symbol

It should work.

---

## Still Can't Find It?

### Option A: Check Your Email

Sentry sometimes sends the DSN in a welcome email when you create a project.

### Option B: Use the API

If you have API access, you can get it programmatically, but this is usually not necessary.

### Option C: Create a Fresh Project

1. Delete the old project (if you want)
2. Create a new one
3. The DSN will be shown immediately

---

## Quick Visual Guide

```
Sentry Dashboard
  └── Your Project (click it)
      └── Settings (gear icon or sidebar)
          └── Client Keys (DSN)
              └── [Copy the DSN here]
```

Or:

```
Create Project
  └── Select "Node.js"
      └── Name it
          └── Create
              └── [DSN shown on next page]
```

---

## Once You Have It

1. **Copy the DSN** (the full URL)
2. **Open** `backend/.env` file
3. **Add this line**:
   ```bash
   SENTRY_DSN=https://your-copied-dsn-here@sentry.io/project-id
   ```
4. **Save the file**
5. **Restart your backend**

---

## Need More Help?

- **Sentry Docs**: [docs.sentry.io/platforms/node/](https://docs.sentry.io/platforms/node/)
- **Sentry Support**: Check their help center or community forum

---

**Tip**: The DSN is just a URL that tells your app where to send error reports. It's safe to share (but don't commit it to public repos).

