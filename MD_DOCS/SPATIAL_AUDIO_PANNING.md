# Spatial Audio Panning Implementation

## Overview

Spatial audio panning has been implemented as an infrastructure feature for background sounds. The animation system is fully functional, but actual audio panning requires migration from `expo-av` to an audio library that supports panning.

## Current Implementation

### ✅ Completed

1. **Spatial Panning Hook** (`src/hooks/useSpatialPanning.ts`)
   - Animated panning values using React Native Reanimated
   - Panning range: -0.25 → +0.25
   - Cycle duration: 20-30 seconds (configurable, default: 25 seconds)
   - Easing: `Easing.inOut(Easing.quad)`
   - Smooth back-and-forth oscillation

2. **Audio Manager Integration** (`src/utils/audioManager.ts`)
   - Added `setBackgroundNoisePan()` function
   - Pan value storage and management
   - Prepared for future migration

3. **PlaybackScreen Integration** (`src/screens/PlaybackScreen.tsx`)
   - Spatial panning hook integrated
   - Active only when background sound is playing
   - Animated reaction syncs pan values with audio manager

## Limitations

### ⚠️ expo-av Doesn't Support Panning

`expo-av` (version 16.0.7) does not natively support audio panning. The current implementation:

- ✅ Animation system is fully functional
- ✅ Pan values are calculated and stored
- ❌ Pan values are **not applied** to the audio (no-op)

### Solution: Migrate to expo-audio or react-native-audio-api

To enable full spatial audio panning, you need to migrate background audio playback to one of these libraries:

#### Option 1: expo-audio (Recommended)

`expo-audio` (version 1.0.14) is already installed and supports Web Audio API features including panning.

**Migration Steps:**

1. Update `audioManager.ts` to use `expo-audio` for background sounds:
   ```typescript
   import { AudioPlayer, AudioSource } from 'expo-audio';
   
   // Create audio player with panning support
   const player = new AudioPlayer({
     source: { uri: fileUri },
     isLooping: true,
   });
   
   // Apply panning
   player.pan = panValue; // -1 to 1
   ```

2. Keep `expo-av` for affirmations and binaural beats (if needed)
3. Update `setBackgroundNoisePan()` to apply panning to the audio player

#### Option 2: react-native-audio-api

`react-native-audio-api` provides Web Audio API support with `StereoPannerNode`.

**Migration Steps:**

1. Install `react-native-audio-api`:
   ```bash
   npm install react-native-audio-api
   ```

2. Update `audioManager.ts` to use Web Audio API:
   ```typescript
   import { AudioContext, StereoPannerNode } from 'react-native-audio-api';
   
   const audioContext = new AudioContext();
   const stereoPanner = audioContext.createStereoPanner();
   stereoPanner.pan.value = panValue; // -0.25 to 0.25
   ```

## Implementation Details

### Panning Animation

The panning animation uses React Native Reanimated to create a smooth oscillation:

- **Range**: -0.25 (left) to +0.25 (right)
- **Cycle**: 25 seconds (middle of 20-30s range)
- **Easing**: `Easing.inOut(Easing.quad)` for smooth acceleration/deceleration
- **Pattern**: Center → Max → Min → Center (infinite loop)

### Integration

```typescript
// In PlaybackScreen.tsx
const hasBackgroundSound = session?.noise && session.noise !== "none";
const spatialPan = useSpatialPanningSimple({
  isActive: isPlaying && hasBackgroundSound === true,
  cycleDuration: 25000,
  minPan: -0.25,
  maxPan: 0.25,
});

// Sync pan value with audio manager
useAnimatedReaction(
  () => spatialPan.value,
  (panValue) => {
    runOnJS(audioManager.setBackgroundNoisePan)(panValue);
  },
  [spatialPan]
);
```

## Testing

### Current State

- ✅ Panning animation works correctly
- ✅ Pan values are calculated and stored
- ❌ Audio panning is not applied (expo-av limitation)

### After Migration

1. Test panning with headphones for best spatial effect
2. Verify panning range (-0.25 to +0.25) is subtle and not distracting
3. Ensure smooth oscillation (20-30 second cycles)
4. Test that panning only applies to background sounds (not affirmations or binaural beats)

## Future Work

1. **Migrate to expo-audio** for background sounds
2. **Apply panning** to audio playback
3. **Test** spatial audio effect with headphones
4. **Fine-tune** panning range and cycle duration based on user feedback

## References

- [expo-audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [react-native-audio-api Documentation](https://github.com/software-mansion/react-native-audio-api)
- UX_UPGRADES_SPEC.md Section 9: Layered Audio Depth (Endel Style)

