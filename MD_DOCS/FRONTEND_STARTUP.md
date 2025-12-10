# Frontend Startup Guide

## Starting the Frontend

The frontend uses Expo. You have a few options:

### Option 1: Using bunx (Recommended)
```powershell
cd "C:\Users\joeba\Documents\AffirmBeats 2.0"
bunx expo start
```

### Option 2: Install dependencies first, then use npx
```powershell
cd "C:\Users\joeba\Documents\AffirmBeats 2.0"
bun install
npx expo start
```

### Option 3: Install Expo CLI globally (optional)
```powershell
npm install -g expo-cli
# Then you can use: expo start
```

## If Dependencies Aren't Installed

If you see module not found errors, install dependencies:

```powershell
cd "C:\Users\joeba\Documents\AffirmBeats 2.0"
bun install
```

This will install all frontend dependencies including Expo.

## What to Expect

After running `bunx expo start` or `npx expo start`, you'll see:

1. **Metro bundler starting** - Building the JavaScript bundle
2. **QR code** - For scanning with Expo Go app
3. **Options menu:**
   - Press `a` - Open Android emulator
   - Press `i` - Open iOS simulator  
   - Press `w` - Open in web browser
   - Press `r` - Reload app
   - Press `m` - Toggle menu

## Troubleshooting

### "expo: command not found"
- Use `bunx expo start` instead of `expo start`
- Or install dependencies: `bun install`

### "Cannot find module"
- Run `bun install` to install all dependencies
- Wait for installation to complete

### Port already in use
- Change port: `bunx expo start --port 8082`
- Or stop the process using port 8081

### Backend connection errors
- Verify backend is running on `http://localhost:3000`
- Check `EXPO_PUBLIC_BACKEND_URL` in root `.env` file

## Quick Start Command

```powershell
# Make sure you're in project root
cd "C:\Users\joeba\Documents\AffirmBeats 2.0"

# Install dependencies (first time only)
bun install

# Start Expo
bunx expo start
```

Then press `w` to open in web browser, or scan QR code with Expo Go app.







