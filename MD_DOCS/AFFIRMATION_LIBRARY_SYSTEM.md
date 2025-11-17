# Affirmation Library System - Implementation Guide

**Last Updated:** 2025-01-27  
**Status:** ✅ Implemented and Ready for Migration

---

## 🎯 Overview

The Hybrid Affirmation Library System reduces API costs by 60-85% while maintaining quality through intelligent matching. Instead of generating every session with AI, the system:

1. **Tries exact matches first** (pre-built templates) - $0 cost
2. **Falls back to pooled affirmations** (combine existing) - $0.10 cost (TTS only)
3. **Generates new only when needed** - $0.21 cost (full AI + TTS)

---

## 🏗️ Architecture

### Three-Tier Matching System

```
User Request: "Help me sleep better"
    │
    ▼
┌─────────────────────────────────┐
│ TIER 1: Exact Template Match    │
│ - Check SessionTemplate table   │
│ - Keyword-based matching        │
│ - Cost: $0 (already exists)     │
└─────────────┬───────────────────┘
              │ No match (confidence < 0.75)
              ▼
┌─────────────────────────────────┐
│ TIER 2: Pooled Affirmations      │
│ - Extract themes from intent    │
│ - Select diverse affirmations   │
│ - Cost: $0.10 (TTS only)        │
└─────────────┬───────────────────┘
              │ No good match (confidence < 0.65)
              ▼
┌─────────────────────────────────┐
│ TIER 3: Full AI Generation      │
│ - Use OpenAI with new prompt    │
│ - Save to pool for future       │
│ - Cost: $0.21 (OpenAI + TTS)    │
└─────────────────────────────────┘
```

---

## 📊 Database Schema

### New Models

#### `AffirmationLine`
Individual affirmations stored in the pool:
- `text`: The affirmation text
- `goal`: sleep/focus/calm/manifest
- `tags`: Array of keywords for matching
- `emotion`: Primary emotion (peace, confidence, etc.)
- `useCount`: How many times used
- `userRating`: Average rating (1-5)

#### `SessionTemplate`
Pre-built session templates for exact matching:
- `intent`: User intent text ("help me sleep")
- `intentKeywords`: Extracted keywords for matching
- `affirmationIds`: Array of AffirmationLine IDs
- `useCount`: Popularity tracking
- `userRating`: Quality metric

#### `GenerationLog`
Tracks every generation for analytics:
- `matchType`: exact/pooled/generated/fallback
- `apiCost`: Actual cost in dollars
- `confidence`: Match confidence (0-1)
- `userRating`: User feedback (1-5)
- `wasReplayed`: Did user replay it?

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration

```bash
cd backend
bunx prisma migrate dev --name add_affirmation_library
```

This creates the three new tables: `affirmation_line`, `session_template`, and `generation_log`.

### Step 2: Seed Initial Library

```bash
bun run backend/scripts/seed-affirmation-library.ts
```

This populates the library with:
- ~24 affirmations from default sessions
- 4 session templates for common intents
- Keywords and themes for matching

### Step 3: Verify It's Working

Check the logs when generating a session. You should see:
- `"Using exact template match"` - Tier 1 working
- `"Using pooled affirmations"` - Tier 2 working
- `"Generating new affirmations with AI"` - Tier 3 (fallback)

---

## 📈 How It Works

### Matching Algorithm

1. **Exact Match (Tier 1)**
   - Extracts keywords from user intent
   - Searches `SessionTemplate` for keyword overlap
   - Uses PostgreSQL array overlap operator (`&&`)
   - Requires confidence > 0.75

2. **Pooled Match (Tier 2)**
   - Extracts emotional themes using AI
   - Finds affirmations matching themes
   - Selects diverse affirmations (avoids repetition)
   - Requires confidence > 0.65

3. **Full Generation (Tier 3)**
   - Uses your new `createAffirmationPrompt()` function
   - Generates 6-10 personalized affirmations
   - Automatically saves to pool for future use

### Quality Guardrails

- **Always generate for first session** (best impression)
- **Never use pooled if confidence < 0.65** (quality over cost)
- **Save all generated affirmations** (builds library over time)

---

## 💰 Cost Tracking

Every generation is logged in `GenerationLog` with:
- `matchType`: Which tier was used
- `apiCost`: Actual cost ($0, $0.10, or $0.21)
- `confidence`: Match quality score

### Query Cost Savings

```sql
-- Total cost this month
SELECT 
  match_type,
  COUNT(*) as sessions,
  SUM(api_cost) as total_cost
FROM generation_log
WHERE created_at >= date_trunc('month', now())
GROUP BY match_type;

-- Cost savings vs. full generation
SELECT 
  COUNT(*) * 0.21 - SUM(api_cost) as savings
FROM generation_log
WHERE created_at >= date_trunc('month', now());
```

---

## 🎯 Feedback System

### Rating Endpoint

```typescript
POST /api/sessions/:id/feedback
{
  "rating": 5,           // 1-5 stars
  "wasReplayed": true     // Did they play it again?
}
```

### Automatic Quality Boosting

When a pooled session gets 4+ stars:
- Affirmation ratings increase
- Use counts increment
- Better affirmations rise to top

When an exact match gets 4+ stars:
- Template rating increases
- Template use count increments

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Match Distribution**
   - What % are exact/pooled/generated?
   - Target: 85% pooled by month 6

2. **Cost Per Session**
   - Should drop from $0.21 → <$0.10
   - Track monthly trends

3. **Quality Metrics**
   - Average rating by match type
   - Replay rate by match type
   - Pooled should match generated quality

4. **Library Growth**
   - Affirmations in pool (should grow)
   - Templates created (should stabilize)

### Example Queries

```sql
-- Match type distribution
SELECT 
  match_type,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM generation_log
WHERE created_at >= date_trunc('month', now())
GROUP BY match_type;

-- Quality by match type
SELECT 
  match_type,
  AVG(user_rating) as avg_rating,
  COUNT(*) FILTER (WHERE was_replayed) * 100.0 / COUNT(*) as replay_rate
FROM generation_log
WHERE was_rated = true
GROUP BY match_type;
```

---

## 🔧 Configuration

### Confidence Thresholds

Located in `backend/src/lib/affirmationMatcher.ts`:

```typescript
// Tier 1: Exact match
if (exactMatch && exactMatch.confidence > 0.75) { ... }

// Tier 2: Pooled match
if (pooledMatch && pooledMatch.confidence > 0.65) { ... }
```

**Adjust these based on quality metrics:**
- If users notice quality drop → increase thresholds
- If too many generations → decrease thresholds

### First Session Behavior

Always generates for first session (best impression). Located in:
```typescript
// backend/src/lib/affirmationMatcher.ts
if (isFirstSession) {
  return await generateNewAffirmations(userIntent, goal);
}
```

---

## 🚨 Troubleshooting

### Issue: All sessions are being generated (no matches)

**Check:**
1. Is the library seeded? Run seed script
2. Are keywords being extracted? Check logs
3. Are confidence thresholds too high? Lower them

### Issue: Quality is dropping with pooled sessions

**Solutions:**
1. Increase confidence thresholds
2. Improve theme extraction (uses AI, should be good)
3. Review low-rated pooled sessions and regenerate

### Issue: Database errors with array operations

**Check:**
1. Are you using PostgreSQL? (SQLite doesn't support arrays)
2. Is the migration complete?
3. Check Prisma schema for array types

---

## 📝 Future Enhancements

### Phase 2 (Month 3-4)
- [ ] Vector embeddings for semantic search (pgvector)
- [ ] A/B testing framework for quality validation
- [ ] Automatic template creation from popular sessions

### Phase 3 (Month 5-6)
- [ ] Machine learning for better theme matching
- [ ] User-specific affirmation preferences
- [ ] Dynamic confidence thresholds based on user tier

---

## 🎓 Best Practices

1. **Monitor quality closely** - Don't sacrifice quality for cost
2. **Gradually increase pooled %** - Start conservative, ease into it
3. **Review low-rated sessions** - Regenerate and improve pool
4. **Track cost savings** - Celebrate the wins!
5. **Keep generating unique requests** - Don't force matches

---

## 📞 Support

If you encounter issues:
1. Check `GenerationLog` table for match patterns
2. Review logs for confidence scores
3. Query database for quality metrics
4. Adjust thresholds based on data

---

**The system is production-ready. Run the migration and seed script to get started!** 🚀

