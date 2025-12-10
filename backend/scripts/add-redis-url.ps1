# Add Redis URL to .env file

$redisUrl = "rediss://default:ARemAAImcDJiMzQ5YTdjYzUzZWM0Zjk0OWM0MzdmNzBlYWM3ZmUxMXAyNjA1NA@positive-clam-6054.upstash.io:6379"
$envFile = Join-Path $PSScriptRoot ".." ".env"

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    if ($content -notmatch "REDIS_URL") {
        Add-Content $envFile "`n# Redis Configuration`nREDIS_URL=$redisUrl"
        Write-Host "✅ Added REDIS_URL to .env file" -ForegroundColor Green
        Write-Host "   URL: rediss://default:***@positive-clam-6054.upstash.io:6379" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ REDIS_URL already exists in .env file" -ForegroundColor Yellow
        Write-Host "Please update it manually or remove the old line first" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
}

