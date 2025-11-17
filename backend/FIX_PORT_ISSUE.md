# Fix Port 3000 Issue

## Quick Fix Options

### Option 1: Kill Process on Port 3000 (Windows PowerShell)

```powershell
# Find process using port 3000
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "Killed process on port 3000"
} else {
    Write-Host "No process found on port 3000"
}
```

### Option 2: Use Different Port

Change `.env` file:
```
PORT=3001
```

Or set environment variable:
```powershell
$env:PORT=3001
bun run dev
```

### Option 3: Check What's Using Port 3000

```powershell
Get-NetTCPConnection -LocalPort 3000 | Format-Table -AutoSize
```

## Why This Happens

- Previous server instance didn't shut down cleanly
- Another application is using port 3000
- Multiple terminal windows running servers

## Prevention

Always use `Ctrl+C` to stop the server gracefully, or use:
```powershell
# Find and kill all bun/node processes on port 3000
Get-Process | Where-Object {$_.ProcessName -like "*bun*" -or $_.ProcessName -like "*node*"} | Stop-Process -Force
```

