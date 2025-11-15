# Audio Conversion Scripts

## Overview

These scripts convert large WAV audio files (600+ MB) to optimized 3-minute AAC loops (2-5 MB) for mobile app use.

## Prerequisites

1. **ffmpeg** installed and in PATH
   - macOS: `brew install ffmpeg`
   - Windows: Download from https://ffmpeg.org/download.html
   - Linux: `sudo apt-get install ffmpeg`

2. **Source Files**: Original WAV files in `raw audio files/` directory
   - `ZENmix - Pure Binaural Beats/` - Binaural beat files
   - `ZENmix - Pure Solfeggio/` - Solfeggio frequency files

## Usage

### macOS / Linux

```bash
chmod +x scripts/convert-audio.sh
./scripts/convert-audio.sh
```

Or specify a custom input directory:

```bash
./scripts/convert-audio.sh /path/to/raw/audio/files
```

### Windows

```batch
scripts\convert-audio.bat
```

Or specify a custom input directory:

```batch
scripts\convert-audio.bat "C:\path\to\raw\audio\files"
```

## Output

Optimized files will be created in:
- `assets/audio/binaural/` - Binaural beat files (3-minute AAC loops)
- `assets/audio/solfeggio/` - Solfeggio frequency files (3-minute AAC loops)

## File Format

- **Format**: AAC in M4A container
- **Duration**: 180 seconds (3 minutes)
- **Channels**: Stereo (2)
- **Sample Rate**: 44.1 kHz
- **Bitrate**: 128 kbps
- **Size**: 2-5 MB per file (vs 600+ MB for original WAV)

## Next Steps

After running the conversion script:

1. Verify all files were created successfully
2. Update `src/utils/audioFiles.ts` to use optimized file names
3. Test audio playback in the app
4. Update backend to serve optimized files (if using backend serving)
5. Remove references to old 600MB+ WAV files

## Troubleshooting

### ffmpeg not found

Install ffmpeg:
- macOS: `brew install ffmpeg`
- Windows: Download from https://ffmpeg.org/download.html
- Linux: `sudo apt-get install ffmpeg`

### Input files not found

Make sure the source files are in the correct directory:
- `raw audio files/ZENmix - Pure Binaural Beats/`
- `raw audio files/ZENmix - Pure Solfeggio/`

Or specify a custom input directory as an argument.

### Conversion fails

Check that:
1. Source files exist and are readable
2. Output directory is writable
3. ffmpeg has proper codec support (AAC encoder)

## Manual Conversion

If you prefer to convert files manually, use these ffmpeg commands:

```bash
# Example: Convert Delta 4Hz binaural beat
ffmpeg -y \
  -i "Binaural Beat - Delta@4Hz - 400Hz Base.wav" \
  -ac 2 \
  -ar 44100 \
  -c:a aac \
  -b:a 128k \
  -t 180 \
  "../assets/audio/binaural/delta_4hz_400_3min.m4a"
```

See `MD_DOCS/AUDIO_OPTIMIZATION.md` for complete conversion instructions.

