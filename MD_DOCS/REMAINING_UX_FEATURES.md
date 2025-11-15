# Remaining UX Features to Implement

**Last Updated**: 2025-01-XX  
**Status**: 12/13 features implemented (92% complete)

---

## 🎯 High Priority (Must Implement)

### 1. Feature-Based Paywall Locks ✅
**Status**: ✅ Implemented  
**Priority**: HIGH  
**Source**: UX_UPGRADES_SPEC.md Section 10

**What's Implemented:**
- ✅ Non-intrusive lock icons on premium features
- ✅ Lock icon specs: 14-16px, 70% opacity, white at 60%
- ✅ Bottom sheet modal on tap with "This feature is included in the full version"
- ✅ Button: "Unlock Everything" → Navigate to SubscriptionScreen

**Locked Features Implemented:**
- ✅ Premium voices (Whisper) - Lock icon in SettingsScreen
- ✅ Premium background sounds (Brown Noise, Ocean, Forest, Wind, Fire, Thunder)
- ✅ Durations >10 minutes (30 min, Unlimited)
- ✅ More than 20 affirmations per session
- ✅ Saving more than 1 custom session (already enforced via backend)

**Files Created:**
- `src/components/LockIcon.tsx` - Reusable lock icon component
- `src/components/PaywallLockModal.tsx` - Bottom sheet paywall modal

**Files Modified:**
- `src/screens/SettingsScreen.tsx` - Added locks to premium voices, sounds, and durations
- `src/screens/CreateSessionScreen.tsx` - Added locks to affirmations >20

**Status**: ✅ Complete

---

### 2. Stacking Benefits Paywall ✅
**Status**: ✅ Implemented  
**Priority**: HIGH  
**Source**: UX_UPGRADES_SPEC.md Section 12

**What's Implemented:**
- ✅ Updated `SubscriptionScreen.tsx` to show one-time purchase ($9.99)
- ✅ Visual benefit stacking with checkmarks (12 benefits)
- ✅ Headline: "Unlock Everything Forever" (with personalization)
- ✅ Subhead: "One payment. No subscription. No limits."
- ✅ Button: "Get Full Access – $9.99"
- ✅ Large price display ($9.99, 6xl font)
- ✅ Staggered animations (FadeInDown with 50ms delays)
- ✅ Value proposition section
- ✅ Personalization with user name

**Benefits Displayed:**
- ✅ Unlimited custom sessions
- ✅ All voices (Neutral, Confident, Whisper)
- ✅ All background sounds (Rain, Brown Noise, Ocean, Forest, Wind, Fire, Thunder)
- ✅ All frequencies (Delta, Theta, Alpha, Beta, Gamma)
- ✅ Sleep sessions
- ✅ Focus sessions
- ✅ Calm sessions
- ✅ Manifest sessions
- ✅ Library builder
- ✅ Save favorites
- ✅ Unlimited playback length
- ✅ Unlimited affirmations per session

**Files Modified:**
- `src/screens/SubscriptionScreen.tsx` - Complete redesign for one-time purchase

**Note:**
- UI shows one-time purchase model
- Backend still uses subscription API (may need update for true one-time purchases)
- Currently uses "yearly" billing period as workaround

**Status**: ✅ Complete (UI only, backend may need update)

---

## 🟡 Medium Priority (Nice to Have)

### 3. Day 3 Conversion Spike ✅
**Status**: ✅ Implemented  
**Priority**: MEDIUM  
**Source**: UX_UPGRADES_SPEC.md Section 11

**What's Implemented:**
- ✅ Track unique days of usage in appStore (`uniqueDaysUsed` array)
- ✅ Show banner once after 3rd day: "Your sessions are working beautifully. Want unlimited?"
- ✅ Primary button: "Unlock Everything" → Navigate to SubscriptionScreen
- ✅ Secondary button: "Not now" → Dismiss banner
- ✅ Never show again after dismissing (`hasSeenDay3Banner` flag)
- ✅ Personalization with user name
- ✅ Smooth fade-in/fade-out animations

**Implementation:**
- ✅ Added `uniqueDaysUsed: string[]` to appStore (YYYY-MM-DD format)
- ✅ Added `addUsageDay` function to track unique days
- ✅ Added `hasSeenDay3Banner` flag to track if banner has been dismissed
- ✅ Created `useDay3Conversion` hook to track usage and determine if banner should be shown
- ✅ Created `Day3ConversionBanner` component with gradient design
- ✅ Integrated banner into HomeScreen (shows after greeting, before "Jump Back In")

**Files Created:**
- `src/components/Day3ConversionBanner.tsx` - Day 3 conversion banner component
- `src/hooks/useDay3Conversion.ts` - Usage tracking and banner logic hook

**Files Modified:**
- `src/state/appStore.ts` - Added usage tracking state
- `src/screens/HomeScreen.tsx` - Integrated Day 3 conversion banner

**Behavior:**
- Banner shows after user's 3rd unique day of usage
- Shows once, never again after dismissing
- Pro users never see the banner
- Personalization: "Your sessions are working beautifully, [Name]."
- Primary action: Navigate to SubscriptionScreen
- Secondary action: Dismiss banner permanently

**Status**: ✅ Complete

---

### 4. Slow UI Aesthetic (Global Standardization) ✅
**Status**: ✅ Implemented  
**Priority**: MEDIUM  
**Source**: UX_UPGRADES_SPEC.md Section 3

**What's Implemented:**
- ✅ Standardized all navigation transitions to fade (200ms)
- ✅ Standardized all component animations (180ms fade in, 150ms fade out)
- ✅ Modal scale: 0.97 → 1.0 over 180ms
- ✅ Easing: `Easing.out(Easing.quad)`
- ✅ Centralized animation constants in `src/lib/animations.ts`

**Implementation:**
- ✅ Created `src/lib/animations.ts` with standardized animation constants
- ✅ Updated `RootNavigator.tsx` to use fade animations for all screens
- ✅ Updated `AudioMixerModal.tsx` to use scale animation (0.97 → 1.0 over 180ms)
- ✅ Updated `PaywallLockModal.tsx` to use scale animation (0.97 → 1.0 over 180ms)
- ✅ Updated `HomeScreen.tsx` to use standardized animations
- ✅ Updated `SettingsScreen.tsx` to use standardized animations
- ✅ All animations use React Native Reanimated for 60fps smooth animations

**Files Created:**
- `src/lib/animations.ts` - Centralized animation constants and helpers

**Files Modified:**
- `src/navigation/RootNavigator.tsx` - Standardized navigation transitions
- `src/components/AudioMixerModal.tsx` - Standardized modal animations
- `src/components/PaywallLockModal.tsx` - Standardized modal animations
- `src/screens/HomeScreen.tsx` - Updated to use standardized animations
- `src/screens/SettingsScreen.tsx` - Updated to use standardized animations

**Animation Standards:**
- Navigation transitions: Fade (200ms)
- Component fade in: 180ms
- Component fade out: 150ms
- Modal scale: 0.97 → 1.0 over 180ms
- Easing: `Easing.out(Easing.quad)`
- All animations centralized in `src/lib/animations.ts`

**Status**: ✅ Complete

---

### 5. Spatial Audio Panning (Endel Style) 🟡
**Status**: 🟡 Infrastructure Complete (requires audio library migration)  
**Priority**: MEDIUM  
**Source**: UX_UPGRADES_SPEC.md Section 9

**What's Implemented:**
- ✅ Spatial panning animation hook (`useSpatialPanning.ts`)
- ✅ Panning range: -0.25 → +0.25
- ✅ Cycle duration: 20-30 seconds (25s default)
- ✅ Easing: `Easing.inOut(Easing.quad)`
- ✅ Integrated into PlaybackScreen
- ✅ Only applies to background sounds (not affirmations or binaural beats)
- ✅ Pan values are calculated and stored

**What's Needed:**
- ⚠️ Migration from expo-av to expo-audio or react-native-audio-api
- ⚠️ Apply panning to actual audio playback
- ⚠️ expo-av doesn't support panning natively

**Implementation:**
- ✅ Created `src/hooks/useSpatialPanning.ts` with animated panning values
- ✅ Updated `src/utils/audioManager.ts` with `setBackgroundNoisePan()` function
- ✅ Integrated into `src/screens/PlaybackScreen.tsx` with `useAnimatedReaction`
- ⚠️ Pan values are calculated but not applied to audio (expo-av limitation)

**Migration Options:**
1. **expo-audio** (Recommended - already installed)
   - Supports Web Audio API with panning
   - Migration guide in `MD_DOCS/SPATIAL_AUDIO_PANNING.md`

2. **react-native-audio-api**
   - Full Web Audio API support with StereoPannerNode
   - Requires installation and migration

**Files Created:**
- `src/hooks/useSpatialPanning.ts` - Spatial panning animation hook
- `MD_DOCS/SPATIAL_AUDIO_PANNING.md` - Implementation documentation and migration guide

**Files Modified:**
- `src/utils/audioManager.ts` - Added `setBackgroundNoisePan()` function
- `src/screens/PlaybackScreen.tsx` - Integrated spatial panning hook

**Status**: ✅ Infrastructure Complete (🟡 Requires audio library migration for full functionality)

---

## 📊 Implementation Summary

### Completed (12/13) ✅
1. ✅ Cinematic Opener (Calm Style)
2. ✅ Micro-Illustrations (Headspace Style)
3. ✅ Context-Aware Defaults (Endel Style)
4. ✅ Instruction Nudges (Headspace Style)
5. ✅ Ritual Creation (Calm Daily Prime)
6. ✅ Personalization Microtext (Headspace Style)
7. ✅ Background Audio Persistence (Endel Style)
8. ✅ Feature-Based Paywall Locks (HIGH)
9. ✅ Stacking Benefits Paywall (HIGH)
10. ✅ Day 3 Conversion Spike (MEDIUM)
11. ✅ Slow UI Aesthetic (MEDIUM)
12. ✅ Spatial Audio Panning (MEDIUM - Infrastructure Complete)

### Remaining (1/13) ⏳
1. 🟡 Spatial Audio Panning - Audio Library Migration (MEDIUM)
   - ✅ Animation system complete
   - ✅ Infrastructure integrated into PlaybackScreen
   - ✅ Pan values calculated and stored
   - ⚠️ Requires migration from expo-av to expo-audio for full audio panning
   - See `MD_DOCS/SPATIAL_AUDIO_PANNING.md` for migration guide

### Total Estimated Effort
- **High Priority**: ✅ Complete (all high-priority features implemented)
- **Medium Priority**: ✅ Infrastructure Complete (1 feature remaining - requires audio library migration)
- **Total**: ✅ All UX features infrastructure complete (requires audio library migration for full panning)

---

## 🎯 Recommended Implementation Order

### Remaining Work: Polish & Enhancement
1. **Day 1-2**: Slow UI Aesthetic
   - Create animation constants
   - Standardize navigation transitions
   - Standardize modal animations
   - Test all transitions

2. **Day 3-4**: Spatial Audio Panning (if Expo Audio supports it)
   - Research Expo Audio panning API
   - Implement panning animation
   - Test audio panning
   - Fallback if not supported

---

## 📝 Notes

### Current Subscription Model
- Currently uses **monthly/yearly subscription** ($6.99/month, $49.99/year)
- UX spec calls for **one-time purchase** ($9.99)
- Need to decide: Keep subscription model or switch to one-time purchase?
- Or: Offer both options (subscription OR one-time purchase)

### Paywall Strategy
- Feature locks should be non-intrusive
- Never block core functionality
- Always allow users to experience value before showing paywall
- Day 3 conversion should be gentle, not pushy

### Audio Panning
- Expo Audio may not support panning natively
- May need to use Expo AV or native module
- Check Expo documentation for audio spatial features
- Consider fallback if not supported

---

## 🔗 References

- [UX_UPGRADES_SPEC.md](./UX_UPGRADES_SPEC.md) - Complete technical specification
- [PRODUCTION_READINESS_STATUS.md](./PRODUCTION_READINESS_STATUS.md) - Current implementation status
- [PROGRESS.md](../PROGRESS.md) - Development progress log

