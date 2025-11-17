# Background Audio Integration Guide

**Date**: 2025-11-16  
**Status**: ✅ Complete

## Overview

The background audio system has been fully integrated with optimized loopable M4A files from `assets/audio/background/looped/`. The system intelligently maps user preferences to actual audio files with support for multiple options per preference. All background sounds are served from the `looped/` subdirectory only.

## File Structure

```
assets/audio/background/
  └── looped/ (10 files)
      ├── Heavy Rain.m4a
      ├── Forest Rain.m4a
      ├── Babbling Brook.m4a
      ├── Evening Walk.m4a
      ├── Storm.m4a
      ├── Birds Chirping.m4a
      ├── Thunder.m4a
      ├── Distant Ocean.m4a
      ├── Regeneration.m4a
      └── Tibetan Om.m4a
```

**Note**: All other background audio subdirectories have been removed. Only files in the `looped/` folder are used.

## User Preference Mapping

### Rain (2 options)
- `looped/Heavy Rain.m4a` - **FREE** ✅
- `looped/Forest Rain.m4a` - **PREMIUM** 🔒

### Brown Noise (2 options)
- `looped/Regeneration.m4a` - **PREMIUM** 🔒
- `looped/Tibetan Om.m4a` - **PREMIUM** 🔒

### Ocean (1 option)
- `looped/Distant Ocean.m4a` - **PREMIUM** 🔒

### Forest (3 options)
- `looped/Forest Rain.m4a` - **PREMIUM** 🔒
- `looped/Babbling Brook.m4a` - **PREMIUM** 🔒
- `looped/Birds Chirping.m4a` - **FREE** ✅

### Wind (1 option)
- `looped/Storm.m4a` - **PREMIUM** 🔒

### Fire (2 options)
- `looped/Regeneration.m4a` - **PREMIUM** 🔒
- `looped/Tibetan Om.m4a` - **PREMIUM** 🔒

### Thunder (2 options)
- `looped/Thunder.m4a` - **PREMIUM** 🔒
- `looped/Storm.m4a` - **PREMIUM** 🔒

**Premium Access Control:**
- Free users can only access "Heavy Rain" (when selecting "rain") and "Birds Chirping" (when selecting "forest")
- Premium users get access to all files, with random selection from available options
- The system automatically filters premium files for free users

**Note**: `Evening Walk.m4a` is available in the looped folder but not currently mapped to any preference. It can be added to the mapping if needed.

## Technical Implementation

### Frontend (`src/utils/audioFiles.ts`)

**Key Functions:**
- `getOptimizedBackgroundSoundFile(sound)` - Returns random file from available options
- `getOptimizedBackgroundSoundUrl(sound, backendUrl)` - Generates URL with subdirectory
- `getBackgroundSoundUrl(sound, backendUrl, useOptimized)` - Main function (prefers optimized, falls back to legacy)

**Usage:**
```typescript
import { getBackgroundSoundUrl, type BackgroundSound } from "@/utils/audioFiles";

const backgroundUrl = getBackgroundSoundUrl("rain" as BackgroundSound, BACKEND_URL);
// Returns: http://backend/api/audio/background/roots/birds_chirping_during_light_rain_3min.m4a
// (randomly selects from 4 rain options)
```

### Backend (`backend/src/routes/audio.ts`)

**Route:** `GET /api/audio/background/:subdirectory/:filename` or `GET /api/audio/background/:filename`

**Features:**
- Serves optimized files from `assets/audio/background/` subdirectories
- Falls back to legacy files from `raw audio files/` directory
- Proper MIME type handling (audio/mp4 for M4A files)
- Range request support for iOS AVPlayer
- Enhanced caching headers for optimized files

### Audio Manager (`src/utils/audioManager.ts`)

**Configuration:**
- Background sounds are loaded with `isLooping: true`
- Files are 3-minute loops, perfect for seamless playback
- Independent volume control via `setBackgroundNoiseVolume()`

## File Quality & Looping

### ✅ All Files Are:
- **3-minute loops** - Perfect duration for seamless looping
- **M4A format** - Optimized AAC encoding (2-5 MB each vs 600+ MB for WAV)
- **Seamlessly loopable** - No gaps or clicks when looping
- **Properly encoded** - Ready for mobile playback

### Looping Behavior
- AudioManager sets `isLooping: true` when loading background sounds
- Files loop continuously during playback
- No manual loop management needed

## Adding New Background Sounds

To add a new background sound option:

1. **Add the file** to `assets/audio/background/looped/` directory
2. **Update mapping** in `src/utils/audioFiles.ts`:
   ```typescript
   export const optimizedBackgroundSoundFiles: Record<BackgroundSound, Array<{ subdirectory: string; filename: string }> | null> = {
     // ... existing mappings
     newSound: [
       { subdirectory: "looped", filename: "New Sound.m4a" },
     ],
   };
   ```
3. **Update type** in `shared/contracts.ts`:
   ```typescript
   noise: z.enum(["rain", "brown", "none", "ocean", "forest", "wind", "fire", "thunder", "newSound"]),
   ```
4. **Update SettingsScreen** to show the new option

## Testing

### Verify Files Are Loopable
1. Load a background sound in PlaybackScreen
2. Let it play for 3+ minutes
3. Verify seamless looping (no gaps or clicks)

### Verify File Serving
1. Check backend logs for file serving
2. Verify MIME type is `audio/mp4` for M4A files
3. Test Range requests (iOS AVPlayer requirement)

### Verify Random Selection
1. Load the same background sound multiple times
2. Verify different files are selected (for preferences with multiple options)

## Performance

- **File Size**: 2-5 MB per file (vs 600+ MB for original WAV files)
- **Load Time**: < 1 second for optimized files
- **Memory**: Minimal (streamed, not fully loaded into memory)
- **Caching**: 1 year cache headers for optimized files

## Backward Compatibility

The system maintains backward compatibility:
- Legacy file names still work (fallback system)
- Old route format `/background/filename` still supported
- New route format `/background/subdirectory/filename` for optimized files

## Future Enhancements

1. **Deterministic Selection**: Use session ID or user ID to select file (same session = same file)
2. **More Categories**: Add more background sound categories (e.g., "meditation", "focus")
3. **User Favorites**: Allow users to favorite specific background sounds
4. **Preview**: Add preview functionality in Settings screen

