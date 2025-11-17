# AI Voices Audit

**Date:** 2025-11-16  
**Last Updated:** 2025-11-16 - Updated default voices to Mira and Archer  
**Provider:** ElevenLabs  
**Model:** `eleven_monolingual_v1`

## Overview

The app currently uses **3 AI voices** from ElevenLabs for text-to-speech generation. All voices are configured in the backend TTS route and displayed in the Settings screen.

---

## Voice Inventory

### 1. **Mira (F)** (Free)
- **Backend Voice ID:** `ZqvIIuD5aI9JFejebHiH`
- **ElevenLabs Voice Name:** Mira
- **Display Name:** "Mira (F)"
- **Description:** "Meditation, Calming Down, Relaxing"
- **Gender:** Female
- **Premium Status:** ❌ Free (available to all users)
- **Voice Settings:**
  - Stability: `0.5`
  - Similarity Boost: `0.75`
  - Speed: `0.85` (slow), `1.0` (normal), `1.15` (fast) - based on pace setting

### 2. **Archer (M)** (Free)
- **Backend Voice ID:** `xGDJhCwcqw94ypljc95Z`
- **ElevenLabs Voice Name:** Archer
- **Display Name:** "Archer (M)"
- **Description:** "Guided Meditation & Narration"
- **Gender:** Male
- **Premium Status:** ❌ Free (available to all users)
- **Voice Settings:**
  - Stability: `0.5`
  - Similarity Boost: `0.75`
  - Speed: `0.85` (slow), `1.0` (normal), `1.15` (fast) - based on pace setting

### 3. **Whisper** (Premium)
- **Backend Voice ID:** `EXAVITQu4vr4xnSDxMaL`
- **ElevenLabs Voice Name:** Bella
- **Display Name:** "Whisper"
- **Description:** "Soft and soothing"
- **Premium Status:** ✅ Premium (requires Pro subscription)
- **Voice Settings:**
  - Stability: `0.5`
  - Similarity Boost: `0.75`
  - Speed: `0.85` (slow), `1.0` (normal), `1.15` (fast) - based on pace setting

---

## Configuration Locations

### Backend Configuration
**File:** `backend/src/routes/tts.ts`

```typescript
const VOICE_IDS = {
  neutral: "ZqvIIuD5aI9JFejebHiH", // Mira (F) - Meditation, Calming Down, Relaxing
  confident: "xGDJhCwcqw94ypljc95Z", // Archer (M) - Guided Meditation & Narration
  whisper: "EXAVITQu4vr4xnSDxMaL", // Bella - soft and gentle
};
```

**Voice Settings (applied to all voices):**
- Model: `eleven_monolingual_v1`
- Stability: `0.5`
- Similarity Boost: `0.75`
- Speed: Dynamic based on pace setting (slow: 0.85, normal: 1.0, fast: 1.15)

### Frontend Configuration
**File:** `src/screens/SettingsScreen.tsx`

```typescript
const voices = [
  { value: "neutral" as const, label: "Mira (F)", description: "Meditation, Calming Down, Relaxing", isPremium: false },
  { value: "confident" as const, label: "Archer (M)", description: "Guided Meditation & Narration", isPremium: false },
  { value: "whisper" as const, label: "Whisper", description: "Soft and soothing", isPremium: true },
];
```

### Type Definitions
**File:** `shared/contracts.ts`

Voice types are defined as:
```typescript
voice: z.enum(["neutral", "confident", "whisper"])
```

---

## Voice Usage

### Where Voices Are Used

1. **TTS Generation Endpoints:**
   - `POST /api/tts/generate` - Single text generation
   - `POST /api/tts/generate-session` - Complete session audio with affirmations

2. **User Preferences:**
   - Stored in `UserPreferences` table (default: `"neutral"`)
   - Can be changed in Settings screen
   - Persisted per user

3. **Session Storage:**
   - Stored as `voiceId` in `AffirmationSession` table
   - Used for playback and regeneration

4. **Settings Screen:**
   - Voice selector modal
   - Premium lock icon for Whisper voice
   - Paywall modal when free users try to select Whisper

---

## Voice Settings Analysis

### Current Settings (All Voices)
- **Stability:** `0.5` (balanced - not too robotic, not too variable)
- **Similarity Boost:** `0.75` (high similarity to original voice)
- **Speed:** Dynamic based on pace:
  - Slow: `0.85` (15% slower)
  - Normal: `1.0` (default speed)
  - Fast: `1.15` (15% faster)

### Recommendations

1. **Stability Tuning:**
   - Consider different stability values per voice:
     - Neutral: `0.5` (current) ✅
     - Confident: `0.6` (slightly more stable for authoritative tone)
     - Whisper: `0.4` (more variable for natural whisper effect)

2. **Similarity Boost:**
   - Current `0.75` is good for all voices ✅
   - Could increase to `0.8` for more consistent voice quality

3. **Speed Settings:**
   - Current range (0.85-1.15) is appropriate ✅
   - Consider adding more granular control in future

---

## Premium Status Verification

### Frontend (SettingsScreen.tsx)
- ✅ Mira (F) (neutral): `isPremium: false`
- ✅ Archer (M) (confident): `isPremium: false`
- ✅ Whisper: `isPremium: true`

### Backend (TTS Route)
- ⚠️ **No premium check in backend TTS route**
- Backend accepts any voice type without subscription verification
- Premium enforcement is frontend-only

### Recommendation
- Add backend validation to prevent free users from using premium voices
- Check subscription tier before generating TTS with premium voice
- Return appropriate error if free user tries to use Whisper

---

## Voice ID Verification

### ElevenLabs Voice IDs
All voice IDs are hardcoded in the backend. To verify they're still valid:

1. **Mira (F) (neutral):** `ZqvIIuD5aI9JFejebHiH`
2. **Archer (M) (confident):** `xGDJhCwcqw94ypljc95Z`
3. **Whisper (Bella):** `EXAVITQu4vr4xnSDxMaL`

### Verification Steps
1. Check ElevenLabs dashboard to confirm voice IDs are still active
2. Test each voice with sample text
3. Verify voice names match (Mira, Archer, Bella)
4. Check if any voices have been deprecated or updated

---

## Issues & Recommendations

### ✅ What's Working
- Voice configuration is consistent across frontend and backend
- Premium status is correctly marked in frontend
- Voice settings are applied consistently
- Type safety is enforced with Zod schemas

### ⚠️ Issues Found

1. **Missing Backend Premium Validation**
   - Backend doesn't verify subscription before generating premium voice
   - Free users could potentially bypass frontend restrictions
   - **Recommendation:** Add subscription check in TTS route

2. **No Voice ID Validation**
   - Voice IDs are hardcoded, no verification they're still valid
   - **Recommendation:** Add health check endpoint to verify voice IDs

3. **Missing Voice Metadata**
   - No gender information stored
   - No language/accent information
   - **Recommendation:** Add metadata for future voice expansion

4. **Incomplete Whisper Comment**
   - Line 26 in `tts.ts` has incomplete comment for whisper voice
   - **Current:** `whisper: "EXAVITQu4vr4xnSDxMaL",`
   - **Should be:** `whisper: "EXAVITQu4vr4xnSDxMaL", // Bella - soft and gentle`

### 🔄 Future Enhancements

1. **Add More Voices**
   - Consider adding male/female variants
   - Add voices for different languages
   - Add specialized voices (e.g., meditation, energetic)

2. **Voice Customization**
   - Allow users to adjust stability/similarity
   - Add voice speed slider (beyond pace presets)
   - Add voice pitch control

3. **Voice Preview**
   - Add "Preview" button in Settings
   - Play sample audio for each voice
   - Help users choose the right voice

4. **Voice Analytics**
   - Track which voices are most popular
   - Monitor voice generation success rates
   - Track premium voice usage

---

## Testing Checklist

- [ ] Verify all 3 voices generate audio successfully
- [ ] Test premium lock on Whisper voice (free users)
- [ ] Test premium access on Whisper voice (Pro users)
- [ ] Verify voice settings (stability, similarity, speed) are applied
- [ ] Test all pace settings (slow, normal, fast) with each voice
- [ ] Verify voice persistence in user preferences
- [ ] Test voice selection in Settings modal
- [ ] Verify voice is saved correctly in session storage
- [ ] Test voice playback in PlaybackScreen
- [ ] Verify ElevenLabs API key is configured
- [ ] Test error handling when API key is missing
- [ ] Test rate limiting on TTS endpoints

---

## Voice Cost Analysis

### ElevenLabs Pricing (as of audit date)
- Pricing is typically per character or per minute
- Current model: `eleven_monolingual_v1`
- All voices use the same model (no cost difference between voices)

### Cost Optimization
- ✅ TTS caching implemented (shared across all users)
- ✅ Cache reduces redundant API calls
- ✅ Session audio generation combines affirmations (single API call)

### Recommendations
- Monitor API usage per voice type
- Track cache hit rates
- Consider voice-specific caching strategies

---

## Summary

**Total Voices:** 3  
**Free Voices:** 2 (Mira (F), Archer (M))  
**Premium Voices:** 1 (Whisper)  
**Provider:** ElevenLabs  
**Model:** `eleven_monolingual_v1`  
**Status:** ✅ All voices configured and working

**Critical Issues:** 1 (Missing backend premium validation)  
**Recommendations:** 4 (Backend validation, voice ID verification, metadata, comment fix)

---

## Next Steps

1. **Immediate:**
   - Fix incomplete comment for Whisper voice
   - Add backend premium validation for Whisper voice

2. **Short-term:**
   - Verify ElevenLabs voice IDs are still valid
   - Add voice health check endpoint
   - Test all voices with sample text

3. **Long-term:**
   - Consider adding more voices
   - Add voice preview functionality
   - Implement voice analytics

