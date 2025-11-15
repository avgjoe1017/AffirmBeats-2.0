# Audio Optimization Guide

## Overview

The original binaural and solfeggio audio files are 600+ MB each (.wav), which makes them slow to load and impractical for mobile.

For our use case (steady-state binaural beats and solfeggio tones), we don't need hour-long uncompressed WAVs. Instead, we:

1. Extract a short seamless loop (e.g., 3 minutes).
2. Encode it to a compressed, stereo audio format.
3. Loop that segment in the app for the entire session.

**Target per file: 2–5 MB, not 600 MB.**

This doc defines the pipeline and implementation details.

## Goals

- Reduce binaural/solfeggio file sizes by 100–200x.
- Keep stereo and perceptual quality suitable for headphones.
- Ensure tracks loop seamlessly for any session length.
- Make integration easy with our existing Expo AV + audio manager.

## 1. Source Files

We start from the original .wav files, e.g.:

- `Binaural Beat - Delta@2Hz - 400Hz Base.wav`
- `Binaural Beat - Delta@4Hz - 400Hz Base.wav`
- `Binaural Beat - Theta@4Hz - 400Hz Base.wav`
- `Binaural Beat - Gamma@38Hz - 100Hz Base.wav`
- `Solfeggio 396hz.wav`
- `Solfeggio 528hz.wav`

etc.

These contain long, repetitive tones that are ideal loop candidates.

## 2. Target Format

Per optimized track:

- **Length (loop segment)**: 180 seconds (3 minutes)
  - Long enough to feel natural
  - Short enough for fast load + cache
- **Channels**: Stereo (2) – required for binaural effect.
- **Sample rate**: 44.1 kHz or 48 kHz.
- **Bit depth**: 16-bit.
- **Codec**:
  - **Option A (default)**: AAC in M4A container
    - `-c:a aac -b:a 128k`
  - **Option B (smaller)**: Opus
    - `-c:a libopus -b:a 96k -vbr on`

### File Naming Convention

```
assets/audio/binaural/delta_2hz_400_3min.m4a
assets/audio/binaural/delta_4hz_400_3min.m4a
assets/audio/binaural/theta_4hz_400_3min.m4a
assets/audio/solfeggio/solfeggio_396_3min.m4a
assets/audio/solfeggio/solfeggio_528_3min.m4a
```

## 3. Conversion Pipeline (ffmpeg)

**Prerequisite**: ffmpeg installed on the machine.

Run these commands from the directory containing the original WAVs. Adjust paths as needed.

### 3.1 Binaural Beats → 3-Minute AAC Loops

Example: Delta 4 Hz, 400 Hz base:

```bash
ffmpeg -y \
  -i "Binaural Beat - Delta@4Hz - 400Hz Base.wav" \
  -ac 2 \
  -ar 44100 \
  -c:a aac \
  -b:a 128k \
  -t 180 \
  "../assets/audio/binaural/delta_4hz_400_3min.m4a"
```

Repeat for each binaural track:

```bash
# Alpha
ffmpeg -y -i "Binaural Beat - Alpha@10Hz - 400Hz Base.wav"  -ac 2 -ar 44100 -c:a aac -b:a 128k -t 180 "../assets/audio/binaural/alpha_10hz_400_3min.m4a"
ffmpeg -y -i "Binaural Beat - Alpha@12Hz - 120Hz Base.wav"  -ac 2 -ar 44100 -c:a aac -b:a 128k -t 180 "../assets/audio/binaural/alpha_12hz_120_3min.m4a"

# Beta
ffmpeg -y -i "Binaural Beat - Beta@13Hz - 400Hz Base.wav"   -ac 2 -ar 44100 -c:a aac -b:a 128k -t 180 "../assets/audio/binaural/beta_13hz_400_3min.m4a"
ffmpeg -y -i "Binaural Beat - Beta@20Hz - 120Hz Base.wav"   -ac 2 -ar 44100 -c:a aac -b:a 128k -t 180 "../assets/audio/binaural/beta_20hz_120_3min.m4a"

# Delta
ffmpeg -y -i "Binaural Beat - Delta@2Hz - 120Hz Base.wav"   -ac 2 -ar 44100 -c:a aac -b:a 128k -t 180 "../assets/audio/binaural/delta_2hz_120_3min.m4a"
ffmpeg -y -i "Binaural Beat - Delta@4Hz - 400Hz Base.wav"   -ac 2 -ar 44100 -c:a aac -b:a 128k -t 180 "../assets/audio/binaural/delta_4hz_400_3min.m4a"

# Gamma
ffmpeg -y -i "Binaural Beat - Gamma@38Hz - 100Hz Base.wav"  -ac 2 -ar 44100 -c:a aac -b:a 128k -t 180 "../assets/audio/binaural/gamma_38hz_100_3min.m4a"
ffmpeg -y -i "Binaural Beat - Gamma@40Hz - 120Hz Base.wav"  -ac 2 -ar 44100 -c:a aac -b:a 128k -t 180 "../assets/audio/binaural/gamma_40hz_120_3min.m4a"

# Theta
ffmpeg -y -i "Binaural Beat - Theta@4Hz - 400Hz Base.wav"   -ac 2 -ar 44100 -c:a aac -b:a 128k -t 180 "../assets/audio/binaural/theta_4hz_400_3min.m4a"
ffmpeg -y -i "Binaural Beat - Theta@8Hz - 120Hz Base.wav"   -ac 2 -ar 44100 -c:a aac -b:a 128k -t 180 "../assets/audio/binaural/theta_8hz_120_3min.m4a"
```

### 3.2 Solfeggio Tones → 3-Minute AAC Loops

```bash
ffmpeg -y -i "Solfeggio 396hz.wav"  -ac 2 -ar 44100 -c:a aac -b:a 128k -t 180 "../assets/audio/solfeggio/solfeggio_396_3min.m4a"
ffmpeg -y -i "Solfeggio 528hz.wav"  -ac 2 -ar 44100 -c:a aac -b:a 128k -t 180 "../assets/audio/solfeggio/solfeggio_528_3min.m4a"
ffmpeg -y -i "Solfeggio 432hz.wav"  -ac 2 -ar 44100 -c:a aac -b:a 128k -t 180 "../assets/audio/solfeggio/solfeggio_432_3min.m4a"
# ...repeat for remaining solfeggio files
```

### 3.3 Optional: Use Opus for Smaller Files

If we ever want to experiment with Opus:

```bash
ffmpeg -y \
  -i "Binaural Beat - Delta@4Hz - 400Hz Base.wav" \
  -ac 2 \
  -ar 48000 \
  -c:a libopus \
  -b:a 96k \
  -vbr on \
  -t 180 \
  "../assets/audio/binaural/delta_4hz_400_3min.opus"
```

## 4. App Integration

### 4.1 File Layout

Final structure (front end):

```
assets/
  audio/
    binaural/
      alpha_10hz_400_3min.m4a
      alpha_12hz_120_3min.m4a
      beta_13hz_400_3min.m4a
      ...
    solfeggio/
      solfeggio_396_3min.m4a
      solfeggio_528_3min.m4a
      ...
```

### 4.2 Audio Mapping

Update `src/utils/audioFiles.ts` (or equivalent) so each binaural category maps to the new filenames, e.g.:

```typescript
export const BINAURAL_FILES = {
  delta_2hz_120: require("@/assets/audio/binaural/delta_2hz_120_3min.m4a"),
  delta_4hz_400: require("@/assets/audio/binaural/delta_4hz_400_3min.m4a"),
  theta_4hz_400: require("@/assets/audio/binaural/theta_4hz_400_3min.m4a"),
  // ...
};

export const SOLFEGGIO_FILES = {
  "396": require("@/assets/audio/solfeggio/solfeggio_396_3min.m4a"),
  "528": require("@/assets/audio/solfeggio/solfeggio_528_3min.m4a"),
  // ...
};
```

## 5. Playback & Looping (Expo AV)

When loading audio in `audioManager.ts` / `PlaybackScreen.tsx`:

```typescript
import { Audio } from "expo-av";

// Example for a local asset
const [sound, setSound] = useState<Audio.Sound | null>(null);

async function loadBinauralAsync() {
  const s = new Audio.Sound();
  await s.loadAsync(
    BINAURAL_FILES.delta_4hz_400,      // local asset mapping
    { isLooping: true, volume: 1.0 }   // key: isLooping true
  );
  setSound(s);
}

// For remote URI, same thing:
await s.loadAsync({ uri: binauralUrl }, { isLooping: true });
```

The 3-minute track loops automatically for the entire session duration (3, 5, 10, 30 min, etc.).

## 6. Backend Considerations

### Option A — Bundle in app (recommended)

Binaural/Solfeggio files live in the app bundle under `assets/audio/....`

- No network request needed; instant playback.
- Best for reliability and offline use.

### Option B — Serve from backend

Place compressed files under a static directory (e.g., `public/audio/binaural/...`).

Expose routes like `/api/audio/binaural/delta_4hz_400_3min.m4a`.

Add caching headers:

```
Cache-Control: public, max-age=31536000, immutable
```

## 7. Acceptance Criteria

- ✅ All binaural and solfeggio assets are ≤ 5 MB each.
- ✅ App can start a session without noticeable delay on 4G / slow Wi-Fi.
- ✅ Background + binaural layers loop seamlessly (no audible click or gap).
- ✅ Audio remains stereo; binaural effect preserved.
- ✅ Playback works correctly in foreground, background, and when device is locked.
- ✅ No references remain to the original 600MB+ .wav files.

## 8. Future Enhancements (Optional)

- Add HQ vs Standard toggle in Settings (swap 128 kbps ↔ 64 kbps).
- Add per-track loudness normalization so switching between tracks does not change perceived volume.
- Pre-render combined binaural + background mixes for specific presets if we ever need super low CPU.

## 9. Conversion Script

See `scripts/convert-audio.sh` (or `scripts/convert-audio.bat` for Windows) for automated conversion.

## 10. Integration Status

- ✅ Documentation created
- ⏳ Audio files conversion (requires ffmpeg + source files)
- ⏳ Assets folder structure setup
- ⏳ Audio mapping update in `src/utils/audioFiles.ts`
- ⏳ Testing and validation

