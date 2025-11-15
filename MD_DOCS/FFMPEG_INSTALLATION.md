# FFmpeg Installation Guide

## Overview

FFmpeg is required to convert large WAV audio files (600+ MB) to optimized 3-minute AAC loops (2-5 MB). This guide provides step-by-step instructions for installing FFmpeg on Windows.

## Installation Methods

### Method 1: Download and Install (Recommended)

1. **Download FFmpeg:**
   - Visit https://ffmpeg.org/download.html
   - Click on "Windows" → "Windows builds by BtbN" or "Windows builds by gyan.dev"
   - Download the latest release (e.g., `ffmpeg-release-essentials.zip`)

2. **Extract FFmpeg:**
   - Extract the ZIP file to a folder (e.g., `C:\ffmpeg`)
   - You should have a folder structure like:
     ```
     C:\ffmpeg\
       bin\
         ffmpeg.exe
         ffprobe.exe
         ...
     ```

3. **Add to PATH:**
   - Open "System Properties" → "Environment Variables"
   - Under "System variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\ffmpeg\bin`
   - Click "OK" to save

4. **Verify Installation:**
   - Open a new PowerShell/Command Prompt window
   - Run: `ffmpeg -version`
   - You should see FFmpeg version information

### Method 2: Using Chocolatey (if installed)

If you have Chocolatey installed:

```powershell
choco install ffmpeg
```

### Method 3: Using winget (Windows 10/11)

If you have winget installed:

```powershell
winget install -e --id Gyan.FFmpeg
```

## Verification

After installation, verify FFmpeg is working:

```powershell
ffmpeg -version
```

You should see output like:
```
ffmpeg version 6.x.x
Copyright (c) 2000-2023 the FFmpeg developers
...
```

## Running the Conversion Script

Once FFmpeg is installed, run the conversion script:

### PowerShell (Recommended):
```powershell
.\scripts\convert-audio.ps1
```

### Command Prompt:
```batch
scripts\convert-audio.bat
```

### Bash (Git Bash / WSL):
```bash
./scripts/convert-audio.sh
```

## Troubleshooting

### FFmpeg not found in PATH

If you get an error that FFmpeg is not found:

1. **Verify FFmpeg is installed:**
   - Check that `ffmpeg.exe` exists in the installation directory
   - Try running `C:\ffmpeg\bin\ffmpeg.exe -version` directly

2. **Check PATH:**
   - Run: `$env:Path -split ';' | Select-String ffmpeg`
   - If nothing is found, FFmpeg is not in PATH

3. **Restart Terminal:**
   - Close and reopen PowerShell/Command Prompt after adding to PATH
   - Environment variables are loaded when the terminal starts

### Permission Issues

If you get permission errors:

1. **Run as Administrator:**
   - Right-click PowerShell/Command Prompt
   - Select "Run as Administrator"

2. **Check Folder Permissions:**
   - Ensure you have write permissions to `assets\audio\` directory

### Conversion Fails

If conversion fails:

1. **Check Source Files:**
   - Verify source WAV files exist in `raw audio files\` directory
   - Check file names match exactly (case-sensitive)

2. **Check Disk Space:**
   - Ensure you have enough disk space (optimized files are 2-5 MB each)

3. **Check FFmpeg Codecs:**
   - Run: `ffmpeg -codecs | Select-String aac`
   - AAC codec should be listed

## Alternative: Manual Conversion

If the script doesn't work, you can convert files manually:

```powershell
# Example: Convert Delta 4Hz binaural beat
ffmpeg -y `
  -i "raw audio files\ZENmix - Pure Binaural Beats\Binaural Beat - Delta@4Hz - 400Hz Base.wav" `
  -ac 2 `
  -ar 44100 `
  -c:a aac `
  -b:a 128k `
  -t 180 `
  "assets\audio\binaural\delta_4hz_400_3min.m4a"
```

Repeat for each file (see `MD_DOCS/AUDIO_OPTIMIZATION.md` for complete list).

## Next Steps

After FFmpeg is installed:

1. Run the conversion script
2. Verify optimized files are created (2-5 MB each)
3. Test audio playback in the app
4. Verify fast loading times (< 1 second)

## Support

For more information:
- FFmpeg Documentation: https://ffmpeg.org/documentation.html
- Audio Optimization Guide: `MD_DOCS/AUDIO_OPTIMIZATION.md`
- Conversion Scripts: `scripts/convert-audio.ps1` or `scripts/convert-audio.bat`

