# Audio Integration Guide

## Overview

This document outlines the audio integration system for AffirmBeats 2.0, which supports multi-track playback with three independent audio layers:

1. **Affirmations** - TTS-generated audio from the backend
2. **Binaural Beats** - Local audio files matching the selected frequency category
3. **Background Noise** - Ambient sounds and nature sounds

## Current Status

✅ **Completed:**
- Audio file mapping system (`src/utils/audioFiles.ts`)
- Audio manager hook (`src/utils/audioManager.ts`) using expo-av
- TTS endpoint integration for affirmations
- Volume control system for all three layers

⏳ **In Progress:**
- Integration into PlaybackScreen
- Audio file organization and bundling

## Audio File Organization

### Current Location
Audio files are currently in the `raw audio files/` directory, organized by collection:
- `ZENmix - Pure Binaural Beats/` - Binaural beat files
- `ZENmix - Roots/` - Nature sounds
- `ZENmix - Postive Flow/` - Ambient meditation music
- `ZENmix - Dreamscape/` - Dreamy ambient sounds
- `ZENmix - Ancient Healing/` - Healing meditation music
- `ZENmix - Pure Solfeggio/` - Solfeggio frequency tones

### Required Setup

To use these audio files in React Native, you have two options:

#### Option 1: Bundle with App (Recommended for Production)
1. Copy selected audio files to `assets/audio/` directory:
   ```
   assets/
   ├── audio/
   │   ├── binaural/
   │   │   ├── Binaural Beat - Delta@1Hz - 100Hz Base.wav
   │   │   ├── Binaural Beat - Theta@4Hz - 400Hz Base.wav
   │   │   └── ... (other binaural files)
   │   └── background/
   │       ├── Birds chirping during light rain.mp3
   │       ├── Peaceful Mind Music with Underwater Bubbles and Brown Noise.mp3
   │       └── ... (other background files)
   ```

2. Update `src/utils/audioFiles.ts` to use `require()` statements:
   ```typescript
   export const binauralBeatFiles: Record<BinauralCategory, any> = {
     delta: [
       require("../../assets/audio/binaural/Binaural Beat - Delta@1Hz - 100Hz Base.wav"),
       // ...
     ],
     // ...
   };
   ```

#### Option 2: Serve from Backend (Recommended for Development)
1. Copy audio files to `backend/uploads/audio/` directory
2. Create a static file serving route in the backend
3. Access files via URL: `${BACKEND_URL}/uploads/audio/binaural/...`

## File Mapping

### Binaural Beats
Mapped by category (delta, theta, alpha, beta, gamma):
- **Delta** (0.5-4 Hz): Deep sleep frequencies
- **Theta** (4-8 Hz): Meditation frequencies
- **Alpha** (8-14 Hz): Relaxation frequencies
- **Beta** (14-30 Hz): Focus frequencies
- **Gamma** (30-100 Hz): Peak performance frequencies

### Background Sounds
Mapped by user preference:
- `none` - No background sound
- `rain` - Gentle rainfall
- `brown` - Brown noise
- `ocean` - Ocean waves
- `forest` - Forest ambience
- `wind` - Wind chimes
- `fire` - Fireplace sounds
- `thunder` - Distant thunder

## Usage in PlaybackScreen

```typescript
import { useAudioManager } from "@/utils/audioManager";
import { getBinauralBeatAssetPath, getBackgroundSoundAssetPath } from "@/utils/audioFiles";

const audioManager = useAudioManager();

// Load all audio tracks
await audioManager.loadAffirmations(
  session.affirmations,
  session.voiceId as "neutral" | "confident" | "whisper",
  session.pace as "slow" | "normal" | "fast"
);

if (session.binauralCategory) {
  const binauralPath = getBinauralBeatAssetPath(session.binauralCategory);
  await audioManager.loadBinauralBeats(binauralPath);
}

const backgroundPath = getBackgroundSoundAssetPath(session.noise as BackgroundSound);
if (backgroundPath) {
  await audioManager.loadBackgroundNoise(backgroundPath);
}

// Play all tracks
await audioManager.play();
```

## Volume Control

The audio manager integrates with the app store's volume settings:

```typescript
const volumes = useAppStore((s) => s.audioMixerVolumes);

// Update volumes
audioManager.setAffirmationsVolume(volumes.affirmations);
audioManager.setBinauralBeatsVolume(volumes.binauralBeats);
audioManager.setBackgroundNoiseVolume(volumes.backgroundNoise);
```

## Next Steps

1. **Organize Audio Files**: Copy selected files to `assets/audio/` or set up backend serving
2. **Integrate into PlaybackScreen**: Replace simulated timer with actual audio playback
3. **Test Multi-Track Playback**: Verify all three layers play simultaneously
4. **Handle Edge Cases**: 
   - What happens if a file is missing?
   - How to handle network errors for TTS?
   - Background audio when app is minimized

## Notes

- Binaural beats and background sounds are set to loop automatically
- Affirmations track determines the overall duration
- All tracks can be controlled independently via volume sliders
- Audio continues playing when app is minimized (configured in app.json)

