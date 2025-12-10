# Redis Setup Checker
# Checks if Redis is configured

Write-Host "🔍 Checking Redis Configuration..." -ForegroundColor Cyan
Write-Host ""

$envFile = Join-Path $PSScriptRoot ".." ".env"

if (Test-Path $envFile) {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    $envContent = Get-Content $envFile -Raw
    
    if ($envContent -match "REDIS_URL\s*=\s*(rediss?://[^\s]+)") {
        $redisUrl = $matches[1]
        Write-Host "✅ REDIS_URL is configured" -ForegroundColor Green
        
        # Mask password in URL for display
        $maskedUrl = $redisUrl -replace "://[^:]+:([^@]+)@", "://***:***@"
        Write-Host "   URL: $maskedUrl" -ForegroundColor Gray
        
        # Check if using SSL
        if ($redisUrl -match "rediss://") {
            Write-Host "✅ Using SSL/TLS (rediss://)" -ForegroundColor Green
        } elseif ($redisUrl -match "redis://") {
            Write-Host "⚠️  Using non-SSL (redis://) - Consider using rediss:// for production" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "✅ Redis is configured!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Restart your backend server" -ForegroundColor White
        Write-Host "2. Check logs for 'Redis connected' message" -ForegroundColor White
        Write-Host "3. Run: bun run test:qa" -ForegroundColor White
        Write-Host "4. Check: curl http://localhost:3000/health" -ForegroundColor White
    } else {
        Write-Host "❌ REDIS_URL not found in .env file" -ForegroundColor Red
        Write-Host ""
        Write-Host "To set up Redis:" -ForegroundColor Cyan
        Write-Host "1. Get Redis URL from Upstash or Redis Cloud" -ForegroundColor White
        Write-Host "2. Add to .env file:" -ForegroundColor White
        Write-Host "   REDIS_URL=rediss://default:password@host:port" -ForegroundColor Gray
        Write-Host ""
        Write-Host "See: MD_DOCS/REDIS_QUICK_SETUP.md for detailed instructions" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ .env file does not exist" -ForegroundColor Red
    Write-Host ""
    Write-Host "To create .env file:" -ForegroundColor Cyan
    Write-Host "1. Copy .env.example to .env:" -ForegroundColor White
    Write-Host "   Copy-Item .env.example .env" -ForegroundColor Gray
    Write-Host "2. Edit .env and add your Redis URL" -ForegroundColor White
    Write-Host ""
    Write-Host "See: MD_DOCS/REDIS_QUICK_SETUP.md for detailed instructions" -ForegroundColor Cyan
}

Write-Host ""

