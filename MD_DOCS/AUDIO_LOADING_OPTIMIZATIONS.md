# Audio Loading Optimizations

**Date:** 2024-12-19  
**Goal:** Reduce audio loading time from ~2-5 seconds to <1 second

## Current Performance Bottlenecks

### 1. Backend N+1 Query Problem (CRITICAL)
**Location:** `backend/src/routes/sessions.ts:1213-1266`

**Problem:** For each affirmation in the playlist, the backend makes up to 3 sequential database queries:
- Query 1: Find preferred voice version
- Query 2: If not found, find any allowed voice
- Query 3: If still not found, find any voice

For a session with 10 affirmations, this is **up to 30 database queries**!

**Impact:** ~50-200ms per query × 30 queries = **1.5-6 seconds** just for database queries

### 2. Sequential Audio Loading (HIGH)
**Location:** `src/screens/PlaybackScreen.tsx:407-471`

**Problem:** Audio loads sequentially:
1. Load affirmations playlist (waits for backend + loads first 3)
2. Then load binaural beats
3. Then load background noise

**Impact:** Total time = sum of all operations instead of max

### 3. Limited Parallel Loading (MEDIUM)
**Location:** `src/utils/audioManager.ts:165-195`

**Problem:** Only first 3 affirmations load in parallel, rest load in batches of 5 sequentially

**Impact:** For 10 affirmations: 3 parallel + 7 sequential = slower than all parallel

### 4. No Audio File Caching (MEDIUM)
**Location:** `src/utils/audioManager.ts:136-163`

**Problem:** Audio files are fetched fresh from network each time, even if already loaded

**Impact:** Network latency on every load (~100-500ms per file)

### 5. No Preloading (LOW)
**Problem:** Next session's audio isn't preloaded

**Impact:** User waits for full load on every session switch

## Optimization Solutions

### Priority 1: Fix Backend N+1 Queries

**Solution:** Batch load all audio versions in a single query, then match in memory

```typescript
// Instead of N queries, do 1 query:
const affirmationIds = session.sessionAffirmations.map(sa => sa.affirmationId);
const allAudioVersions = await db.affirmationAudio.findMany({
  where: {
    affirmationId: { in: affirmationIds },
    voiceId: { in: allowedVoices },
  },
});

// Then match in memory (O(N) instead of O(N²))
```

**Expected Speedup:** 1.5-6 seconds → ~50-200ms (**10-30x faster**)

### Priority 2: Parallel Audio Loading

**Solution:** Load all three audio types simultaneously

```typescript
// Load all in parallel
await Promise.all([
  audioManager.loadAffirmationPlaylist(session.id),
  audioManager.loadBinauralBeats(binauralUrl),
  audioManager.loadBackgroundNoise(backgroundUrl),
]);
```

**Expected Speedup:** Sequential (3s) → Parallel (1s) (**3x faster**)

### Priority 3: Increase Parallel Affirmation Loading

**Solution:** Load all affirmations in parallel (or larger batches)

```typescript
// Load all affirmations in parallel (or batches of 10)
const allPromises = playlistData.affirmations.map(aff => loadAffirmation(aff));
await Promise.all(allPromises);
```

**Expected Speedup:** 3 parallel + 7 sequential → 10 parallel (**2-3x faster**)

### Priority 4: Add Audio File Caching

**Solution:** Cache loaded audio files in memory/disk

```typescript
// Cache by URL
const audioCache = new Map<string, Audio.Sound>();

const loadAffirmation = async (aff) => {
  if (audioCache.has(aff.audioUrl)) {
    return audioCache.get(aff.audioUrl);
  }
  // Load and cache
};
```

**Expected Speedup:** Network latency eliminated for cached files (**100-500ms saved per cached file**)

### Priority 5: Preload Next Session

**Solution:** Preload audio when user views session list

**Expected Speedup:** Instant playback when user selects preloaded session

## Implementation Plan

1. ✅ **Fix Backend N+1 Queries** - Single batch query
2. ✅ **Parallel Audio Loading** - Load all types simultaneously  
3. ✅ **Increase Parallel Affirmations** - Load all in parallel
4. ⏳ **Add Audio Caching** - Memory cache for loaded files
5. ⏳ **Preload Next Session** - Background preloading

## Expected Overall Speedup

**Before:** ~2-5 seconds total
- Backend queries: 1.5-6s
- Affirmation loading: 0.5-2s
- Binaural/background: 0.3-1s

**After:** ~0.3-0.8 seconds total
- Backend queries: 0.05-0.2s (30x faster)
- Affirmation loading: 0.2-0.5s (2-3x faster)
- Binaural/background: 0.1-0.3s (3x faster, parallel)

**Total Improvement: 5-10x faster**

