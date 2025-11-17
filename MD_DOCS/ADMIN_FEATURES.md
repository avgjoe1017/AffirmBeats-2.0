# Admin Features Documentation

## 🔐 Authentication

All admin routes now require authentication. Configure admin access via environment variable:

```bash
# .env file
ADMIN_EMAILS=admin@example.com,another@example.com
```

**How it works:**
- User must be logged in (Better Auth session required)
- User's email must be in `ADMIN_EMAILS` (comma-separated)
- If `ADMIN_EMAILS` is not set, any authenticated user can access (development mode)

**Accessing admin pages:**
1. Sign in at `/api/auth/sign-in/email`
2. Navigate to `/admin` or any admin page
3. If not authenticated, you'll get a 401 error

## 💾 Config Persistence

System configuration is now persisted to `backend/config.json`.

**What's stored:**
- Matching thresholds (exact/pooled confidence)
- Cost limits (daily alert, monthly budget, max per session)
- Generation strategy (pro/free user rates)

**How to use:**
1. Go to `/admin/config`
2. Update values
3. Click "Save Configuration"
4. Config is saved to `backend/config.json`

**Default config:**
If `config.json` doesn't exist, defaults are used. First save creates the file.

## 🎤 Voice Testing

Test TTS generation with any voice directly from the admin panel.

**How to use:**
1. Go to `/admin/voice-settings`
2. Click "🧪 Test" button on any voice
3. Enter text to test (or use default)
4. Audio is generated and played automatically

**API Endpoint:**
```bash
POST /api/admin/voice/test
{
  "voice": "neutral" | "confident" | "whisper",
  "text": "Your test text here"
}
```

**Response:**
```json
{
  "success": true,
  "voice": "neutral",
  "text": "I am calm, centered, and at peace.",
  "audioBase64": "...",
  "audioFormat": "audio/mpeg",
  "size": 12345
}
```

## 📦 Bulk Operations

### Affirmations

**Bulk Delete:**
1. Select affirmations using checkboxes
2. Click "Bulk Actions" button
3. Choose option 1 (Delete)
4. Confirm deletion

**Bulk Update Goal:**
1. Select affirmations
2. Click "Bulk Actions"
3. Choose option 2 (Update Goal)
4. Enter new goal (sleep/focus/calm/manifest)

**API Endpoints:**
```bash
POST /api/admin/affirmations/bulk-delete
{
  "ids": ["aff_1", "aff_2", ...]
}

POST /api/admin/affirmations/bulk-update
{
  "ids": ["aff_1", "aff_2", ...],
  "updates": {
    "goal": "sleep",
    "tags": ["calm", "peace"],
    "emotion": "peace"
  }
}
```

### Templates

**Bulk Delete:**
```bash
POST /api/admin/templates/bulk-delete
{
  "ids": ["template_1", "template_2", ...]
}
```

**Protections:**
- Cannot delete affirmations used in templates
- Cannot delete default templates
- Bulk operations limited to 100 items at a time

## 🚀 Quick Start

1. **Set up admin access:**
   ```bash
   echo "ADMIN_EMAILS=your@email.com" >> backend/.env
   ```

2. **Sign in:**
   - Go to your app and sign in
   - Or use API: `POST /api/auth/sign-in/email`

3. **Access admin:**
   - Open `http://localhost:3000/admin`
   - All routes are protected automatically

4. **Test voice:**
   - Go to `/admin/voice-settings`
   - Click test button on any voice

5. **Bulk operations:**
   - Go to `/admin/affirmations`
   - Select items with checkboxes
   - Use bulk actions button

## 🔒 Security Notes

- **Production:** Always set `ADMIN_EMAILS` in production
- **Development:** If `ADMIN_EMAILS` is empty, any authenticated user can access
- **HTTPS:** Use HTTPS in production for secure cookie transmission
- **Session:** Admin access requires valid Better Auth session

## 📝 Files Created

- `backend/src/middleware/adminAuth.ts` - Authentication middleware
- `backend/src/lib/configStorage.ts` - Config persistence
- `backend/config.json` - Config file (created on first save)

## 🐛 Troubleshooting

**401 Unauthorized:**
- Make sure you're signed in
- Check that your email is in `ADMIN_EMAILS`

**403 Forbidden:**
- Your email is not in the admin list
- Add your email to `ADMIN_EMAILS` env var

**Config not saving:**
- Check file permissions on `backend/config.json`
- Ensure backend directory is writable

**Voice test fails:**
- Check `ELEVENLABS_API_KEY` is set
- Verify API key is valid
- Check network connectivity

