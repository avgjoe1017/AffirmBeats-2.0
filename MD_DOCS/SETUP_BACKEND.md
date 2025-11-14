# Backend Setup Guide

## Installing Bun (Required)

The backend uses **Bun** as the runtime. You need to install it first.

### Windows Installation

**Option 1: Using PowerShell (Recommended)**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**Option 2: Using npm (if you have Node.js installed)**
```bash
npm install -g bun
```

**Option 3: Using Scoop (if you use Scoop package manager)**
```bash
scoop install bun
```

**Option 4: Download installer**
- Visit https://bun.sh
- Download the Windows installer
- Run the installer

### Verify Installation

After installing, verify it works:
```bash
bun --version
```

You should see a version number like `1.1.0` or similar.

### If Bun is still not recognized

1. **Restart your terminal** - PATH changes require a new terminal session
2. **Check PATH** - Make sure Bun's bin directory is in your PATH
3. **Try full path** - Use the full path to bun.exe (usually in `%USERPROFILE%\.bun\bin\bun.exe`)

## Running the Backend

Once Bun is installed:

```bash
cd backend
bun run dev
```

This will:
- Start the server on port 3000 (or PORT from .env)
- Enable hot reload for development
- Show server logs in the console

## Alternative: Using Node.js (Not Recommended)

If you prefer to use Node.js instead of Bun, you'll need to:

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Modify scripts** in `package.json` to use `node` instead of `bun`:
   ```json
   "dev": "NODE_ENV=development node --loader ts-node/esm src/index.ts"
   ```

3. **Install additional packages:**
   ```bash
   npm install --save-dev ts-node @types/node
   ```

**Note:** Bun is recommended because:
- Faster startup time
- Built-in TypeScript support
- Better performance
- Simpler configuration

## Troubleshooting

### "bun is not recognized"
- Install Bun (see above)
- Restart your terminal
- Verify with `bun --version`

### Port already in use
- Change PORT in `.env` file
- Or stop the process using port 3000

### Database errors
- Run `bun run postinstall` to generate Prisma client
- Check `prisma/dev.db` exists

### Module not found errors
- Run `bun install` in the backend directory
- Check `node_modules` exists

