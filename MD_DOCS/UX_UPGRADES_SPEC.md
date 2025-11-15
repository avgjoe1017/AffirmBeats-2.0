# **AFFIRMATION BEATS — PREMIUM UX UPGRADE SPECIFICATION**

*Version 1.0 — November 2025*

*Prepared for Engineering Implementation*

---

# **TABLE OF CONTENTS**

1. Cinematic Opener (Calm Style)

2. Micro-Illustrations (Headspace Style)

3. Slow UI Aesthetic (Calm Style)

4. Ritual Creation (Calm Daily Prime)

5. Personalized "Jump Back In" Row

6. Context-Aware Defaults (Endel Style)

7. Instruction Nudges (Headspace Style)

8. Background Audio Persistence

9. Layered Audio Depth (Endel Spatiality)

10. Feature-Based Paywall Locks

11. Day 3 Conversion Spike

12. Stacking Benefits Paywall

13. Personalization Microtext

14. Engineering Checklist

---

# **1. CINEMATIC OPENER (CALM STYLE)**

### **Goal**

Create a premium-feeling startup animation before Home loads.

### **Behavior**

* Trigger only on cold start (not returning from background).

* Duration: **1.0–1.5 seconds**.

* Auto-navigate to Home after animation.

### **Animation Sequence**

1. Logo fades in: **0% → 100%** over **450ms**, easing: `Easing.out(Easing.cubic)`.

2. Glow bloom: shadow blur **0 → 12 → 0** over **600ms** (concurrent).

3. Scale: **0.95 → 1.0** over **500ms**.

4. Full fade out: **200–300ms**.

### **Implementation Files**

```
/src/components/CinematicOpener.tsx

/src/screens/SplashScreen.tsx

```

---

# **2. MICRO-ILLUSTRATIONS (HEADSPACE STYLE)**

### **Goal**

Add subtle, premium micro-effects around the Playback ring.

### **Elements**

#### **1. Sparkles**

* Size: 1–3 px

* Drift outward 4–8 px over 1.5–3s

* Fade opacity to zero

* 3–6 sparkles active

* Color: white at 10–20% opacity

#### **2. Ambient Particles**

* Size: 2–4 px soft dots

* Move at 0.3–0.6 px/sec

* Opacity oscillates 40% → 80% → 40%

#### **3. Ring Pulse**

* Scale cycle: **1.00 → 1.015 → 1.00**

* Duration: **3–4s**, repeated

* Easing: `inOut(Easing.quad)`

### **Performance**

* Use `react-native-reanimated` for 60fps loops.

* Max particles: ~12.

### **Implementation File**

```
/src/components/PlaybackRingEffects.tsx

```

---

# **3. SLOW UI AESTHETIC (CALM STYLE)**

### **Navigation Transitions**

* Duration: **150–250ms**

* Easing: `Easing.out(Easing.quad)`

* Use fade + 10–20px slide.

### **Component Transitions**

* Fade in: 150–200ms

* Fade out: 150ms

* Modal scale: 0.97 → 1.0 over 180ms

### **Scroll Behavior**

* Use default iOS-style `decelerationRate="normal"`.

### **Navigation Config**

```
animation: 'fade',

animationDuration: 180,

```

---

# **4. RITUAL CREATION (DAILY PRIME)**

### **Goal**

Warm "daily ritual" greeting without streaks or guilt.

### **Time-Based Greeting Logic**

| Time     | Greeting            | Subtext                           |
| -------- | ------------------- | --------------------------------- |
| 5am–11am | Good morning, Joe   | Today's a great day to focus.     |
| 11am–6pm | Good afternoon, Joe | You deserve a moment to reset.    |
| 6pm–10pm | Good evening, Joe   | Tonight's a good night to unwind. |
| 10pm–5am | Hi Joe              | Take a breath before you rest.    |

### **Implementation**

```
/src/hooks/useTimeOfDayGreeting.ts

```

---

# **5. PERSONALIZED "JUMP BACK IN" ROW**

### **Goal**

Reorder sessions based on time-of-day relevance.

### **Reorder Rules**

**Night (8pm–4am):**

1. Sleep

2. Calm

3. Manifest

4. Focus

**Morning (5am–11am):**

1. Focus

2. Calm

3. Manifest

4. Sleep

**Afternoon (11am–6pm):**

1. Calm

2. Focus

3. Manifest

4. Sleep

**Inactive >3 days:**

* Prioritize Calm Reset sessions.

### **Function**

```
function reorderByContext(sessions, timeOfDay, lastActiveDate)

```

---

# **6. CONTEXT-AWARE DEFAULTS (ENDEL STYLE)**

### **Goal**

Suggest the most relevant category on app open.

### **Rules**

* Open after 8pm → Suggest **Sleep**

* Opens 3+ times between 10am–3pm → Suggest **Focus**

* Last use >3 days → Suggest **Calm Reset**

* If Manifest played ≥3 times this week → Suggest **Manifest**

### **Function**

```
getSuggestedCategory()

```

---

# **7. INSTRUCTION NUDGES (HEADSPACE STYLE)**

### **Goal**

Humanize the generation/loading experience.

### **Update Loading Screen Text**

**Primary:**

"Crafting your affirmations…"

**Secondary (fade in after 600ms):**

"Take a breath while you wait."

### **Animation**

* Fade-in: 400ms

* Optional translateY: 4 → 0 px

* Easing: `inOut(Easing.quad)`

---

# **8. BACKGROUND AUDIO PERSISTENCE**

### **Goal**

Audio continues when screen locks or user navigates away.

### **Expo Audio Config**

```
Audio.setAudioModeAsync({

  staysActiveInBackground: true,

  playsInSilentModeIOS: true,

  interruptionModeIOS: INTERRUPTION_MODE_IOS_DO_NOT_MIX,

  shouldDuckAndroid: false,

});

```

### **State Management**

* Audio instance must live in global store (Zustand/Recoil), not local state.

### **Lock Screen Controls**

* Enable notification/lock controls for:

  * Pause/Play

  * Scrub

  * Stop

---

# **9. LAYERED AUDIO DEPTH (ENDEL STYLE)**

### **Goal**

Add subtle spatial oscillation to background layer.

### **Specs**

* Applies only to **background sounds**.

* Panning range: **-0.25 → +0.25**

* Cycle duration: **20–30 seconds**

* Easing: `inOut(Easing.quad)`

### **Implementation**

Background track receives a continuously animated `pan` value.

---

# **10. FEATURE-BASED PAYWALL LOCKS**

### **Goal**

Non-intrusive visual paywall via lock icons.

### **Locked Features**

* Unlimited custom sessions

* Premium voices

* Premium background sounds

* Shuffle mode

* Durations >10 minutes

* More than 20 affirmations

* Saving more than 1 custom session

### **Behavior**

Tap locked item → Show bottom sheet:

> "This feature is included in the full version."

Button → "Unlock Everything"

### **Lock Icon Specs**

* Size: 14–16 px

* Opacity: 70%

* Color: white at 60%

* Placement: top-right or inline

---

# **11. DAY 3 CONVERSION SPIKE (HEADSPACE STYLE)**

### **Goal**

Light-touch upgrade hint on user's 3rd day of usage.

### **Tracking**

Track unique days:

```
uniqueDaysUsed = Set(dates)

```

Show banner once:

**"Your sessions are working beautifully. Want unlimited?"**

* Primary: **Unlock Everything**

* Secondary: **Not now**

Do not show again after dismissing.

---

# **12. STACKING BENEFITS PAYWALL**

### **Goal**

Visually stack benefits to amplify the value of $9.99 one-time purchase.

### **Benefits to Display**

* Unlimited sessions

* All voices

* All sounds

* All frequencies

* Identity sessions

* Calming sessions

* Sleep sessions

* Manifest sessions

* Library builder

* Save favorites

* Unlimited playback length

### **Copy**

**Headline:**

**Unlock Everything Forever**

**Subhead:**

One payment. No subscription. No limits.

**Button:**

**Get Full Access – $9.99**

---

# **13. PERSONALIZATION MICROTEXT**

### **Goal**

Strengthen emotional connection via personalized language.

### **Dynamic Inserts**

Use `userProfile.name`.

### **Insert in:**

* Loading screen:

  "Crafting your affirmations, **Joe**…"

* Home greeting:

  "Good evening, **Joe**"

* Session complete:

  "Nice work, **Joe**."

* Paywall:

  "**Joe**, here's what you unlock…"

---

# **14. ENGINEERING CHECKLIST**

### **Animations**

* [ ] Cinematic opener implemented with 1–1.5s timing

* [ ] Playback micro-illustrations (particles + sparkles)

* [ ] Ring pulse animation

* [ ] Slow UI transitions globally applied

### **Personalization & Context**

* [ ] Time-of-day greetings

* [ ] Context-aware Jump Back In sorting

* [ ] getSuggestedCategory() implemented

* [ ] Day 3 gentle conversion banner

* [ ] Microtext personalization injected

### **Audio**

* [ ] Background persistence enabled

* [ ] Spatial panning on background sounds

* [ ] Global audio store

### **Paywall**

* [ ] Lock icons on all premium features

* [ ] Bottom sheet on locked tap

* [ ] Stacking-benefits paywall built

### **QA Requirements**

* [ ] 60fps on all animations

* [ ] No audible playback glitches when navigating away

* [ ] Paywall never appears before user experiences content

* [ ] All personalization uses stored user name

* [ ] Dark mode contrast standards maintained

---

# **END OF DOCUMENT**

