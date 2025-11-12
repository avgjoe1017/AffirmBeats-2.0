# Bugs and Improvement Opportunities

**Generated:** 2025-01-XX  
**Codebase:** AffirmBeats 2.0

---

## 🔴 Critical Bugs

### 1. **Race Condition in Subscription Limit Check** ⚠️ HIGH PRIORITY
**Location:** `backend/src/routes/sessions.ts:382-465`

**Issue:** The subscription limit check and increment are not atomic. Two simultaneous requests can both pass the limit check before either increments the counter.

**Current Flow:**
```typescript
// Request 1 checks limit → passes (0 < 1)
// Request 2 checks limit → passes (0 < 1) 
// Request 1 creates session → increments to 1
// Request 2 creates session → increments to 2
// Result: User created 2 sessions but limit is 1
```

**Fix:** Use a database transaction or optimistic locking:
```typescript
// Option 1: Transaction with row lock
await db.$transaction(async (tx) => {
  const subscription = await tx.userSubscription.findUnique({
    where: { userId: user.id },
    lock: { mode: 'pessimistic_write' }
  });
  // Check limit
  // Create session
  // Increment counter
});

// Option 2: Optimistic update with retry
const result = await db.userSubscription.updateMany({
  where: {
    userId: user.id,
    customSessionsUsedThisMonth: { lt: limit }
  },
  data: {
    customSessionsUsedThisMonth: { increment: 1 }
  }
});
if (result.count === 0) throw new Error('Limit reached');
```

---

### 2. **useEffect Dependency Causing Interval Restart** ⚠️ MEDIUM PRIORITY
**Location:** `src/screens/PlaybackScreen.tsx:320-334`

**Issue:** The `useEffect` has `currentTime` in its dependency array, causing the interval to restart every second.

**Current Code:**
```typescript
useEffect(() => {
  let interval: NodeJS.Timeout;
  if (isPlaying && session) {
    interval = setInterval(() => {
      const newTime = currentTime + 1; // Uses currentTime from closure
      // ...
    }, 1000);
  }
  return () => clearInterval(interval);
}, [isPlaying, session, currentTime]); // ❌ currentTime causes restart every second
```

**Fix:** Use functional state updates or ref:
```typescript
useEffect(() => {
  if (!isPlaying || !session) return;
  
  const interval = setInterval(() => {
    setCurrentTime((prevTime) => {
      const newTime = prevTime + 1;
      if (newTime >= session.lengthSec) {
        setIsPlaying(false);
        return session.lengthSec;
      }
      return newTime;
    });
  }, 1000);
  
  return () => clearInterval(interval);
}, [isPlaying, session]); // ✅ Removed currentTime
```

---

### 3. **Missing Cleanup for setTimeout** ⚠️ LOW PRIORITY
**Location:** `src/screens/GenerationScreen.tsx:70-80`

**Issue:** `setTimeout` is not cleaned up if component unmounts before timeout completes.

**Current Code:**
```typescript
setTimeout(() => {
  navigation.replace("Playback", { sessionId: response.sessionId });
}, 1000);
```

**Fix:**
```typescript
const timeoutId = setTimeout(() => {
  navigation.replace("Playback", { sessionId: response.sessionId });
}, 1000);

return () => clearTimeout(timeoutId);
```

---

### 4. **Monthly Reset Only Happens on Read** ⚠️ MEDIUM PRIORITY
**Location:** `backend/src/routes/subscription.ts:43-57`

**Issue:** Monthly reset only occurs when `getOrCreateSubscription` is called. If a user doesn't call any subscription endpoints for 30+ days, their counter never resets.

**Current Code:**
```typescript
// Only resets when subscription is fetched
if (daysSinceReset >= 30) {
  subscription = await db.userSubscription.update({
    // ...
  });
}
```

**Fix Options:**
1. **Scheduled job/cron** (recommended for production)
2. **Lazy reset on every subscription check** (current approach, but ensure all paths call it)
3. **Database trigger** (if SQLite supports it)

**Recommended:** Add a daily cron job or scheduled task:
```typescript
// backend/src/cron.ts
import { db } from "./db";

export async function resetMonthlyCounters() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await db.userSubscription.updateMany({
    where: {
      lastResetDate: { lt: thirtyDaysAgo },
      tier: "free"
    },
    data: {
      customSessionsUsedThisMonth: 0,
      lastResetDate: new Date()
    }
  });
}

// Run daily (use node-cron or similar)
```

---

### 5. **Session State Synchronization Issues** ⚠️ MEDIUM PRIORITY
**Location:** Multiple files (`HomeScreen.tsx`, `LibraryScreen.tsx`, `PlaybackScreen.tsx`)

**Issue:** Local state (`sessions` array) can get out of sync with server state. When sessions are created/updated/deleted, the local state is updated optimistically, but if the API call fails, the state remains incorrect.

**Example:** `LibraryScreen.tsx:27-45`
```typescript
const loadSessions = async () => {
  const existingCustomSessions = sessions.filter(s => s.id.startsWith("temp-"));
  const mergedSessions = [...existingCustomSessions, ...data.sessions];
  setSessions(mergedSessions);
};
```

**Issues:**
- If a temp session was saved to server, it will appear twice (once as temp, once from API)
- Failed API calls don't rollback optimistic updates
- No conflict resolution for concurrent edits

**Fix:** 
1. Remove temp sessions that were successfully saved
2. Add error handling to rollback optimistic updates
3. Use React Query for better cache management

---

### 6. **Missing Error Handling After Limit Check** ⚠️ LOW PRIORITY
**Location:** `backend/src/routes/sessions.ts:456-465`

**Issue:** If session creation fails after limit check passes, the counter is still incremented.

**Current Code:**
```typescript
// Check limit ✅
if (!canCreate) return error;

// Create session (could fail)
const sessionId = await db.affirmationSession.create({...});

// Increment counter (always runs, even if create failed)
await db.userSubscription.update({...});
```

**Fix:** Use transaction or try/catch:
```typescript
if (user) {
  const userSubscription = await getOrCreateSubscription(user.id);
  
  try {
    const sessionId = await db.affirmationSession.create({...});
    
    // Only increment if creation succeeded
    await db.userSubscription.update({
      where: { userId: user.id },
      data: { customSessionsUsedThisMonth: userSubscription.customSessionsUsedThisMonth + 1 }
    });
  } catch (error) {
    // Don't increment counter if creation failed
    throw error;
  }
}
```

---

## 🟡 Type Safety Issues

### 7. **Excessive Use of `any` Type**
**Locations:** Multiple files

**Examples:**
- `src/screens/CreateSessionScreen.tsx:64` - `const response: any = await api.post(...)`
- `src/screens/CreateSessionScreen.tsx:78` - `catch (error: any)`
- `src/navigation/RootNavigator.tsx:92` - `const setSubscription = useAppStore((s: any) => s.setSubscription)`

**Fix:** Use proper types from contracts:
```typescript
import type { GenerateSessionResponse } from "@/shared/contracts";

const response = await api.post<GenerateSessionResponse>("/api/sessions/generate", {...});
```

---

## 🟢 Improvements & Enhancements

### 8. **Implement Actual Audio Playback** 📝 TODO
**Location:** `src/screens/PlaybackScreen.tsx:356`

**Current:** Audio playback is simulated with a timer. TTS endpoint exists but isn't integrated.

**TODO Comment:**
```typescript
// TODO: Implement actual audio playback with ElevenLabs
```

**Recommendation:** Integrate `expo-audio` with the TTS endpoint:
```typescript
import { Audio } from 'expo-audio';

const [sound, setSound] = useState<Audio.Sound | null>(null);

useEffect(() => {
  if (!session) return;
  
  const loadAudio = async () => {
    const { sound: audioSound } = await Audio.Sound.createAsync(
      { uri: `${BACKEND_URL}/api/tts/generate-session` },
      { shouldPlay: false }
    );
    setSound(audioSound);
  };
  
  loadAudio();
  
  return () => {
    sound?.unloadAsync();
  };
}, [session]);
```

---

### 9. **Add Rate Limiting** 🔒 SECURITY
**Location:** `backend/src/routes/tts.ts`, `backend/src/routes/sessions.ts`

**Issue:** No rate limiting on expensive endpoints (TTS, OpenAI calls). Vulnerable to abuse.

**Recommendation:** Add rate limiting middleware:
```typescript
// backend/src/middleware/rateLimit.ts
import { rateLimiter } from 'hono-rate-limiter';

export const ttsRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 requests per window
  keyGenerator: (c) => c.get('user')?.id || c.req.header('x-forwarded-for') || 'anonymous',
});

// Apply to routes
ttsRouter.post("/generate-session", ttsRateLimit, zValidator(...), async (c) => {...});
```

---

### 10. **Improve Error Messages** 💬 UX
**Location:** Multiple API endpoints

**Issue:** Generic error messages don't help users understand what went wrong.

**Examples:**
- `"Failed to generate session. Please try again."` - Doesn't explain why
- `"Unauthorized"` - Doesn't guide user to login

**Recommendation:** Return structured error responses:
```typescript
// shared/contracts.ts
export const errorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.any()).optional(),
});

// Backend
return c.json({
  error: "Subscription limit reached",
  code: "SUBSCRIPTION_LIMIT_EXCEEDED",
  details: {
    limit: limit,
    used: userSubscription.customSessionsUsedThisMonth,
    upgradeUrl: "/subscription"
  }
}, 403);
```

---

### 11. **Add Input Validation for Affirmations** ✅ VALIDATION
**Location:** `backend/src/routes/sessions.ts`

**Issue:** No validation on affirmation length, content, or count.

**Current:** Accepts any array of strings.

**Recommendation:** Add validation:
```typescript
// In createCustomSessionRequestSchema
affirmations: z.array(
  z.string()
    .min(3, "Affirmation must be at least 3 characters")
    .max(200, "Affirmation must be less than 200 characters")
).min(1, "At least one affirmation required").max(20, "Maximum 20 affirmations")
```

---

### 12. **Optimize Session Loading** ⚡ PERFORMANCE
**Location:** `src/screens/HomeScreen.tsx`, `src/screens/LibraryScreen.tsx`

**Issue:** Sessions are loaded on every mount, even if already cached.

**Recommendation:** Use React Query for caching:
```typescript
import { useQuery } from "@tanstack/react-query";

const { data: sessions = [] } = useQuery({
  queryKey: ["sessions"],
  queryFn: () => api.get<GetSessionsResponse>("/api/sessions"),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

### 13. **Add Loading States** 🔄 UX
**Location:** Multiple screens

**Issue:** Some operations (favorite toggle, delete) don't show loading states.

**Recommendation:** Add loading indicators:
```typescript
const [isTogglingFavorite, setIsTogglingFavorite] = useState<string | null>(null);

const toggleFavorite = async (sessionId: string) => {
  setIsTogglingFavorite(sessionId);
  try {
    await api.patch(...);
  } finally {
    setIsTogglingFavorite(null);
  }
};
```

---

### 14. **Add Retry Logic for Failed API Calls** 🔁 RELIABILITY
**Location:** `src/lib/api.ts`

**Issue:** Network failures cause immediate errors. No retry for transient failures.

**Recommendation:** Add exponential backoff retry:
```typescript
async function fetchWithRetry<T>(path: string, options: FetchOptions, retries = 3): Promise<T> {
  try {
    return await fetchFn<T>(path, options);
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      return fetchWithRetry(path, options, retries - 1);
    }
    throw error;
  }
}
```

---

### 15. **Add Database Indexes** 🗄️ PERFORMANCE
**Location:** `backend/prisma/schema.prisma`

**Issue:** Missing indexes on frequently queried fields.

**Recommendation:** Add indexes:
```prisma
model AffirmationSession {
  // ...
  userId       String
  isFavorite   Boolean  @default(false)
  createdAt    DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([userId, isFavorite])
}
```

---

## 📊 Summary

| Priority | Count | Category |
|----------|-------|----------|
| 🔴 Critical | 6 | Bugs |
| 🟡 Medium | 3 | Type Safety |
| 🟢 Low | 6 | Improvements |

**Total Issues Found:** 15

**Recommended Fix Order:**
1. Race condition in subscription limits (Bug #1)
2. useEffect dependency issue (Bug #2)
3. Monthly reset automation (Bug #4)
4. Add rate limiting (Improvement #9)
5. Implement audio playback (Improvement #8)
6. Fix type safety (Improvement #7)
7. Add error handling improvements (Bug #6, Improvement #10)

---

## 🔍 Additional Notes

- **Testing:** No test files found. Consider adding unit tests for critical paths (subscription limits, session creation).
- **Documentation:** API endpoints are well-documented, but could benefit from OpenAPI/Swagger spec.
- **Monitoring:** Consider adding error tracking (Sentry) and analytics for subscription usage patterns.

