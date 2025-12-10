# Quick connectivity check script
Write-Host "Checking backend connectivity..." -ForegroundColor Cyan

# Check if port 3000 is listening
Write-Host "`n1. Checking if port 3000 is listening..." -ForegroundColor Yellow
$listening = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    Write-Host "   ✓ Port 3000 is listening on:" -ForegroundColor Green
    $listening | ForEach-Object {
        Write-Host "     - $($_.LocalAddress):$($_.LocalPort)" -ForegroundColor Green
    }
} else {
    Write-Host "   ✗ Port 3000 is NOT listening!" -ForegroundColor Red
    Write-Host "     Start the backend: cd backend && bun run src/index.ts" -ForegroundColor Yellow
    exit 1
}

# Test localhost connection
Write-Host "`n2. Testing localhost:3000..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✓ localhost:3000 is responding (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ✗ localhost:3000 is NOT responding!" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Get network IPs
Write-Host "`n3. Finding network IP addresses..." -ForegroundColor Yellow
$networkIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    -not $_.IPAddress.StartsWith("169.254")
} | Select-Object -ExpandProperty IPAddress

if ($networkIPs) {
    Write-Host "   Found network IPs:" -ForegroundColor Green
    foreach ($ip in $networkIPs) {
        Write-Host "     - $ip" -ForegroundColor Cyan
        Write-Host "       Testing http://${ip}:3000/health..." -ForegroundColor Gray
        try {
            $response = Invoke-WebRequest -Uri "http://${ip}:3000/health" -UseBasicParsing -TimeoutSec 5
            Write-Host "       ✓ Responding (Status: $($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "       ✗ NOT responding - Check Windows Firewall!" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ✗ No network IPs found!" -ForegroundColor Red
}

# Check Windows Firewall
Write-Host "`n4. Checking Windows Firewall rules for port 3000..." -ForegroundColor Yellow
$firewallRules = Get-NetFirewallRule | Where-Object { 
    $_.DisplayName -like "*3000*" -or 
    $_.DisplayName -like "*backend*" 
} | Select-Object DisplayName, Enabled, Direction, Action

if ($firewallRules) {
    Write-Host "   Found firewall rules:" -ForegroundColor Cyan
    $firewallRules | Format-Table -AutoSize
} else {
    Write-Host "   ⚠ No specific firewall rules found for port 3000" -ForegroundColor Yellow
    Write-Host "   You may need to allow port 3000 in Windows Firewall" -ForegroundColor Yellow
}

Write-Host "`nDone!" -ForegroundColor Cyan

