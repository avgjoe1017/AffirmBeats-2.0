# Audio Integration Testing Guide

## Prerequisites

1. **Backend running** on port 3000 (or configured port)
2. **Frontend running** (Expo dev server)
3. **Audio files** in `raw audio files/` directory (already present)
4. **ElevenLabs API key** configured in backend (for TTS)

## Quick Start Testing

### Step 1: Start Backend
```bash
cd backend
bun run dev
# or
npm run dev
```

Verify backend is running:
- Check console for: `🚀 Server is running on port 3000`
- Visit `http://localhost:3000/health` - should return `{"status":"ok"}`
- Check logs for: `🎵 Mounting audio routes at /api/audio`

### Step 2: Start Frontend
```bash
# In project root
bun run start
# or
npm start
```

### Step 3: Test Audio File Serving

Test that backend can serve audio files:

**Binaural Beats:**
```bash
# Test Delta binaural beat
curl http://localhost:3000/api/audio/binaural/Binaural%20Beat%20-%20Delta@1Hz%20-%20100Hz%20Base.wav

# Should download the audio file
```

**Background Sounds:**
```bash
# Test rain sound
curl http://localhost:3000/api/audio/background/Birds%20chirping%20during%20light%20rain.mp3

# Should download the audio file
```

If these fail, check:
- File names match exactly (case-sensitive)
- Files exist in `raw audio files/` directory
- Backend route is mounted correctly

## Testing in the App

### Test 1: Create a Session with Audio

1. **Open the app** and navigate to Home screen
2. **Create a new session:**
   - Tap "Create Custom Session"
   - Enter a session name (e.g., "Test Audio Session")
   - Select a binaural category (e.g., "Delta" for sleep)
   - Add some affirmations (e.g., "I am calm", "I am peaceful", "I am relaxed")
   - Tap "Create Session"

3. **Navigate to Playback:**
   - Session should automatically navigate to PlaybackScreen
   - Check console logs for:
     ```
     [PlaybackScreen] Loading audio for session: <session-id>
     [PlaybackScreen] Loading binaural beats from: <url>
     [PlaybackScreen] Loading background sound from: <url>
     [PlaybackScreen] Audio loaded successfully
     ```

### Test 2: Test Affirmations (TTS) Playback

1. **Play the session:**
   - Tap the play button
   - You should hear the affirmations being spoken

2. **Check console logs:**
   ```
   [AudioManager] Loading affirmations...
   [AudioManager] TTS request successful
   [AudioManager] Audio loaded successfully
   ```

3. **Verify playback:**
   - Progress bar should move
   - Time display should update
   - Audio should be audible

**If TTS fails:**
- Check backend logs for ElevenLabs API errors
- Verify `ELEVENLABS_API_KEY` is set in backend `.env`
- Check network tab for `/api/tts/generate-session` request

### Test 3: Test Binaural Beats

1. **Create a session with binaural category:**
   - Use a session that has `binauralCategory` set (e.g., "delta", "theta", "alpha")
   - Play the session

2. **Check console:**
   ```
   [PlaybackScreen] Loading binaural beats from: <url>
   [AudioManager] Binaural beats loaded
   ```

3. **Verify:**
   - Binaural beats should play continuously (looping)
   - Should be audible as a low-frequency tone
   - Volume can be adjusted via audio mixer

**If binaural beats fail:**
- Check backend route: `GET /api/audio/binaural/:filename`
- Verify file name matches exactly (check console for the URL)
- Check backend logs for file not found errors

### Test 4: Test Background Sounds

1. **Create a session with background sound:**
   - In Settings, select a background sound (e.g., "Rain", "Ocean")
   - Create and play a session

2. **Check console:**
   ```
   [PlaybackScreen] Loading background sound from: <url>
   [AudioManager] Background noise loaded
   ```

3. **Verify:**
   - Background sound should play continuously (looping)
   - Should be audible (nature sounds, ambient music)
   - Volume can be adjusted via audio mixer

**If background sounds fail:**
- Check backend route: `GET /api/audio/background/:filename`
- Verify file exists in one of the ZENmix directories
- Check backend logs for file search errors

### Test 5: Test Multi-Track Mixing

1. **Play a session with all three layers:**
   - Affirmations (TTS)
   - Binaural beats (if category selected)
   - Background sound (if not "none")

2. **Verify all play simultaneously:**
   - You should hear all three layers mixed together
   - Each should be independently audible

3. **Test volume controls:**
   - Open Audio Mixer (gear icon in playback screen)
   - Adjust each slider independently
   - Verify volume changes in real-time

### Test 6: Test Playback Controls

1. **Play/Pause:**
   - Tap play button → all tracks should start
   - Tap pause button → all tracks should pause
   - Progress should stop updating

2. **Restart:**
   - Tap restart button → should seek to 0 and play
   - Affirmations should restart from beginning
   - Binaural and background continue (they loop)

3. **Progress tracking:**
   - Time display should update every second
   - Progress bar should fill as audio plays
   - Should stop when affirmations finish

### Test 7: Test Volume Controls

1. **Open Audio Mixer:**
   - Tap gear icon in playback screen
   - Three sliders should appear:
     - Affirmations (default: 100%)
     - Binaural Beats (default: 70%)
     - Background Noise (default: 50%)

2. **Adjust volumes:**
   - Move each slider independently
   - Verify volume changes immediately
   - Test extreme values (0%, 100%)

3. **Verify persistence:**
   - Close and reopen audio mixer
   - Volumes should be remembered
   - Settings persist across app restarts

## Debugging Common Issues

### Issue: "TTS request failed"

**Symptoms:**
- Console shows: `[AudioManager] Failed to load affirmations`
- No audio plays

**Solutions:**
1. Check backend logs for ElevenLabs API errors
2. Verify `ELEVENLABS_API_KEY` is set
3. Check network tab for 500/503 errors
4. Verify affirmations array is not empty

### Issue: "File not found" for binaural beats

**Symptoms:**
- Console shows: `Could not load binaural beats`
- 404 error in network tab

**Solutions:**
1. Check file name matches exactly (case-sensitive)
2. Verify file exists in `raw audio files/ZENmix - Pure Binaural Beats/`
3. Check URL encoding (spaces become `%20`)
4. Check backend logs for file path errors

### Issue: "File not found" for background sounds

**Symptoms:**
- Console shows: `Could not load background noise`
- 404 error in network tab

**Solutions:**
1. Check file name in `src/utils/audioFiles.ts`
2. Verify file exists in one of the ZENmix directories
3. Check backend route searches all directories
4. Verify file extension matches (.mp3)

### Issue: Audio doesn't play

**Symptoms:**
- No sound, but no errors in console

**Solutions:**
1. Check device volume is not muted
2. Verify audio mode is set correctly (should be automatic)
3. Check if other apps are playing audio
4. Try restarting the app
5. Check expo-av permissions (should be automatic)

### Issue: Multiple tracks don't play together

**Symptoms:**
- Only one track plays at a time

**Solutions:**
1. Verify all three `load*` functions are called
2. Check console for successful loading of all tracks
3. Verify `play()` is called after all tracks are loaded
4. Check if tracks are being unloaded prematurely

## Testing Checklist

- [ ] Backend serves binaural beat files
- [ ] Backend serves background sound files
- [ ] TTS generates affirmations audio
- [ ] Affirmations play correctly
- [ ] Binaural beats play and loop
- [ ] Background sounds play and loop
- [ ] All three tracks play simultaneously
- [ ] Play/pause controls work
- [ ] Restart button works
- [ ] Progress bar updates correctly
- [ ] Time display updates correctly
- [ ] Volume sliders work independently
- [ ] Volume changes apply immediately
- [ ] Audio continues in background
- [ ] Audio stops when session ends
- [ ] Cleanup works on session change
- [ ] Error handling shows user-friendly messages

## Performance Testing

1. **Load time:**
   - Measure time from session start to audio ready
   - Should be < 5 seconds for TTS generation
   - Should be < 2 seconds for file loading

2. **Memory usage:**
   - Monitor memory during playback
   - Should not leak when switching sessions
   - Cleanup should release audio resources

3. **Network usage:**
   - TTS: ~1-2 MB per session (one-time download)
   - Binaural beats: ~5-10 MB (cached after first load)
   - Background sounds: ~5-15 MB (cached after first load)

## Next Steps After Testing

If all tests pass:
1. ✅ Audio integration is working!
2. Consider adding loading indicators
3. Add error messages for users
4. Optimize file sizes if needed
5. Add audio preloading for better UX

If tests fail:
1. Check console logs for specific errors
2. Verify all prerequisites are met
3. Check file paths and names
4. Verify backend routes are working
5. Test individual components in isolation

