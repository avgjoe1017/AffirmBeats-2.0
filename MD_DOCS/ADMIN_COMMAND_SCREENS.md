# Admin Command Screens

Complete admin interface for managing AffirmBeats operations.

## Access

All admin screens are available at:
- **Dashboard**: `http://localhost:3000/admin`
- **Affirmation Library**: `http://localhost:3000/admin/affirmations`
- **User Management**: `http://localhost:3000/admin/users`
- **Generation Logs**: `http://localhost:3000/admin/logs`
- **Session Templates**: `http://localhost:3000/admin/templates`
- **Default Sessions**: `http://localhost:3000/admin/default-sessions`
- **Voice & Audio**: `http://localhost:3000/admin/voice-settings`
- **System Config**: `http://localhost:3000/admin/config`

## Features

### 1. 📊 Dashboard (`/admin`)
- Real-time stats (last 24 hours)
- Cost breakdown by match type
- Library health metrics
- Quality comparison
- User metrics
- Recent activity feed
- Alerts and action items
- Auto-refresh every 5 minutes

### 2. 📚 Affirmation Library (`/admin/affirmations`)
**CRUD Operations:**
- ✅ View all affirmations with filtering
- ✅ Create new affirmations
- ✅ Edit existing affirmations
- ✅ Delete affirmations (with template usage checks)

**Filtering:**
- By goal (sleep, focus, calm, manifest)
- By minimum rating
- Search by text or tags
- Sort by usage, rating, or date

**Features:**
- Pagination (50 per page)
- Inline editing modal
- Delete protection (warns if used in templates)
- Tag management
- Emotion tracking

### 3. 👥 User Management (`/admin/users`)
**View Users:**
- List all users with pagination
- Filter by tier (free/pro)
- Search by email or name
- View user stats (sessions, usage, last active)

**User Actions:**
- View detailed user profile
- Change subscription tier (grant/revoke Pro)
- Reset monthly usage counter
- View recent sessions and activity

**User Details Include:**
- Total sessions generated
- Favorite count
- Replay count
- Average rating
- Recent generation history

### 4. 📊 Generation Logs (`/admin/logs`)
**View Logs:**
- Filter by date range (default: last 7 days)
- Filter by goal
- Filter by match type (exact, pooled, generated)
- View cost statistics

**Log Details:**
- User intent
- Match type and confidence
- Template used (if exact match)
- Affirmations used (if pooled)
- Cost breakdown
- User rating and replay status

**Features:**
- Export to CSV
- Cost analysis (total, average, savings)
- Detailed log view modal
- Pagination (100 per page)

### 5. 🎨 Session Templates (`/admin/templates`)
**CRUD Operations:**
- ✅ View all templates with usage stats
- ✅ Create new templates
- ✅ Edit existing templates
- ✅ Delete templates (cannot delete defaults)

**Template Fields:**
- Title and goal
- Intent and keywords for matching
- Affirmation IDs (references to library)
- Binaural settings
- Duration

**Features:**
- View match rate and usage statistics
- See which affirmations are used in each template
- Protection against deleting default templates

### 6. 🎯 Default Sessions (`/admin/default-sessions`)
**View Default Sessions:**
- List all 8 default sessions
- View affirmations, voice, pace, background settings
- See binaural frequency settings

**Note:** These are read-only as they're defined in code (`sessions.ts`). To modify, edit the `DEFAULT_SESSIONS` array.

### 7. 🎤 Voice & Audio Settings (`/admin/voice-settings`)
**View Voice Configuration:**
- See all voice settings (Neutral, Confident, Whisper)
- View ElevenLabs voice IDs
- Check stability and similarity parameters
- See tier restrictions (free vs pro)

**Binaural Frequencies:**
- View all frequency categories (Delta, Theta, Alpha, Beta, Gamma)
- See Hz ranges and descriptions

**Note:** Currently read-only. Edit in backend code.

### 8. ⚙️ System Configuration (`/admin/config`)
**Matching Thresholds:**
- Exact match confidence threshold
- Pooled match confidence threshold

**Cost Limits:**
- Daily cost alert threshold
- Monthly budget limit
- Max cost per session

**Generation Strategy:**
- Always generate first session toggle
- Pro user generation rate
- Free user generation rate

**Note:** Changes are not persisted yet. Implement config storage for production.

## API Endpoints

### Affirmations
- `GET /api/admin/affirmations` - List with filtering
- `POST /api/admin/affirmations` - Create new
- `PATCH /api/admin/affirmations/:id` - Update
- `DELETE /api/admin/affirmations/:id` - Delete (checks template usage)

### Users
- `GET /api/admin/users` - List with filtering
- `GET /api/admin/users/:id` - Get user details
- `PATCH /api/admin/users/:id/tier` - Change subscription tier
- `POST /api/admin/users/:id/reset-usage` - Reset monthly usage

### Templates
- `GET /api/admin/templates` - List all templates with stats

### Logs
- `GET /api/admin/logs` - List with filtering
- `GET /api/admin/logs/:id` - Get detailed log entry

## Implementation Status

✅ **Completed:**
- Dashboard with real-time metrics
- Affirmation Library Manager (CRUD)
- User Management (view, tier changes, usage reset)
- Generation Logs viewer (filtering, details)
- Session Template Manager (create/edit templates)
- Default Session Editor (view-only, read from code)
- Voice & Audio Settings (view-only)
- System Configuration (view/edit, not persisted)

## Security Note

⚠️ **IMPORTANT**: These admin screens currently have NO authentication. Add admin authentication middleware before deploying to production.

See `MD_DOCS/ADMIN_DASHBOARD_ACCESS.md` for implementation guide.

## Usage Tips

1. **Affirmation Library**: Use filters to find low-rated affirmations that need review
2. **User Management**: Check users hitting free tier limits for conversion opportunities
3. **Logs**: Monitor cost trends and identify frequently unmatched intents
4. **Dashboard**: Set up alerts for cost spikes or quality issues

## Keyboard Shortcuts

- **Enter** in search fields triggers filter/search
- **Escape** closes modals
- **Auto-refresh** on dashboard (5 minutes)

