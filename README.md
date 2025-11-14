# Affirmation Beats

**Hear what you need to believe.**

Affirmation Beats is an AI-powered wellness app that generates personalized affirmation audio sessions paired with calming soundscapes. Built with Expo and React Native.

## Recent Updates

- **Enhanced AI Generation Button**: Redesigned the "Generate with AI" button with premium look
  - New copy: "Let AI Create Magic" for more emotional appeal
  - Sparkles icon in a frosted glass circle for visual interest
  - Added shadow depth and scale animation on press
  - Loading state: "Crafting Your Session..." for better experience
  - More spacing and tracking for premium feel
- **Fixed Custom Session Creation Crash**: Resolved crash when creating new custom sessions
  - Fixed type mismatch when setting current session after creation
  - Properly transformed CreateCustomSessionResponse to match GenerateSessionResponse type
  - Custom sessions now navigate to playback without crashing
  - All session fields (binauralCategory, binauralHz) properly mapped
- **AI-First Custom Session Creation**: Redesigned CreateSession screen with intelligent workflow
  - Single text input: "What do you want to create?" - describe your intention
  - AI automatically generates title, picks optimal frequency, and writes affirmations
  - Everything is editable: manually adjust name, frequency type, and affirmations
  - Option to create manually from scratch
  - Seamless paywall integration for free tier limits
- **Premium Subscription Tiers**: Added Free and Pro subscription system
  - Free Tier: 1 custom session/month, 2 standard voices (Neutral, Confident), all preloaded sessions
  - Pro Tier: $6.99/month or $49.99/year - Unlimited custom sessions, all premium voices (Whisper), priority support
  - Subscription management screen with upgrade/cancel functionality
  - Usage tracking for custom sessions with monthly reset
  - Premium voice paywall in Settings with smooth upgrade flow
  - CreateSession screen enforces limits with inline upgrade prompt
- **Audio Mixer Controls**: Added settings button in playback screen with volume sliders
  - Three independent sliders: Affirmations, Binaural Beats, and Background Noise
  - Real-time volume adjustment from 0-100% for each audio layer
  - Settings persist across app restarts
  - Accessible via gear icon in playback header
  - Beautiful modal design matching session colors
- **Fixed Playback Navigation**: Minimizing from playback now takes you to Home tab
  - After creating a session and playing it, minimize/back button goes to Home instead of CreateSession
  - Prevents confusing navigation flow where users end up back in the editor
  - Provides consistent experience - playback always minimizes to Home tab
- **Fixed Favorite Toggle for Guest Users**: Removed 401 errors when favoriting sessions
  - Guest sessions (temp-*) and default sessions (default-*) now update locally without API calls
  - Only authenticated users' saved sessions trigger backend API updates
  - No more error logs when guest users favorite/unfavorite sessions
  - Smooth, consistent experience for all users
- **Fixed Custom Session Editing**: Custom sessions now save properly when edited
  - Added PATCH /api/sessions/:id endpoint to update sessions in the database
  - CreateSession screen now calls the API when editing authenticated user sessions
  - Guest users (temp sessions) continue to save locally without API calls
  - Error handling shows message if server update fails while local changes succeed
- **Edit Custom Sessions**: Added ability to edit custom sessions in the Library
  - Pencil (edit) icon appears on all custom sessions (non-default)
  - Opens CreateSession screen pre-filled with session data
  - Save changes updates the session in-place
  - Changes header to "Edit Session" and button to "Save Changes"
- **Removed SAMPLE Badge**: Cleaned up default sessions by removing the SAMPLE tag
  - Default sessions now appear cleaner in the Library
  - Still cannot be edited or deleted (protected)
- **First-Person Affirmations**: All affirmations now use first person ("I am", "My", "I") for more personal, powerful impact
  - Updated AI generation prompts to create first-person affirmations
  - Converted all default sessions to first person
  - Converted all fallback affirmations to first person
  - More empowering and personal than second-person ("You are")
- **Redesigned Organic Player Visualization**: Completely reimagined with a meditative particle field design
  - 25 floating particles that drift like dust in light, each with unique movement patterns
  - Central breathing circle with concentric rings that expand/contract over 8 seconds
  - Smooth pauses at the beginning/end of movements before reversing direction
  - Very slow rotation (60 seconds per full cycle) for subtle, calming motion
  - Ambient background glow that increases with playback progress
  - Non-linear, organic approach - no waves or bars, just peaceful floating elements
  - Designed to be hypnotic and meditative rather than technical
- **Fixed MiniPlayer Consistency Issue**: MiniPlayer now appears reliably when minimized
  - PlaybackScreen now automatically sets current session for MiniPlayer to work
  - Fixes issue where MiniPlayer wouldn't show when navigating back from Playback
  - Ensures currentSession is always set when playing any session from library
  - MiniPlayer appears consistently above tab bar when session is active
- **Fixed Favorite/Save Bug**: First session favoriting now works correctly
  - Fixed issue where favoriting the first generated session would not persist
  - HomeScreen now properly merges temp sessions with API sessions
  - Both HomeScreen and LibraryScreen preserve guest user sessions when fetching from API
  - Favorited sessions remain in library after navigation
  - Fixed delete session error for guest users - temp sessions now delete locally without API call
  - No more 401 errors when guest users delete their sessions
- **Enhanced Onboarding Flow**: Completely redesigned 3-step onboarding with AI-powered personalization
  - Step 1: User enters their name (character counter with validation)
  - Step 2: User selects their focus area (Sleep, Focus, Calm, or Manifest)
  - Step 3: User describes what they want to work on (custom intention input)
  - AI generates 6-10 personalized affirmations based on user's specific goal
  - Button changes to "Create My First Session" on final step
  - Seamless transition from onboarding to AI generation to playback
  - Users immediately experience the power of AI-generated affirmations
- **Improved API Error Handling**: Enhanced fetch client with better debugging
  - Added detailed logging for all API requests and responses
  - Content-type validation to ensure JSON responses
  - Better error messages when receiving non-JSON responses
  - Improved debugging output for troubleshooting API issues
  - Fixed JSON parse errors by validating response content type
- **Improved Create Session UX**: Enhanced error handling and user feedback
  - Added helpful messages when Create Session button is disabled
  - Clear guidance on what's needed: session name, binaural category, affirmations
  - Error messages displayed prominently when session creation fails
  - Better error handling with specific error messages
  - Users are now guided step-by-step through the creation process
- **Mini Player with Minimize**: Persistent player that follows you throughout the app
  - Mini player appears at bottom above tab bar when session is active
  - Shows session title, goal, and playback progress
  - Play/pause controls and close button
  - Tap to expand to full playback screen
  - Minimize button (chevron down) in playback screen to return to tabs
- **Persistent Session Storage**: Sessions and preferences now persist across app restarts
  - Zustand store with AsyncStorage persistence
  - Custom sessions saved locally for guest users
  - Preferences, onboarding status, and user name persisted
  - Sessions survive app refresh and reload
- **Migrated to expo-audio**: Upgraded from deprecated expo-av to expo-audio
  - Future-proof for Expo SDK 54+ compatibility
  - Cleaner API with modern hooks
  - No more deprecation warnings
- **Background Audio Playback**: Player continues playing when app is minimized
  - Audio mode configured for background playback on both iOS and Android
  - iOS background audio mode enabled in app.json
  - App state monitoring to maintain playback
  - Audio continues in silent mode and when switching apps
- **Custom Session Library Fix**: Custom sessions now persist in library for guest users
  - Both guest and authenticated users can save custom sessions
  - Library screen now merges custom sessions with default sessions
  - Guest sessions (temp-*) are preserved when loading library
  - Sessions appear immediately in Library after creation and persist across refreshes
- **Custom Session Creation**: Full workflow for building personalized sessions
  - Name your session with character counter (0/50)
  - Choose binaural beats category: Delta (0.5-4 Hz), Theta (4-8 Hz), Alpha (8-14 Hz), Beta (14-30 Hz), or Gamma (30-100 Hz)
  - Multiple affirmation input methods:
    - Library selection (coming soon)
    - Write your own custom affirmations with add/remove controls
    - AI generation: describe what you want and get 6-10 affirmations (coming soon)
  - Sessions saved to database for authenticated users
  - Backend endpoint: POST /api/sessions/create
  - Automatic goal inference from binaural category
  - Navigate directly to playback after creation
  - Binaural frequency displayed on all session cards (category + Hz range)
- **Enhanced Settings Screen**: Complete redesign with better UX
  - Voice dropdown with 3 options (Neutral, Confident, Whisper) with descriptions
  - Background sounds dropdown with 8 options: None, Rain, Brown Noise, Ocean Waves, Forest, Wind Chimes, Fireplace, Distant Thunder
  - Duration options: 3 minutes, 30 minutes, or Unlimited
  - Affirmation spacing selector: Choose from 3, 5, 8, 10, 15, 20, or 30 seconds between affirmations
  - Modal-based selection for voice and background sounds
  - Horizontal scrolling number picker for spacing control
- **New Manifest Category**: Fourth goal type added for manifestation and abundance
  - "Manifest" preset with purple-to-gold gradient and Sparkles icon
  - 2 default Manifest sessions: "Abundance Flow" (6 min) and "Dream Builder" (9 min)
  - Powerful affirmations focused on goals, abundance, and reality creation
  - Theme label: "Abundance & Goals"
  - Available in Home, Library filters, and Onboarding
- **Default Sample Sessions**: 8 professionally-crafted sample sessions included for all users
  - 2 Sleep sessions: "Evening Wind Down" (10 min) and "Deep Rest" (15 min)
  - 2 Focus sessions: "Morning Momentum" (5 min) and "Power Hour" (3 min)
  - 2 Calm sessions: "Midday Reset" (7 min) and "Gentle Presence" (8 min)
  - 2 Manifest sessions: "Abundance Flow" (6 min) and "Dream Builder" (9 min)
  - Sample sessions marked with "SAMPLE" badge and cannot be deleted
  - Available to both guest users and authenticated users
  - Allows users to try the app immediately without generating content
- **Enhanced Home Screen UX**: Redesigned following professional app design principles
  - "Jump Back In" section with horizontal carousel showing last 3 played sessions
  - Quick replay of recent sessions with large play buttons
  - Section headers with proper typography hierarchy ("CHOOSE YOUR FOCUS")
  - Enhanced preset cards with icon backgrounds and better visual balance
  - "View All" link for easy navigation to Library
- **Improved Library Experience**: Professional card design with better information architecture
  - Filter pills for content filtering (All / Sleep / Focus / Calm)
  - Active/inactive pill states with white background + black text when selected
  - Activity/theme labels on each card ("Rest & Recovery", "Deep Work", "Peace & Presence")
  - Improved card anatomy with header, theme label, and action rows
  - Better visual hierarchy with borders and spacing
  - Affirmation count display on each card
  - Empty state handling for filtered results
- **Better Visual Design**:
  - Consistent card dimensions and corner radius (20-24pt)
  - Proper spacing between sections (24-32pt)
  - Typography hierarchy: section labels in uppercase gray, titles in bold white
  - Category tags with background pills (SLEEP/FOCUS/CALM)
  - Icon refinements with proper sizing and backgrounds
- **Enhanced Onboarding UX**: 3-step personalized onboarding flow
  - Step 1: Name input with character counter (0/20) and validation
  - Step 2: Goal selection with visual feedback and checkmarks
  - Step 3: Custom intention input where users describe what they want to work on
  - AI generates personalized affirmations based on user's specific intention
  - Direct navigation to generation and playback after onboarding
  - "Skip for now" option available throughout
  - Step indicators (1 of 3, 2 of 3, 3 of 3) for clear progression
  - User name saved and displayed in Home greeting
- **Improved Library Empty State**: Added CTA button
  - "Generate Your First Session" button navigates users to Home tab
  - More actionable than plain text
- Fixed rendering issue: Added `style={{ flex: 1 }}` to `GestureHandlerRootView` in App.tsx
- **No Authentication Required**: App now works fully without login
  - Guest users can generate and play affirmation sessions
  - Settings saved locally for all users
  - Sessions saved to database only for authenticated users
  - Temporary session IDs generated for guest users
- **Complete Playback Screen**: Fully functional playback interface
  - Meditative particle field visualization with 25 floating elements
  - Central breathing circle that guides meditation breathing (8-second cycles)
  - Smooth pauses at movement transitions for calming effect
  - Large play/pause button with restart and regenerate controls
  - Real-time progress bar and time display (e.g., "3:42 / 10:00")
  - Collapsible affirmation transcript with numbered items
  - Favorite button in header for quick access
  - Simulated playback with timer (ready for audio integration)
- **Enhanced Library Experience**:
  - Added play icon for visual affordance
  - Display session duration on each card (e.g., "3:00")
  - Fixed button event propagation (heart/delete don't trigger playback)
- **Session Duration Control**: Added duration setting (3/10/30 min) to Settings screen
- **Local-First Preferences**: Users can customize settings without authentication
  - Default preferences provided (neutral voice, normal pace, rain background, 3 min duration)
  - Settings saved locally in Zustand store
- **ElevenLabs Integration**: Added text-to-speech API integration for generating audio affirmations
  - New backend route `/api/tts/generate` for single text-to-speech conversion
  - New backend route `/api/tts/generate-session` for full session audio with background
  - Three voice types supported: neutral, confident, whisper
  - Pace control: slow, normal, fast

## Features

- **Smart Generation**: AI-crafted affirmations tailored to your goals (Sleep, Focus, Calm, Manifest)
- **Beautiful UI**: Immersive gradients and smooth animations
- **Personalization**: Customize voice, pace, and background sounds
- **Library**: Save and replay your favorite sessions
- **Seamless Experience**: Simple, distraction-free interface
- **Premium Subscription**: Unlock unlimited custom sessions and premium voices with Pro

## Tech Stack

### Frontend
- **Expo SDK 54** with React Native 0.81.5
- **React Navigation 7** for stack and tab navigation
- **NativeWind (Tailwind CSS)** for styling
- **Lucide React Native** for icons
- **Zustand** for state management
- **React Native Reanimated** for smooth animations

### Backend (Vibecode Cloud)
- **Hono** server framework
- **Prisma ORM** with SQLite database
- **Better Auth** for authentication
- **OpenAI** for affirmation generation
- **ElevenLabs** for text-to-speech audio generation

## Project Structure

```
/home/user/workspace/
├── src/
│   ├── screens/          # All app screens
│   │   ├── OnboardingScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── LibraryScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── GenerationScreen.tsx
│   │   ├── PlaybackScreen.tsx
│   │   ├── CreateSessionScreen.tsx
│   │   └── LoginModalScreen.tsx
│   ├── navigation/       # Navigation setup
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   ├── state/           # Zustand stores
│   │   └── appStore.ts
│   ├── lib/             # Utilities
│   │   ├── api.ts       # API client
│   │   └── authClient.ts
│   └── components/      # Reusable components
├── backend/
│   ├── src/
│   │   ├── routes/      # API routes
│   │   │   ├── preferences.ts
│   │   │   ├── sessions.ts
│   │   │   ├── sample.ts
│   │   │   ├── tts.ts
│   │   │   └── upload.ts
│   │   ├── index.ts     # Server entry
│   │   ├── auth.ts      # Auth config
│   │   ├── db.ts        # Prisma client
│   │   └── env.ts       # Environment validation
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
└── shared/
    └── contracts.ts     # Type-safe API contracts
```

## Key Screens

### Onboarding
3-step welcome flow where users:
1. Enter their name
2. Select their focus area (Sleep, Focus, Calm, or Manifest)
3. Describe what they want to work on

The app then generates personalized AI affirmations and creates their first session.

### Home
Main dashboard with contextual greetings and quick access to generate sessions for each goal. Features "Jump Back In" section and "Create Custom Session" button.

### Create Session
Comprehensive session builder where users can:
- Name their session
- Select binaural beats category (Delta/Theta/Alpha/Beta/Gamma with Hz ranges)
- Choose affirmation input method (library/custom/AI)
- Write custom affirmations or generate them with AI

### Generation
Loading screen with elegant animations while AI crafts personalized affirmations.

### Playback
Full-screen immersive playback interface with a meditative particle field visualization. 25 floating particles drift slowly like dust in light, while a central breathing circle (8-second cycles with smooth pauses) guides meditation. Includes affirmation transcript display and playback controls (play/pause, restart, regenerate).

### Library
Browse and manage all saved affirmation sessions.

### Settings
Customize voice tone, pace, and background sounds.

## Database Schema

### User
- Basic user information (id, email, name, emailVerified)
- Relations to sessions, preferences, and subscription

### UserPreferences
- voice (neutral/confident/whisper)
- pace (slow/normal/fast)
- noise (rain/brown/none/ocean/forest/wind/fire/thunder)
- pronounStyle (you/i)
- intensity (gentle/assertive)

### AffirmationSession
- goal (sleep/focus/calm/manifest)
- title
- affirmations (JSON array)
- voiceId, pace, noise
- lengthSec
- isFavorite
- binauralCategory (delta/theta/alpha/beta/gamma)
- binauralHz (e.g., "0.5-4", "4-8", "8-14", "14-30", "30-100")
- createdAt

### UserSubscription
- tier (free/pro)
- status (active/cancelled/expired)
- billingPeriod (monthly/yearly or null for free)
- currentPeriodStart, currentPeriodEnd
- cancelAtPeriodEnd
- customSessionsUsedThisMonth (usage tracking)
- lastResetDate (for monthly reset)

## API Endpoints

### Preferences
- `GET /api/preferences` - Get user preferences
- `PATCH /api/preferences` - Update preferences

### Sessions
- `POST /api/sessions/generate` - Generate new session
- `POST /api/sessions/create` - Create custom session with user-defined affirmations
- `GET /api/sessions` - Get all user sessions
- `PATCH /api/sessions/:id` - Update session (title, affirmations, binaural category/Hz)
- `PATCH /api/sessions/:id/favorite` - Toggle favorite
- `DELETE /api/sessions/:id` - Delete session

### Subscription
- `GET /api/subscription` - Get user subscription status and usage
- `POST /api/subscription/upgrade` - Upgrade to Pro tier (monthly/yearly)
- `POST /api/subscription/cancel` - Cancel subscription at period end
- `POST /api/subscription/track-usage` - Internal endpoint for tracking custom session creation

### TTS (Text-to-Speech)
- `POST /api/tts/generate` - Generate audio from text with voice selection
- `POST /api/tts/generate-session` - Generate complete session audio with affirmations

### Auth
- `/api/auth/*` - Better Auth endpoints

## Design System

### Color Palette
- **Base**: Deep midnight navy (#0F0F1E) → Soft purple (#1A1A2E)
- **Sleep Mode**: Deep indigo (#2D1B69) → Lavender (#8B7AB8)
- **Focus Mode**: Amber (#FF9966) → Orange (#FF6B35)
- **Calm Mode**: Cyan (#44B09E) → Blue (#6BB6FF)
- **Manifest Mode**: Purple (#9333EA) → Gold (#F59E0B)
- **Accents**: Soft white (#F0F0F5), Muted gray (#9E9EB0)

### Typography
- Headlines: Bold, 24-32px
- Body: Regular, 16px
- Captions: 14px

## Development

The app runs automatically in the Vibecode environment:
- Frontend server: Port 8081 (Expo)
- Backend server: Port 3000 (Hono)
- Database: SQLite at `backend/prisma/dev.db`

### Commands
```bash
bun run typecheck    # Check TypeScript types
bun run lint         # Lint code
bun run format       # Format with Prettier
```

## Environment Variables

Required in backend:
- `DATABASE_URL` - SQLite connection string
- `BETTER_AUTH_SECRET` - Auth secret (32+ chars)
- `BACKEND_URL` - Backend URL (set by Vibecode)
- `OPENAI_API_KEY` - OpenAI API key (optional, uses fallback affirmations)
- `ELEVENLABS_API_KEY` - ElevenLabs API key for text-to-speech generation

## Future Enhancements

- ✅ ~~Audio playback with TTS integration~~ (COMPLETED - ElevenLabs integration added)
- ✅ ~~Binaural beats and soundscapes~~ (COMPLETED - Binaural frequency selection added)
- Affirmation library with pre-written affirmations
- Voice journaling (speak → AI response)
- Export sessions
- Social sharing
- Therapist-curated affirmation packs

---

Built with Vibecode — The AI app builder that requires no coding.
