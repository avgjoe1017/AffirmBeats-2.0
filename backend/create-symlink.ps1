# Create symlink to shared directory
# This script creates a symbolic link from backend/shared to ../shared

$ErrorActionPreference = "Stop"

try {
    # Get the directory where this script is located
    $scriptPath = $MyInvocation.MyCommand.Path
    if (-not $scriptPath) {
        # Fallback if script path is not available
        $scriptPath = $PSScriptRoot
        if (-not $scriptPath) {
            $scriptPath = Get-Location
        }
    }
    
    $backendDir = Split-Path -Parent $scriptPath
    $sharedDir = Join-Path (Split-Path -Parent $backendDir) "shared"
    $symlinkPath = Join-Path $backendDir "shared"
    
    Write-Host "Backend directory: $backendDir"
    Write-Host "Shared directory (target): $sharedDir"
    Write-Host "Symlink path: $symlinkPath"
    Write-Host ""
    
    # Check if target shared directory exists
    if (-not (Test-Path $sharedDir)) {
        Write-Error "Target directory does not exist: $sharedDir"
        exit 1
    }
    
    # Remove existing symlink or directory if it exists
    if (Test-Path $symlinkPath) {
        Write-Host "Removing existing shared directory or symlink..."
        $item = Get-Item $symlinkPath
        if ($item.LinkType -eq "SymbolicLink") {
            Remove-Item $symlinkPath -Force -ErrorAction Stop
        } else {
            Remove-Item $symlinkPath -Force -Recurse -ErrorAction Stop
        }
        Write-Host "Removed successfully."
    }
    
    # Create the symbolic link
    Write-Host "Creating symbolic link..."
    $target = Resolve-Path $sharedDir
    New-Item -ItemType SymbolicLink -Path $symlinkPath -Target $target -ErrorAction Stop | Out-Null
    
    Write-Host ""
    Write-Host "✓ Symlink created successfully!" -ForegroundColor Green
    Write-Host "  $symlinkPath -> $target"
    
} catch {
    Write-Host ""
    Write-Host "✗ Error creating symlink:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Note: Creating symbolic links requires administrator privileges on Windows." -ForegroundColor Yellow
    Write-Host "Try running PowerShell as Administrator, or enable Developer Mode in Windows Settings." -ForegroundColor Yellow
    exit 1
}

