# Audio Optimization Conversion Script (PowerShell)
# Converts large WAV files (600+ MB) to optimized 3-minute AAC loops (2-5 MB)
#
# Prerequisites:
# - ffmpeg installed and in PATH
# - Run from the project root directory

$ErrorActionPreference = "Stop"

# Parse arguments first - check for ffmpeg path argument
$ffmpegPathArg = $null
foreach ($arg in $args) {
    if ($arg -like "*ffmpeg*") {
        $ffmpegPathArg = $arg
        break
    }
}

# Check if ffmpeg is installed
$ffmpegPath = Get-Command ffmpeg -ErrorAction SilentlyContinue

# If not in PATH, check for custom path parameter or common download locations
if (-not $ffmpegPath) {
    $customFfmpegPath = $null
    
    # Check for command line argument
    if ($ffmpegPathArg) {
        $possiblePaths = @(
            $ffmpegPathArg,
            (Join-Path $ffmpegPathArg "bin\ffmpeg.exe"),
            (Join-Path $ffmpegPathArg "ffmpeg.exe")
        )
        foreach ($testPath in $possiblePaths) {
            if (Test-Path $testPath) {
                $customFfmpegPath = $testPath
                break
            }
        }
    }
    
    # Check common download locations
    if (-not $customFfmpegPath) {
        $commonPaths = @(
            "C:\Users\joeba\Downloads\ffmpeg-2025-04-17-git-7684243fbe-full_build\ffmpeg-2025-04-17-git-7684243fbe-full_build\bin\ffmpeg.exe",
            "C:\Users\joeba\Downloads\ffmpeg-2025-04-17-git-7684243fbe-full_build\bin\ffmpeg.exe",
            "C:\Users\joeba\Downloads\ffmpeg-8.0\bin\ffmpeg.exe",
            "C:\Users\joeba\Downloads\ffmpeg-8.0\ffmpeg.exe",
            "C:\Users\joeba\Downloads\ffmpeg-8.0\ffmpeg-8.0\bin\ffmpeg.exe",
            "C:\ffmpeg\bin\ffmpeg.exe",
            "C:\ffmpeg\ffmpeg.exe"
        )
        foreach ($testPath in $commonPaths) {
            if (Test-Path $testPath) {
                $customFfmpegPath = $testPath
                break
            }
        }
        
        # Also check for nested directories (common with extracted archives)
        if (-not $customFfmpegPath) {
            $downloadDirs = @(
                "C:\Users\joeba\Downloads\ffmpeg-2025-04-17-git-7684243fbe-full_build",
                "C:\Users\joeba\Downloads\ffmpeg-8.0"
            )
            foreach ($dir in $downloadDirs) {
                if (Test-Path $dir) {
                    $nestedDirs = Get-ChildItem $dir -Directory -ErrorAction SilentlyContinue
                    foreach ($nested in $nestedDirs) {
                        $testExe = Join-Path $nested.FullName "bin\ffmpeg.exe"
                        if (Test-Path $testExe) {
                            $customFfmpegPath = $testExe
                            break
                        }
                    }
                    if ($customFfmpegPath) { break }
                }
            }
        }
    }
    
    if ($customFfmpegPath) {
        # Ensure we have a file, not a directory
        if ((Get-Item $customFfmpegPath).PSIsContainer) {
            # If it's a directory, try to find ffmpeg.exe inside
            $exePath = Join-Path $customFfmpegPath "bin\ffmpeg.exe"
            if (-not (Test-Path $exePath)) {
                $exePath = Join-Path $customFfmpegPath "ffmpeg.exe"
            }
            if (Test-Path $exePath) {
                $ffmpegPath = Get-Item $exePath
            } else {
                $ffmpegPath = Get-Item $customFfmpegPath
            }
        } else {
            $ffmpegPath = Get-Item $customFfmpegPath
        }
        Write-Host "Using ffmpeg at: $($ffmpegPath.FullName)" -ForegroundColor Yellow
    } else {
        Write-Host "Error: ffmpeg is not installed or not in PATH." -ForegroundColor Red
        Write-Host ""
        Write-Host "Please install ffmpeg using one of these methods:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Option 1: Download from https://ffmpeg.org/download.html" -ForegroundColor Cyan
        Write-Host "  - Extract to a folder (e.g., C:\ffmpeg)"
        Write-Host "  - Add the bin folder to your PATH environment variable"
        Write-Host "  - Restart PowerShell/terminal"
        Write-Host ""
        Write-Host "Option 2: Use Chocolatey (if installed)" -ForegroundColor Cyan
        Write-Host "  choco install ffmpeg"
        Write-Host ""
        Write-Host "Option 3: Use winget (Windows 10/11)" -ForegroundColor Cyan
        Write-Host "  winget install -e --id Gyan.FFmpeg"
        Write-Host ""
        Write-Host "Option 4: Provide path as argument" -ForegroundColor Cyan
        Write-Host "  .\scripts\convert-audio.ps1 `"C:\path\to\ffmpeg\directory`""
        Write-Host ""
        exit 1
    }
}

# Get ffmpeg executable path
if ($ffmpegPath.Source) {
    $ffmpegExe = $ffmpegPath.Source
} elseif ($ffmpegPath.FullName) {
    $ffmpegExe = $ffmpegPath.FullName
    # If it's a directory, find ffmpeg.exe inside (check multiple levels for nested archives)
    if ((Get-Item $ffmpegExe -ErrorAction SilentlyContinue).PSIsContainer) {
        $searchPaths = @(
            (Join-Path $ffmpegExe "bin\ffmpeg.exe"),
            (Join-Path $ffmpegExe "ffmpeg.exe"),
            (Join-Path $ffmpegExe (Split-Path $ffmpegExe -Leaf) "bin\ffmpeg.exe")
        )
        $found = $false
        foreach ($testExe in $searchPaths) {
            if (Test-Path $testExe) {
                $ffmpegExe = $testExe
                $found = $true
                break
            }
        }
        # Also check nested subdirectories
        if (-not $found) {
            $subDirs = Get-ChildItem $ffmpegExe -Directory -ErrorAction SilentlyContinue
            foreach ($subDir in $subDirs) {
                $testExe = Join-Path $subDir.FullName "bin\ffmpeg.exe"
                if (Test-Path $testExe) {
                    $ffmpegExe = $testExe
                    $found = $true
                    break
                }
            }
        }
        if (-not $found) {
            Write-Host "Error: Could not find ffmpeg.exe in directory: $ffmpegExe" -ForegroundColor Red
            Write-Host "Please ensure ffmpeg is extracted and ffmpeg.exe exists in the directory or bin subdirectory." -ForegroundColor Yellow
            exit 1
        }
    }
} else {
    $ffmpegExe = $ffmpegPath
}

Write-Host "ffmpeg found at: $ffmpegExe" -ForegroundColor Green
Write-Host ""

# Set up directories
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR
$OUTPUT_DIR = Join-Path $PROJECT_ROOT "assets\audio"
$BINAURAL_DIR = Join-Path $OUTPUT_DIR "binaural"
$SOLFEGGIO_DIR = Join-Path $OUTPUT_DIR "solfeggio"
$BACKGROUND_DIR = Join-Path $OUTPUT_DIR "background"

# Create output directories
if (-not (Test-Path $BINAURAL_DIR)) {
    New-Item -ItemType Directory -Path $BINAURAL_DIR -Force | Out-Null
}
if (-not (Test-Path $SOLFEGGIO_DIR)) {
    New-Item -ItemType Directory -Path $SOLFEGGIO_DIR -Force | Out-Null
}
if (-not (Test-Path $BACKGROUND_DIR)) {
    New-Item -ItemType Directory -Path $BACKGROUND_DIR -Force | Out-Null
}

Write-Host "Audio Optimization Conversion Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output directory: $OUTPUT_DIR" -ForegroundColor Cyan
Write-Host ""

# Get the directory containing raw audio files
$RAW_AUDIO_DIR = Join-Path $PROJECT_ROOT "raw audio files"

# Handle arguments - check for raw audio directory argument
$rawAudioPathArg = $null
foreach ($arg in $args) {
    if ($arg -notlike "*ffmpeg*") {
        $rawAudioPathArg = $arg
        break
    }
}

if (-not (Test-Path $RAW_AUDIO_DIR) -and $rawAudioPathArg) {
    $RAW_AUDIO_DIR = $rawAudioPathArg
    Write-Host "Using provided raw audio directory: $RAW_AUDIO_DIR" -ForegroundColor Cyan
} elseif (-not (Test-Path $RAW_AUDIO_DIR)) {
    Write-Host "Warning: Raw audio files directory not found: $RAW_AUDIO_DIR" -ForegroundColor Yellow
    Write-Host "Error: No input directory specified." -ForegroundColor Red
    exit 1
}

$BINAURAL_SOURCE_DIR = Join-Path $RAW_AUDIO_DIR "ZENmix - Pure Binaural Beats"
$SOLFEGGIO_SOURCE_DIR = Join-Path $RAW_AUDIO_DIR "ZENmix - Pure Solfeggio"

Write-Host "Source directories:" -ForegroundColor Cyan
Write-Host "  Binaural: $BINAURAL_SOURCE_DIR"
Write-Host "  Solfeggio: $SOLFEGGIO_SOURCE_DIR"
Write-Host ""

# Function to sanitize filename (remove special chars, replace spaces with underscores)
function Get-SanitizedFileName {
    param([string]$FileName)
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
    # Remove special characters, keep alphanumeric, spaces, hyphens, underscores
    $sanitized = $baseName -replace '[^\w\s-]', '' -replace '\s+', '_' -replace '_+', '_'
    return $sanitized.ToLower()
}

# Function to convert a single file
function Convert-File {
    param(
        [string]$InputFile,
        [string]$OutputFile,
        [string]$Category
    )
    
    if (-not (Test-Path $InputFile)) {
        Write-Host "Warning: Input file not found: $InputFile" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "Converting: $(Split-Path -Leaf $InputFile)" -ForegroundColor Cyan
    Write-Host "  → $(Split-Path -Leaf $OutputFile)" -ForegroundColor Gray
    
    try {
        # Run ffmpeg conversion (works with both WAV and MP3 input)
        $ffmpegArgs = @(
            "-y",
            "-i", "`"$InputFile`"",
            "-ac", "2",
            "-ar", "44100",
            "-c:a", "aac",
            "-b:a", "128k",
            "-t", "180",
            "`"$OutputFile`""
        )
        
        # Create temp files for output redirection (required by Start-Process)
        $tempOut = [System.IO.Path]::GetTempFileName()
        $tempErr = [System.IO.Path]::GetTempFileName()
        
        $process = Start-Process -FilePath $ffmpegExe -ArgumentList $ffmpegArgs -Wait -NoNewWindow -PassThru -RedirectStandardOutput $tempOut -RedirectStandardError $tempErr
        
        # Clean up temp files
        Remove-Item $tempOut -ErrorAction SilentlyContinue
        Remove-Item $tempErr -ErrorAction SilentlyContinue
        
        if ($process.ExitCode -eq 0 -and (Test-Path $OutputFile)) {
            $fileSize = (Get-Item $OutputFile).Length
            $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
            Write-Host "  ✓ Created: $(Split-Path -Leaf $OutputFile) ($fileSizeMB MB)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ✗ Failed to create: $OutputFile" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
        return $false
    }
}

# Convert Binaural Beats
$binauralFiles = @(
    @{ Input = "Binaural Beat - Alpha@10Hz - 400Hz Base.wav"; Output = "alpha_10hz_400_3min.m4a"; Category = "alpha" },
    @{ Input = "Binaural Beat - Alpha@12Hz - 120Hz Base.wav"; Output = "alpha_12hz_120_3min.m4a"; Category = "alpha" },
    @{ Input = "Binaural Beat - Beta@13Hz - 400Hz Base.wav"; Output = "beta_13hz_400_3min.m4a"; Category = "beta" },
    @{ Input = "Binaural Beat - Beta@20Hz - 120Hz Base.wav"; Output = "beta_20hz_120_3min.m4a"; Category = "beta" },
    @{ Input = "Binaural Beat - Delta@1Hz - 100Hz Base.wav"; Output = "delta_1hz_100_3min.m4a"; Category = "delta" },
    @{ Input = "Binaural Beat - Delta@2Hz - 120Hz Base.wav"; Output = "delta_2hz_120_3min.m4a"; Category = "delta" },
    @{ Input = "Binaural Beat - Delta@4Hz - 400Hz Base.wav"; Output = "delta_4hz_400_3min.m4a"; Category = "delta" },
    @{ Input = "Binaural Beat - Gamma@38Hz - 100Hz Base.wav"; Output = "gamma_38hz_100_3min.m4a"; Category = "gamma" },
    @{ Input = "Binaural Beat - Gamma@40Hz - 120Hz Base.wav"; Output = "gamma_40hz_120_3min.m4a"; Category = "gamma" },
    @{ Input = "Binaural Beat - Gamma@42Hz - 400Hz Base.wav"; Output = "gamma_42hz_400_3min.m4a"; Category = "gamma" },
    @{ Input = "Binaural Beat - Theta@4Hz - 400Hz Base.wav"; Output = "theta_4hz_400_3min.m4a"; Category = "theta" },
    @{ Input = "Binaural Beat - Theta@8Hz - 120Hz Base.wav"; Output = "theta_8hz_120_3min.m4a"; Category = "theta" }
)

if (Test-Path $BINAURAL_SOURCE_DIR) {
    Write-Host "Converting Binaural Beats..." -ForegroundColor Green
    Write-Host ""
    
    $successCount = 0
    foreach ($file in $binauralFiles) {
        $inputPath = Join-Path $BINAURAL_SOURCE_DIR $file.Input
        $outputPath = Join-Path $BINAURAL_DIR $file.Output
        if (Convert-File -InputFile $inputPath -OutputFile $outputPath -Category $file.Category) {
            $successCount++
        }
    }
    
    Write-Host "Binaural beats: $successCount/$($binauralFiles.Count) files converted" -ForegroundColor $(if ($successCount -eq $binauralFiles.Count) { "Green" } else { "Yellow" })
} else {
    Write-Host "Warning: Binaural beats directory not found: $BINAURAL_SOURCE_DIR" -ForegroundColor Yellow
}

Write-Host ""

# Convert Solfeggio Tones
$solfeggioFiles = @(
    @{ Input = "Solfeggio 174hz.wav"; Output = "solfeggio_174_3min.m4a" },
    @{ Input = "Solfeggio 285hz.wav"; Output = "solfeggio_285_3min.m4a" },
    @{ Input = "Solfeggio 396hz.wav"; Output = "solfeggio_396_3min.m4a" },
    @{ Input = "Solfeggio 40hz.wav"; Output = "solfeggio_40_3min.m4a" },
    @{ Input = "Solfeggio 417hz.wav"; Output = "solfeggio_417_3min.m4a" },
    @{ Input = "Solfeggio 432hz.wav"; Output = "solfeggio_432_3min.m4a" },
    @{ Input = "Solfeggio 528hz.wav"; Output = "solfeggio_528_3min.m4a" },
    @{ Input = "Solfeggio 639hz.wav"; Output = "solfeggio_639_3min.m4a" },
    @{ Input = "Solfeggio 741hz.wav"; Output = "solfeggio_741_3min.m4a" },
    @{ Input = "Solfeggio 852hz.wav"; Output = "solfeggio_852_3min.m4a" },
    @{ Input = "Solfeggio 963hz.wav"; Output = "solfeggio_963_3min.m4a" }
)

if (Test-Path $SOLFEGGIO_SOURCE_DIR) {
    Write-Host "Converting Solfeggio Tones..." -ForegroundColor Green
    Write-Host ""
    
    $successCount = 0
    foreach ($file in $solfeggioFiles) {
        $inputPath = Join-Path $SOLFEGGIO_SOURCE_DIR $file.Input
        $outputPath = Join-Path $SOLFEGGIO_DIR $file.Output
        if (Convert-File -InputFile $inputPath -OutputFile $outputPath -Category "solfeggio") {
            $successCount++
        }
    }
    
    Write-Host "Solfeggio tones: $successCount/$($solfeggioFiles.Count) files converted" -ForegroundColor $(if ($successCount -eq $solfeggioFiles.Count) { "Green" } else { "Yellow" })
} else {
    Write-Host "Warning: Solfeggio directory not found: $SOLFEGGIO_SOURCE_DIR" -ForegroundColor Yellow
}

Write-Host ""

# Convert Background Music and Ambient Sounds
$backgroundDirs = @(
    @{ Name = "ZENmix - Postive Flow"; Output = "positive_flow" },
    @{ Name = "ZENmix - Dreamscape"; Output = "dreamscape" },
    @{ Name = "ZENmix - Ancient Healing"; Output = "ancient_healing" },
    @{ Name = "ZENmix - Roots"; Output = "roots" }
)

foreach ($bgDir in $backgroundDirs) {
    $sourceDir = Join-Path $RAW_AUDIO_DIR $bgDir.Name
    $outputSubDir = Join-Path $BACKGROUND_DIR $bgDir.Output
    
    if (-not (Test-Path $outputSubDir)) {
        New-Item -ItemType Directory -Path $outputSubDir -Force | Out-Null
    }
    
    if (Test-Path $sourceDir) {
        Write-Host "Converting $($bgDir.Name)..." -ForegroundColor Green
        Write-Host ""
        
        $mp3Files = Get-ChildItem -Path $sourceDir -Filter "*.mp3" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "__MACOSX*" -and $_.Name -ne "License.txt" }
        
        if ($mp3Files) {
            $successCount = 0
            foreach ($file in $mp3Files) {
                $sanitizedName = Get-SanitizedFileName $file.Name
                $outputFile = Join-Path $outputSubDir "$sanitizedName`_3min.m4a"
                
                if (Convert-File -InputFile $file.FullName -OutputFile $outputFile -Category $bgDir.Output) {
                    $successCount++
                }
            }
            
            Write-Host "$($bgDir.Name): $successCount/$($mp3Files.Count) files converted" -ForegroundColor $(if ($successCount -eq $mp3Files.Count) { "Green" } else { "Yellow" })
        } else {
            Write-Host "Warning: No MP3 files found in: $sourceDir" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Warning: Directory not found: $sourceDir" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host "=====================================" -ForegroundColor Green
Write-Host "Conversion Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Optimized files are in: $OUTPUT_DIR" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify all files were created successfully"
Write-Host "2. Test audio playback in the app"
Write-Host "3. Verify file sizes are 2-5 MB (not 600+ MB)"
Write-Host ""

