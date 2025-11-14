/**
 * Affirmation Library
 * 
 * A curated collection of affirmations organized by category.
 * Each category has metadata including frequency bands, tone, and use cases.
 */

export interface FrequencyBand {
  label: string;
  min_hz: number;
  max_hz: number;
}

export interface AffirmationCategory {
  id: string;
  name: string;
  frequency_band: FrequencyBand;
  tone: string;
  use_cases: string[];
  sort_order: number;
}

export interface Affirmation {
  id: string;
  category_id: string;
  text: string;
  tags: string[];
  intensity: "low" | "medium" | "high";
}

export interface AffirmationLibrary {
  version: string;
  categories: AffirmationCategory[];
  affirmations: Affirmation[];
}

export const affirmationLibrary: AffirmationLibrary = {
  version: "1.0.0",
  categories: [
    {
      id: "sleep",
      name: "Sleep",
      frequency_band: { label: "Delta", min_hz: 0.5, max_hz: 4.0 },
      tone: "soft",
      use_cases: ["evening", "bedtime", "night_wake"],
      sort_order: 1,
    },
    {
      id: "calm",
      name: "Calm",
      frequency_band: { label: "Alpha", min_hz: 8.0, max_hz: 12.0 },
      tone: "grounded",
      use_cases: ["anxiety", "overwhelm", "midday_reset"],
      sort_order: 2,
    },
    {
      id: "focus",
      name: "Focus",
      frequency_band: { label: "Beta", min_hz: 12.0, max_hz: 20.0 },
      tone: "crisp",
      use_cases: ["work", "study", "deep_work"],
      sort_order: 3,
    },
    {
      id: "manifest",
      name: "Manifest",
      frequency_band: { label: "Theta", min_hz: 4.0, max_hz: 7.0 },
      tone: "spacious",
      use_cases: ["visualization", "future_self", "goal_setting"],
      sort_order: 4,
    },
    {
      id: "confidence",
      name: "Confidence",
      frequency_band: { label: "Alpha→Beta", min_hz: 8.0, max_hz: 18.0 },
      tone: "steady",
      use_cases: ["social", "performance", "self_trust"],
      sort_order: 5,
    },
    {
      id: "energy",
      name: "Energy",
      frequency_band: { label: "High Beta", min_hz: 18.0, max_hz: 22.0 },
      tone: "activating",
      use_cases: ["morning", "pre_task", "movement"],
      sort_order: 6,
    },
    {
      id: "healing",
      name: "Healing",
      frequency_band: { label: "Delta→Theta", min_hz: 0.5, max_hz: 7.0 },
      tone: "nurturing",
      use_cases: ["emotional_processing", "recovery", "self_compassion"],
      sort_order: 7,
    },
    {
      id: "identity",
      name: "Identity",
      frequency_band: { label: "Theta", min_hz: 4.0, max_hz: 7.0 },
      tone: "deep",
      use_cases: ["self_image", "identity_shift", "long_term_change"],
      sort_order: 8,
    },
  ],
  affirmations: [
    /* SLEEP (38) */
    { id: "sleep_001", category_id: "sleep", text: "I let my whole body soften into rest.", tags: ["rest"], intensity: "low" },
    { id: "sleep_002", category_id: "sleep", text: "I release the weight of the day from my mind.", tags: ["release"], intensity: "low" },
    { id: "sleep_003", category_id: "sleep", text: "I am safe to let go and drift inward.", tags: ["safety"], intensity: "low" },
    { id: "sleep_004", category_id: "sleep", text: "My breath guides me into deep, peaceful sleep.", tags: ["breath"], intensity: "low" },
    { id: "sleep_005", category_id: "sleep", text: "I surrender tension with every exhale.", tags: ["tension", "release"], intensity: "low" },
    { id: "sleep_006", category_id: "sleep", text: "Rest comes naturally to me.", tags: ["rest"], intensity: "low" },
    { id: "sleep_007", category_id: "sleep", text: "My body knows how to recover and heal.", tags: ["healing"], intensity: "low" },
    { id: "sleep_008", category_id: "sleep", text: "I feel my system slowing down.", tags: ["nervous_system"], intensity: "low" },
    { id: "sleep_009", category_id: "sleep", text: "Sleep wraps around me with warmth and ease.", tags: ["comfort"], intensity: "low" },
    { id: "sleep_010", category_id: "sleep", text: "I release control and trust the quiet.", tags: ["trust"], intensity: "low" },
    { id: "sleep_011", category_id: "sleep", text: "Everything can wait until morning.", tags: ["boundaries"], intensity: "low" },
    { id: "sleep_012", category_id: "sleep", text: "My mind settles into stillness.", tags: ["mind"], intensity: "low" },
    { id: "sleep_013", category_id: "sleep", text: "I welcome deep, uninterrupted rest.", tags: ["rest"], intensity: "low" },
    { id: "sleep_014", category_id: "sleep", text: "I let go of thoughts gently.", tags: ["thoughts"], intensity: "low" },
    { id: "sleep_015", category_id: "sleep", text: "I sink into sleep with softness and safety.", tags: ["safety"], intensity: "low" },
    { id: "sleep_016", category_id: "sleep", text: "I allow my muscles to loosen and release.", tags: ["body"], intensity: "low" },
    { id: "sleep_017", category_id: "sleep", text: "My breathing is slow, steady, and calming.", tags: ["breath"], intensity: "low" },
    { id: "sleep_018", category_id: "sleep", text: "I drift away from the noise of the day.", tags: ["noise"], intensity: "low" },
    { id: "sleep_019", category_id: "sleep", text: "I give myself permission to fully rest.", tags: ["permission"], intensity: "low" },
    { id: "sleep_020", category_id: "sleep", text: "My thoughts slow down and grow softer.", tags: ["thoughts"], intensity: "low" },
    { id: "sleep_021", category_id: "sleep", text: "I release worries into the dark, quiet night.", tags: ["worry"], intensity: "low" },
    { id: "sleep_022", category_id: "sleep", text: "I trust my body to reset while I sleep.", tags: ["healing"], intensity: "low" },
    { id: "sleep_023", category_id: "sleep", text: "I am held by the stillness of this moment.", tags: ["presence"], intensity: "low" },
    { id: "sleep_024", category_id: "sleep", text: "My mind releases the need to problem-solve.", tags: ["mind"], intensity: "low" },
    { id: "sleep_025", category_id: "sleep", text: "I soften around every tight place in my body.", tags: ["body"], intensity: "low" },
    { id: "sleep_026", category_id: "sleep", text: "I feel heavier, calmer, and more at ease.", tags: ["rest"], intensity: "low" },
    { id: "sleep_027", category_id: "sleep", text: "Nighttime is a safe space for my restoration.", tags: ["safety"], intensity: "low" },
    { id: "sleep_028", category_id: "sleep", text: "I welcome quiet into every part of me.", tags: ["quiet"], intensity: "low" },
    { id: "sleep_029", category_id: "sleep", text: "I let my day end here, gently and completely.", tags: ["closure"], intensity: "low" },
    { id: "sleep_030", category_id: "sleep", text: "My dreams support my healing and integration.", tags: ["dreams"], intensity: "low" },
    { id: "sleep_031", category_id: "sleep", text: "I feel a wave of calm move through my body.", tags: ["calm"], intensity: "low" },
    { id: "sleep_032", category_id: "sleep", text: "I am free to rest without guilt.", tags: ["guilt"], intensity: "low" },
    { id: "sleep_033", category_id: "sleep", text: "I gently close the door on today.", tags: ["closure"], intensity: "low" },
    { id: "sleep_034", category_id: "sleep", text: "Each breath pulls me deeper into ease.", tags: ["breath"], intensity: "low" },
    { id: "sleep_035", category_id: "sleep", text: "I welcome stillness as a form of care.", tags: ["self_care"], intensity: "low" },
    { id: "sleep_036", category_id: "sleep", text: "I allow my heart rate to slow and settle.", tags: ["nervous_system"], intensity: "low" },
    { id: "sleep_037", category_id: "sleep", text: "I feel safe, supported, and ready to sleep.", tags: ["safety"], intensity: "low" },
    { id: "sleep_038", category_id: "sleep", text: "I sink into deep rest that renews me completely.", tags: ["rest"], intensity: "low" },

    /* CALM (38) */
    { id: "calm_001", category_id: "calm", text: "I relax my breath and return to myself.", tags: ["breath"], intensity: "low" },
    { id: "calm_002", category_id: "calm", text: "I am safe in this moment.", tags: ["safety"], intensity: "low" },
    { id: "calm_003", category_id: "calm", text: "I let tension melt from my shoulders.", tags: ["body"], intensity: "low" },
    { id: "calm_004", category_id: "calm", text: "I choose calm over urgency.", tags: ["choice"], intensity: "low" },
    { id: "calm_005", category_id: "calm", text: "I slow down and breathe with ease.", tags: ["breath"], intensity: "low" },
    { id: "calm_006", category_id: "calm", text: "Peace flows through my body.", tags: ["peace"], intensity: "low" },
    { id: "calm_007", category_id: "calm", text: "I feel grounded and steady.", tags: ["grounded"], intensity: "low" },
    { id: "calm_008", category_id: "calm", text: "My nervous system settles naturally.", tags: ["nervous_system"], intensity: "low" },
    { id: "calm_009", category_id: "calm", text: "I allow space around my thoughts.", tags: ["thoughts"], intensity: "low" },
    { id: "calm_010", category_id: "calm", text: "I move gently through this moment.", tags: ["gentle"], intensity: "low" },
    { id: "calm_011", category_id: "calm", text: "I am centered and present.", tags: ["presence"], intensity: "low" },
    { id: "calm_012", category_id: "calm", text: "Calm is available to me at any time.", tags: ["choice"], intensity: "low" },
    { id: "calm_013", category_id: "calm", text: "I soften my expectations of myself.", tags: ["self_compassion"], intensity: "low" },
    { id: "calm_014", category_id: "calm", text: "I release what isn't mine to carry.", tags: ["boundaries"], intensity: "low" },
    { id: "calm_015", category_id: "calm", text: "I return to a place of balance.", tags: ["balance"], intensity: "low" },
    { id: "calm_016", category_id: "calm", text: "I let my jaw unclench and my face soften.", tags: ["body"], intensity: "low" },
    { id: "calm_017", category_id: "calm", text: "I breathe into my chest and feel it open.", tags: ["breath"], intensity: "low" },
    { id: "calm_018", category_id: "calm", text: "I step out of urgency and into presence.", tags: ["presence"], intensity: "low" },
    { id: "calm_019", category_id: "calm", text: "I allow my body to settle into the chair.", tags: ["body"], intensity: "low" },
    { id: "calm_020", category_id: "calm", text: "I give myself permission to pause.", tags: ["pause"], intensity: "low" },
    { id: "calm_021", category_id: "calm", text: "My breath cools the heat of my emotions.", tags: ["emotion"], intensity: "low" },
    { id: "calm_022", category_id: "calm", text: "I do not need to solve everything right now.", tags: ["worry"], intensity: "low" },
    { id: "calm_023", category_id: "calm", text: "I feel my feet connected to the ground.", tags: ["grounded"], intensity: "low" },
    { id: "calm_024", category_id: "calm", text: "I bring kindness to whatever I am feeling.", tags: ["self_compassion"], intensity: "low" },
    { id: "calm_025", category_id: "calm", text: "I am allowed to take things slowly.", tags: ["pace"], intensity: "low" },
    { id: "calm_026", category_id: "calm", text: "I release the urge to rush.", tags: ["urgency"], intensity: "low" },
    { id: "calm_027", category_id: "calm", text: "I am gentle with my nervous system.", tags: ["nervous_system"], intensity: "low" },
    { id: "calm_028", category_id: "calm", text: "I feel more spacious inside my mind.", tags: ["spaciousness"], intensity: "low" },
    { id: "calm_029", category_id: "calm", text: "I can return to calm as many times as I need.", tags: ["choice"], intensity: "low" },
    { id: "calm_030", category_id: "calm", text: "I let my shoulders drop away from my ears.", tags: ["body"], intensity: "low" },
    { id: "calm_031", category_id: "calm", text: "I meet this moment with softness.", tags: ["softness"], intensity: "low" },
    { id: "calm_032", category_id: "calm", text: "I am anchored in the here and now.", tags: ["presence"], intensity: "low" },
    { id: "calm_033", category_id: "calm", text: "I allow my heartbeat to slow and steady.", tags: ["nervous_system"], intensity: "low" },
    { id: "calm_034", category_id: "calm", text: "I release the pressure to be anywhere else.", tags: ["expectation"], intensity: "low" },
    { id: "calm_035", category_id: "calm", text: "I invite quiet into my inner world.", tags: ["quiet"], intensity: "low" },
    { id: "calm_036", category_id: "calm", text: "I am stable, supported, and okay right now.", tags: ["safety"], intensity: "low" },
    { id: "calm_037", category_id: "calm", text: "I let my mind rest from constant thinking.", tags: ["mind"], intensity: "low" },
    { id: "calm_038", category_id: "calm", text: "I choose to move through today with calm intention.", tags: ["intention"], intensity: "low" },

    /* FOCUS (38) */
    { id: "focus_001", category_id: "focus", text: "I lock into clarity with ease.", tags: ["clarity"], intensity: "medium" },
    { id: "focus_002", category_id: "focus", text: "My mind is sharp, steady, and organized.", tags: ["mind"], intensity: "medium" },
    { id: "focus_003", category_id: "focus", text: "I stay fully present with what matters.", tags: ["presence"], intensity: "medium" },
    { id: "focus_004", category_id: "focus", text: "I choose progress over perfection.", tags: ["progress"], intensity: "medium" },
    { id: "focus_005", category_id: "focus", text: "I direct my attention with confidence.", tags: ["attention"], intensity: "medium" },
    { id: "focus_006", category_id: "focus", text: "I follow through with discipline.", tags: ["discipline"], intensity: "medium" },
    { id: "focus_007", category_id: "focus", text: "I eliminate distractions and stay on track.", tags: ["distraction"], intensity: "medium" },
    { id: "focus_008", category_id: "focus", text: "I enjoy the feeling of deep focus.", tags: ["motivation"], intensity: "medium" },
    { id: "focus_009", category_id: "focus", text: "I take one clear step at a time.", tags: ["progress"], intensity: "medium" },
    { id: "focus_010", category_id: "focus", text: "My attention is strong and reliable.", tags: ["attention"], intensity: "medium" },
    { id: "focus_011", category_id: "focus", text: "I create momentum with intention.", tags: ["momentum"], intensity: "medium" },
    { id: "focus_012", category_id: "focus", text: "I finish what I begin.", tags: ["follow_through"], intensity: "medium" },
    { id: "focus_013", category_id: "focus", text: "I think clearly and act decisively.", tags: ["decision"], intensity: "medium" },
    { id: "focus_014", category_id: "focus", text: "I respond instead of react.", tags: ["response"], intensity: "medium" },
    { id: "focus_015", category_id: "focus", text: "I choose focus again and again.", tags: ["choice"], intensity: "medium" },
    { id: "focus_016", category_id: "focus", text: "I bring my mind back when it wanders.", tags: ["attention"], intensity: "medium" },
    { id: "focus_017", category_id: "focus", text: "I keep my workspace clear and supportive.", tags: ["environment"], intensity: "medium" },
    { id: "focus_018", category_id: "focus", text: "I break big tasks into simple steps.", tags: ["strategy"], intensity: "medium" },
    { id: "focus_019", category_id: "focus", text: "I protect my focus like something valuable.", tags: ["boundaries"], intensity: "medium" },
    { id: "focus_020", category_id: "focus", text: "I give myself fully to this next block of time.", tags: ["time"], intensity: "medium" },
    { id: "focus_021", category_id: "focus", text: "I allow myself to be absorbed in the work.", tags: ["flow"], intensity: "medium" },
    { id: "focus_022", category_id: "focus", text: "I set aside what is not urgent right now.", tags: ["priorities"], intensity: "medium" },
    { id: "focus_023", category_id: "focus", text: "I trust myself to handle what truly matters.", tags: ["trust"], intensity: "medium" },
    { id: "focus_024", category_id: "focus", text: "I replace avoidance with small, consistent action.", tags: ["avoidance"], intensity: "medium" },
    { id: "focus_025", category_id: "focus", text: "I use my energy wisely and intentionally.", tags: ["energy"], intensity: "medium" },
    { id: "focus_026", category_id: "focus", text: "I stay curious and engaged with this task.", tags: ["curiosity"], intensity: "medium" },
    { id: "focus_027", category_id: "focus", text: "I let go of multitasking and choose one thing.", tags: ["single_task"], intensity: "medium" },
    { id: "focus_028", category_id: "focus", text: "I respect my own deadlines and commitments.", tags: ["commitment"], intensity: "medium" },
    { id: "focus_029", category_id: "focus", text: "I welcome the satisfaction that comes from finishing.", tags: ["reward"], intensity: "medium" },
    { id: "focus_030", category_id: "focus", text: "I give myself permission to ignore distractions.", tags: ["boundaries"], intensity: "medium" },
    { id: "focus_031", category_id: "focus", text: "I am capable of deep, sustained focus.", tags: ["belief"], intensity: "medium" },
    { id: "focus_032", category_id: "focus", text: "I start now, even if I do not feel ready.", tags: ["start"], intensity: "medium" },
    { id: "focus_033", category_id: "focus", text: "I choose structured effort over scattered energy.", tags: ["structure"], intensity: "medium" },
    { id: "focus_034", category_id: "focus", text: "I keep returning to what I want to build.", tags: ["long_term"], intensity: "medium" },
    { id: "focus_035", category_id: "focus", text: "I use breaks intentionally to refuel my focus.", tags: ["breaks"], intensity: "medium" },
    { id: "focus_036", category_id: "focus", text: "I let my actions reflect my priorities.", tags: ["priorities"], intensity: "medium" },
    { id: "focus_037", category_id: "focus", text: "I enjoy seeing my progress take shape.", tags: ["progress"], intensity: "medium" },
    { id: "focus_038", category_id: "focus", text: "I step into this work session fully engaged.", tags: ["engagement"], intensity: "medium" },

    /* MANIFEST (38) */
    { id: "manifest_001", category_id: "manifest", text: "I align with the version of me I'm becoming.", tags: ["future_self"], intensity: "medium" },
    { id: "manifest_002", category_id: "manifest", text: "I allow good things to come toward me.", tags: ["receiving"], intensity: "medium" },
    { id: "manifest_003", category_id: "manifest", text: "I trust what's meant for me.", tags: ["trust"], intensity: "medium" },
    { id: "manifest_004", category_id: "manifest", text: "I am open to new opportunities.", tags: ["opportunity"], intensity: "medium" },
    { id: "manifest_005", category_id: "manifest", text: "My desires are valid and possible.", tags: ["desire"], intensity: "medium" },
    { id: "manifest_006", category_id: "manifest", text: "I attract experiences that support my growth.", tags: ["growth"], intensity: "medium" },
    { id: "manifest_007", category_id: "manifest", text: "My future expands with every aligned action.", tags: ["action"], intensity: "medium" },
    { id: "manifest_008", category_id: "manifest", text: "I move toward what I want with clarity.", tags: ["clarity"], intensity: "medium" },
    { id: "manifest_009", category_id: "manifest", text: "I am ready to receive.", tags: ["receiving"], intensity: "medium" },
    { id: "manifest_010", category_id: "manifest", text: "I welcome change that leads me forward.", tags: ["change"], intensity: "medium" },
    { id: "manifest_011", category_id: "manifest", text: "My life opens in beautiful and surprising ways.", tags: ["surprise"], intensity: "medium" },
    { id: "manifest_012", category_id: "manifest", text: "I choose belief over doubt.", tags: ["belief"], intensity: "medium" },
    { id: "manifest_013", category_id: "manifest", text: "I feel my future self guiding me.", tags: ["future_self"], intensity: "medium" },
    { id: "manifest_014", category_id: "manifest", text: "I let my vision take shape within me.", tags: ["vision"], intensity: "medium" },
    { id: "manifest_015", category_id: "manifest", text: "I trust my path as it unfolds.", tags: ["path"], intensity: "medium" },
    { id: "manifest_016", category_id: "manifest", text: "I picture the reality I am creating in detail.", tags: ["visualization"], intensity: "medium" },
    { id: "manifest_017", category_id: "manifest", text: "I act like the person who already has this life.", tags: ["identity"], intensity: "medium" },
    { id: "manifest_018", category_id: "manifest", text: "I notice and follow aligned opportunities.", tags: ["alignment"], intensity: "medium" },
    { id: "manifest_019", category_id: "manifest", text: "I release timelines and trust the process.", tags: ["trust"], intensity: "medium" },
    { id: "manifest_020", category_id: "manifest", text: "I let my actions reflect my deepest values.", tags: ["values"], intensity: "medium" },
    { id: "manifest_021", category_id: "manifest", text: "I am an active participant in my own future.", tags: ["agency"], intensity: "medium" },
    { id: "manifest_022", category_id: "manifest", text: "I am worthy of the reality I imagine.", tags: ["worthiness"], intensity: "medium" },
    { id: "manifest_023", category_id: "manifest", text: "I align my beliefs with what I want to create.", tags: ["belief"], intensity: "medium" },
    { id: "manifest_024", category_id: "manifest", text: "I let go of stories that limit my vision.", tags: ["stories"], intensity: "medium" },
    { id: "manifest_025", category_id: "manifest", text: "I stay open to better outcomes than I expected.", tags: ["openness"], intensity: "medium" },
    { id: "manifest_026", category_id: "manifest", text: "I see small signs of progress and honor them.", tags: ["progress"], intensity: "medium" },
    { id: "manifest_027", category_id: "manifest", text: "I choose environments that support my intentions.", tags: ["environment"], intensity: "medium" },
    { id: "manifest_028", category_id: "manifest", text: "I let my imagination work in service of my goals.", tags: ["imagination"], intensity: "medium" },
    { id: "manifest_029", category_id: "manifest", text: "I allow myself to want what I truly want.", tags: ["desire"], intensity: "medium" },
    { id: "manifest_030", category_id: "manifest", text: "I make choices that match my future, not my past.", tags: ["choice"], intensity: "medium" },
    { id: "manifest_031", category_id: "manifest", text: "I hold my goals with both devotion and flexibility.", tags: ["goals"], intensity: "medium" },
    { id: "manifest_032", category_id: "manifest", text: "I expect supportive people and opportunities to appear.", tags: ["support"], intensity: "medium" },
    { id: "manifest_033", category_id: "manifest", text: "I celebrate every aligned step I take.", tags: ["celebration"], intensity: "medium" },
    { id: "manifest_034", category_id: "manifest", text: "I let possibility feel real in my body.", tags: ["embodiment"], intensity: "medium" },
    { id: "manifest_035", category_id: "manifest", text: "I trust myself to co-create what I desire.", tags: ["agency"], intensity: "medium" },
    { id: "manifest_036", category_id: "manifest", text: "I invite in opportunities that match my values.", tags: ["alignment"], intensity: "medium" },
    { id: "manifest_037", category_id: "manifest", text: "I let my nervous system feel safe with receiving more.", tags: ["safety"], intensity: "medium" },
    { id: "manifest_038", category_id: "manifest", text: "I live today as a quiet echo of my future.", tags: ["future_self"], intensity: "medium" },

    /* CONFIDENCE (38) */
    { id: "confidence_001", category_id: "confidence", text: "I trust myself deeply.", tags: ["trust"], intensity: "medium" },
    { id: "confidence_002", category_id: "confidence", text: "I speak with clarity and strength.", tags: ["voice"], intensity: "medium" },
    { id: "confidence_003", category_id: "confidence", text: "I show up as my full self.", tags: ["authenticity"], intensity: "medium" },
    { id: "confidence_004", category_id: "confidence", text: "I honor my voice and my truth.", tags: ["voice"], intensity: "medium" },
    { id: "confidence_005", category_id: "confidence", text: "I am grounded in my worth.", tags: ["worthiness"], intensity: "medium" },
    { id: "confidence_006", category_id: "confidence", text: "I carry myself with confidence.", tags: ["posture"], intensity: "medium" },
    { id: "confidence_007", category_id: "confidence", text: "I believe in my ability to succeed.", tags: ["belief"], intensity: "medium" },
    { id: "confidence_008", category_id: "confidence", text: "I rise to challenges with resilience.", tags: ["resilience"], intensity: "medium" },
    { id: "confidence_009", category_id: "confidence", text: "I stand rooted and steady.", tags: ["grounded"], intensity: "medium" },
    { id: "confidence_010", category_id: "confidence", text: "I choose courage over doubt.", tags: ["courage"], intensity: "medium" },
    { id: "confidence_011", category_id: "confidence", text: "I lead with calm certainty.", tags: ["leadership"], intensity: "medium" },
    { id: "confidence_012", category_id: "confidence", text: "I feel confident in my path.", tags: ["path"], intensity: "medium" },
    { id: "confidence_013", category_id: "confidence", text: "I deserve the space I take up.", tags: ["worthiness"], intensity: "medium" },
    { id: "confidence_014", category_id: "confidence", text: "I trust my instincts.", tags: ["intuition"], intensity: "medium" },
    { id: "confidence_015", category_id: "confidence", text: "I move through the world with assurance.", tags: ["assurance"], intensity: "medium" },
    { id: "confidence_016", category_id: "confidence", text: "I let my body express confidence and ease.", tags: ["body"], intensity: "medium" },
    { id: "confidence_017", category_id: "confidence", text: "I release the need to apologize for existing.", tags: ["worthiness"], intensity: "medium" },
    { id: "confidence_018", category_id: "confidence", text: "I own my strengths without shrinking them.", tags: ["strengths"], intensity: "medium" },
    { id: "confidence_019", category_id: "confidence", text: "I let go of comparison and choose self-respect.", tags: ["comparison"], intensity: "medium" },
    { id: "confidence_020", category_id: "confidence", text: "I trust myself to handle discomfort.", tags: ["resilience"], intensity: "medium" },
    { id: "confidence_021", category_id: "confidence", text: "I speak even when my voice shakes.", tags: ["courage"], intensity: "medium" },
    { id: "confidence_022", category_id: "confidence", text: "I know that my presence matters.", tags: ["presence"], intensity: "medium" },
    { id: "confidence_023", category_id: "confidence", text: "I am learning to trust myself more each day.", tags: ["growth"], intensity: "medium" },
    { id: "confidence_024", category_id: "confidence", text: "I let my decisions reflect my self-respect.", tags: ["decisions"], intensity: "medium" },
    { id: "confidence_025", category_id: "confidence", text: "I allow myself to be seen.", tags: ["visibility"], intensity: "medium" },
    { id: "confidence_026", category_id: "confidence", text: "I walk into rooms with quiet certainty.", tags: ["posture"], intensity: "medium" },
    { id: "confidence_027", category_id: "confidence", text: "I learn from mistakes without attacking myself.", tags: ["self_compassion"], intensity: "medium" },
    { id: "confidence_028", category_id: "confidence", text: "I am allowed to take up emotional and physical space.", tags: ["boundaries"], intensity: "medium" },
    { id: "confidence_029", category_id: "confidence", text: "I rely on my own approval first.", tags: ["self_validation"], intensity: "medium" },
    { id: "confidence_030", category_id: "confidence", text: "I show up even when I feel unsure.", tags: ["courage"], intensity: "medium" },
    { id: "confidence_031", category_id: "confidence", text: "I let my actions prove my capability to myself.", tags: ["capability"], intensity: "medium" },
    { id: "confidence_032", category_id: "confidence", text: "I speak about myself with respect and kindness.", tags: ["self_talk"], intensity: "medium" },
    { id: "confidence_033", category_id: "confidence", text: "I trust that I am enough as I am.", tags: ["enough"], intensity: "medium" },
    { id: "confidence_034", category_id: "confidence", text: "I see evidence of my strength in my life.", tags: ["evidence"], intensity: "medium" },
    { id: "confidence_035", category_id: "confidence", text: "I am becoming someone I respect and rely on.", tags: ["identity"], intensity: "medium" },
    { id: "confidence_036", category_id: "confidence", text: "I bring my full self to the table.", tags: ["authenticity"], intensity: "medium" },
    { id: "confidence_037", category_id: "confidence", text: "I know that I add value wherever I go.", tags: ["value"], intensity: "medium" },
    { id: "confidence_038", category_id: "confidence", text: "I walk through my life anchored in my worth.", tags: ["worthiness"], intensity: "medium" },

    /* ENERGY (38) */
    { id: "energy_001", category_id: "energy", text: "I feel energy rising through my body.", tags: ["energy"], intensity: "high" },
    { id: "energy_002", category_id: "energy", text: "I step into the day with strength.", tags: ["morning"], intensity: "high" },
    { id: "energy_003", category_id: "energy", text: "I am ready for movement and action.", tags: ["movement"], intensity: "high" },
    { id: "energy_004", category_id: "energy", text: "My motivation grows with each breath.", tags: ["motivation"], intensity: "high" },
    { id: "energy_005", category_id: "energy", text: "I ignite my inner drive.", tags: ["drive"], intensity: "high" },
    { id: "energy_006", category_id: "energy", text: "I welcome momentum and motion.", tags: ["momentum"], intensity: "high" },
    { id: "energy_007", category_id: "energy", text: "I move with power and intent.", tags: ["power"], intensity: "high" },
    { id: "energy_008", category_id: "energy", text: "I break through resistance.", tags: ["resistance"], intensity: "high" },
    { id: "energy_009", category_id: "energy", text: "My body feels awake and alive.", tags: ["body"], intensity: "high" },
    { id: "energy_010", category_id: "energy", text: "I harness my energy wisely.", tags: ["discipline"], intensity: "high" },
    { id: "energy_011", category_id: "energy", text: "I choose action over avoidance.", tags: ["avoidance"], intensity: "high" },
    { id: "energy_012", category_id: "energy", text: "I rise fully into my potential.", tags: ["potential"], intensity: "high" },
    { id: "energy_013", category_id: "energy", text: "I feel capable and energized.", tags: ["capable"], intensity: "high" },
    { id: "energy_014", category_id: "energy", text: "I meet the day with enthusiasm.", tags: ["enthusiasm"], intensity: "high" },
    { id: "energy_015", category_id: "energy", text: "I activate my strength from within.", tags: ["strength"], intensity: "high" },
    { id: "energy_016", category_id: "energy", text: "I shake off sluggishness and move forward.", tags: ["sluggish"], intensity: "high" },
    { id: "energy_017", category_id: "energy", text: "I fuel my body with supportive choices.", tags: ["health"], intensity: "high" },
    { id: "energy_018", category_id: "energy", text: "I let excitement carry me into motion.", tags: ["excitement"], intensity: "high" },
    { id: "energy_019", category_id: "energy", text: "I listen to my body's call to move.", tags: ["body"], intensity: "high" },
    { id: "energy_020", category_id: "energy", text: "I take the first step right now.", tags: ["start"], intensity: "high" },
    { id: "energy_021", category_id: "energy", text: "I turn inspiration into concrete action.", tags: ["inspiration"], intensity: "high" },
    { id: "energy_022", category_id: "energy", text: "I embrace challenges as chances to use my strength.", tags: ["challenge"], intensity: "high" },
    { id: "energy_023", category_id: "energy", text: "I treat my energy as a powerful resource.", tags: ["resource"], intensity: "high" },
    { id: "energy_024", category_id: "energy", text: "I stand tall and feel my power rising.", tags: ["posture"], intensity: "high" },
    { id: "energy_025", category_id: "energy", text: "I let music, movement, and breath wake me up.", tags: ["ritual"], intensity: "high" },
    { id: "energy_026", category_id: "energy", text: "I replace stagnation with small, steady movement.", tags: ["movement"], intensity: "high" },
    { id: "energy_027", category_id: "energy", text: "I channel my energy into what matters most.", tags: ["priorities"], intensity: "high" },
    { id: "energy_028", category_id: "energy", text: "I wake up my mind with curiosity.", tags: ["curiosity"], intensity: "high" },
    { id: "energy_029", category_id: "energy", text: "I am stronger than my excuses.", tags: ["excuses"], intensity: "high" },
    { id: "energy_030", category_id: "energy", text: "I invite momentum to build throughout my day.", tags: ["momentum"], intensity: "high" },
    { id: "energy_031", category_id: "energy", text: "I create a life that energizes me.", tags: ["lifestyle"], intensity: "high" },
    { id: "energy_032", category_id: "energy", text: "I move my body to wake up my mind.", tags: ["movement"], intensity: "high" },
    { id: "energy_033", category_id: "energy", text: "I use my energy in ways that feel aligned.", tags: ["alignment"], intensity: "high" },
    { id: "energy_034", category_id: "energy", text: "I welcome productive, focused intensity.", tags: ["focus"], intensity: "high" },
    { id: "energy_035", category_id: "energy", text: "I am capable of more than I assumed today.", tags: ["capacity"], intensity: "high" },
    { id: "energy_036", category_id: "energy", text: "I feel life moving through me with force.", tags: ["vitality"], intensity: "high" },
    { id: "energy_037", category_id: "energy", text: "I show up fully awake for my own life.", tags: ["presence"], intensity: "high" },
    { id: "energy_038", category_id: "energy", text: "I carry strong, grounded energy into everything I do.", tags: ["grounded"], intensity: "high" },

    /* HEALING (38) */
    { id: "healing_001", category_id: "healing", text: "I am safe to feel my emotions.", tags: ["emotion"], intensity: "low" },
    { id: "healing_002", category_id: "healing", text: "I release the weight I no longer need.", tags: ["release"], intensity: "low" },
    { id: "healing_003", category_id: "healing", text: "My body knows how to heal.", tags: ["body"], intensity: "low" },
    { id: "healing_004", category_id: "healing", text: "I treat myself with compassion.", tags: ["self_compassion"], intensity: "low" },
    { id: "healing_005", category_id: "healing", text: "I allow softness where there was tension.", tags: ["softness"], intensity: "low" },
    { id: "healing_006", category_id: "healing", text: "I forgive myself for the pressure I've carried.", tags: ["forgiveness"], intensity: "low" },
    { id: "healing_007", category_id: "healing", text: "I breathe out old stories.", tags: ["stories"], intensity: "low" },
    { id: "healing_008", category_id: "healing", text: "I choose healing over self-judgment.", tags: ["judgment"], intensity: "low" },
    { id: "healing_009", category_id: "healing", text: "I deserve rest, peace, and care.", tags: ["worthiness"], intensity: "low" },
    { id: "healing_010", category_id: "healing", text: "I let my heart feel supported.", tags: ["heart"], intensity: "low" },
    { id: "healing_011", category_id: "healing", text: "Healing happens gently, in its own time.", tags: ["time"], intensity: "low" },
    { id: "healing_012", category_id: "healing", text: "I make space for emotional renewal.", tags: ["renewal"], intensity: "low" },
    { id: "healing_013", category_id: "healing", text: "I welcome comfort into my life.", tags: ["comfort"], intensity: "low" },
    { id: "healing_014", category_id: "healing", text: "My inner world grows softer and safer.", tags: ["safety"], intensity: "low" },
    { id: "healing_015", category_id: "healing", text: "I restore myself one breath at a time.", tags: ["breath"], intensity: "low" },
    { id: "healing_016", category_id: "healing", text: "I allow myself to grieve what I lost.", tags: ["grief"], intensity: "low" },
    { id: "healing_017", category_id: "healing", text: "I treat my pain with patience and care.", tags: ["pain"], intensity: "low" },
    { id: "healing_018", category_id: "healing", text: "I know that healing is not linear, and that is okay.", tags: ["process"], intensity: "low" },
    { id: "healing_019", category_id: "healing", text: "I let supportive people and resources move closer.", tags: ["support"], intensity: "low" },
    { id: "healing_020", category_id: "healing", text: "I speak to myself the way I would to a friend.", tags: ["self_talk"], intensity: "low" },
    { id: "healing_021", category_id: "healing", text: "I am not defined by what hurt me.", tags: ["identity"], intensity: "low" },
    { id: "healing_022", category_id: "healing", text: "I let my nervous system know it is safe now.", tags: ["nervous_system"], intensity: "low" },
    { id: "healing_023", category_id: "healing", text: "I release the need to rush my healing.", tags: ["time"], intensity: "low" },
    { id: "healing_024", category_id: "healing", text: "I honor how far I have already come.", tags: ["progress"], intensity: "low" },
    { id: "healing_025", category_id: "healing", text: "I allow myself to be a work in progress.", tags: ["growth"], intensity: "low" },
    { id: "healing_026", category_id: "healing", text: "I gently loosen the grip of old wounds.", tags: ["wounds"], intensity: "low" },
    { id: "healing_027", category_id: "healing", text: "I invite moments of relief into my day.", tags: ["relief"], intensity: "low" },
    { id: "healing_028", category_id: "healing", text: "I let my breath wash through places that ache.", tags: ["body"], intensity: "low" },
    { id: "healing_029", category_id: "healing", text: "I can hold both pain and hope at once.", tags: ["hope"], intensity: "low" },
    { id: "healing_030", category_id: "healing", text: "I choose to care for myself like someone I love.", tags: ["self_love"], intensity: "low" },
    { id: "healing_031", category_id: "healing", text: "I let compassionate thoughts replace harsh ones.", tags: ["self_talk"], intensity: "low" },
    { id: "healing_032", category_id: "healing", text: "I honor my body's signals instead of ignoring them.", tags: ["body"], intensity: "low" },
    { id: "healing_033", category_id: "healing", text: "I know that rest is part of repair.", tags: ["rest"], intensity: "low" },
    { id: "healing_034", category_id: "healing", text: "I create gentle rituals that help me feel safe.", tags: ["ritual"], intensity: "low" },
    { id: "healing_035", category_id: "healing", text: "I release shame and welcome understanding.", tags: ["shame"], intensity: "low" },
    { id: "healing_036", category_id: "healing", text: "I allow my story to include recovery and growth.", tags: ["story"], intensity: "low" },
    { id: "healing_037", category_id: "healing", text: "I am learning to feel safer inside my own skin.", tags: ["safety"], intensity: "low" },
    { id: "healing_038", category_id: "healing", text: "I welcome steady, sustainable healing into my life.", tags: ["healing"], intensity: "low" },

    /* IDENTITY (38) */
    { id: "identity_001", category_id: "identity", text: "I am becoming the person I choose to be.", tags: ["choice"], intensity: "medium" },
    { id: "identity_002", category_id: "identity", text: "My identity rises from my intentions.", tags: ["intention"], intensity: "medium" },
    { id: "identity_003", category_id: "identity", text: "I embody the traits that serve me.", tags: ["traits"], intensity: "medium" },
    { id: "identity_004", category_id: "identity", text: "I am rewriting old patterns with clarity.", tags: ["patterns"], intensity: "medium" },
    { id: "identity_005", category_id: "identity", text: "I align my actions with my vision.", tags: ["alignment"], intensity: "medium" },
    { id: "identity_006", category_id: "identity", text: "I trust who I'm becoming.", tags: ["future_self"], intensity: "medium" },
    { id: "identity_007", category_id: "identity", text: "My identity grows stronger each day.", tags: ["growth"], intensity: "medium" },
    { id: "identity_008", category_id: "identity", text: "I honor the version of me that's emerging.", tags: ["emerging_self"], intensity: "medium" },
    { id: "identity_009", category_id: "identity", text: "I release old labels that no longer fit.", tags: ["labels"], intensity: "medium" },
    { id: "identity_010", category_id: "identity", text: "I move from intention to identity.", tags: ["intention"], intensity: "medium" },
    { id: "identity_011", category_id: "identity", text: "I am building a self I'm proud of.", tags: ["pride"], intensity: "medium" },
    { id: "identity_012", category_id: "identity", text: "I choose a story that supports my growth.", tags: ["story"], intensity: "medium" },
    { id: "identity_013", category_id: "identity", text: "I step into the reality I'm creating.", tags: ["reality"], intensity: "medium" },
    { id: "identity_014", category_id: "identity", text: "I show up as my future self today.", tags: ["future_self"], intensity: "medium" },
    { id: "identity_015", category_id: "identity", text: "I embody the identity that leads me forward.", tags: ["identity"], intensity: "medium" },
    { id: "identity_016", category_id: "identity", text: "I hold beliefs that match who I want to be.", tags: ["belief"], intensity: "medium" },
    { id: "identity_017", category_id: "identity", text: "I let my habits reflect my chosen identity.", tags: ["habits"], intensity: "medium" },
    { id: "identity_018", category_id: "identity", text: "I am no longer obligated to my old patterns.", tags: ["patterns"], intensity: "medium" },
    { id: "identity_019", category_id: "identity", text: "I see myself as capable, resilient, and evolving.", tags: ["self_image"], intensity: "medium" },
    { id: "identity_020", category_id: "identity", text: "I allow my identity to change as I grow.", tags: ["growth"], intensity: "medium" },
    { id: "identity_021", category_id: "identity", text: "I choose an identity rooted in self-respect.", tags: ["self_respect"], intensity: "medium" },
    { id: "identity_022", category_id: "identity", text: "I let go of identities built only from survival.", tags: ["survival"], intensity: "medium" },
    { id: "identity_023", category_id: "identity", text: "I define myself by my values, not my fears.", tags: ["values"], intensity: "medium" },
    { id: "identity_024", category_id: "identity", text: "I become more myself with every aligned choice.", tags: ["aligned_choice"], intensity: "medium" },
    { id: "identity_025", category_id: "identity", text: "I allow identities that once protected me to soften.", tags: ["protection"], intensity: "medium" },
    { id: "identity_026", category_id: "identity", text: "I build identity through small, repeated actions.", tags: ["repetition"], intensity: "medium" },
    { id: "identity_027", category_id: "identity", text: "I think and act like the person I aim to be.", tags: ["future_self"], intensity: "medium" },
    { id: "identity_028", category_id: "identity", text: "I let my environment reflect who I am becoming.", tags: ["environment"], intensity: "medium" },
    { id: "identity_029", category_id: "identity", text: "I speak about myself in ways that honor my growth.", tags: ["self_talk"], intensity: "medium" },
    { id: "identity_030", category_id: "identity", text: "I no longer rehearse identities that keep me small.", tags: ["smallness"], intensity: "medium" },
    { id: "identity_031", category_id: "identity", text: "I experiment with new ways of being without judgment.", tags: ["experimentation"], intensity: "medium" },
    { id: "identity_032", category_id: "identity", text: "I update my self-image as new evidence appears.", tags: ["evidence"], intensity: "medium" },
    { id: "identity_033", category_id: "identity", text: "I see myself as someone who follows through.", tags: ["follow_through"], intensity: "medium" },
    { id: "identity_034", category_id: "identity", text: "I identify as a person who takes gentle, consistent action.", tags: ["action"], intensity: "medium" },
    { id: "identity_035", category_id: "identity", text: "I allow my self-image to be kind and accurate.", tags: ["self_image"], intensity: "medium" },
    { id: "identity_036", category_id: "identity", text: "I choose identities that feel supportive in my body.", tags: ["embodiment"], intensity: "medium" },
    { id: "identity_037", category_id: "identity", text: "I am the author of the story I tell about myself.", tags: ["author"], intensity: "medium" },
    { id: "identity_038", category_id: "identity", text: "I step forward today as the most aligned version of me.", tags: ["alignment"], intensity: "medium" },
  ],
};

/**
 * Get all affirmations for a specific category
 */
export function getAffirmationsByCategory(categoryId: string): Affirmation[] {
  return affirmationLibrary.affirmations.filter((a) => a.category_id === categoryId);
}

/**
 * Get a specific affirmation by ID
 */
export function getAffirmationById(id: string): Affirmation | undefined {
  return affirmationLibrary.affirmations.find((a) => a.id === id);
}

/**
 * Get all categories
 */
export function getCategories(): AffirmationCategory[] {
  return affirmationLibrary.categories.sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Get a category by ID
 */
export function getCategoryById(id: string): AffirmationCategory | undefined {
  return affirmationLibrary.categories.find((c) => c.id === id);
}

/**
 * Search affirmations by text or tags
 */
export function searchAffirmations(query: string, categoryId?: string): Affirmation[] {
  const lowerQuery = query.toLowerCase();
  let results = affirmationLibrary.affirmations;

  if (categoryId) {
    results = results.filter((a) => a.category_id === categoryId);
  }

  return results.filter(
    (a) =>
      a.text.toLowerCase().includes(lowerQuery) ||
      a.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

