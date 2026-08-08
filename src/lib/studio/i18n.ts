/**
 * EMY Studio — internationalization (English + Arabic).
 *
 * Usage: import { t } from "@/lib/studio/i18n";
 * Then:  t("studio_title", arabic)  → "Your studio, one place" or "استوديوك، في مكان واحد"
 *
 * The arabic flag comes from useArabic() hook or the localStorage key "emy-studio-arabic".
 */

const translations: Record<string, { en: string; ar: string }> = {
  // ── Nav ─────────────────────────────────────────────────
  studio: { en: "Studio", ar: "الاستوديو" },
  library: { en: "Library", ar: "المكتبة" },
  epk: { en: "EPK", ar: "ملف صحفي" },
  gigradar: { en: "GigRadar", ar: "رادار الحفلات" },
  planner: { en: "Planner", ar: "المخطط" },
  analytics: { en: "Analytics", ar: "التحليلات" },
  distribute: { en: "Distribute", ar: "التوزيع" },
  community: { en: "Community", ar: "المجتمع" },
  settings: { en: "Settings", ar: "الإعدادات" },

  // ── Studio Home ─────────────────────────────────────────
  studio_title: { en: "Your studio, one place", ar: "استوديوك، في مكان واحد" },
  studio_subtitle: { en: "Master the mix, design the cover, package the release, pass the platform checks — no engineer, no designer, no hours of grunt work.", ar: "أتقن المكس، صمم الغلاف، جهّز الإصدار، اجتز فحوصات المنصة — بدون مهندس، بدون مصمم، بدون ساعات عمل شاق." },
  new_project: { en: "+ New project", ar: "+ مشروع جديد" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  create_project: { en: "Create project", ar: "إنشاء مشروع" },
  project_name_placeholder: { en: "Project name — e.g. Afro House Mix 2026", ar: "اسم المشروع — مثال: أفرو هاوس مكس ٢٠٢٦" },
  dj_mix: { en: "🎧 DJ Mix", ar: "🎧 مكس دي جي" },
  track: { en: "🎵 Track", ar: "🎵 مقطوعة" },
  genre_placeholder: { en: "Genre — e.g. Afro House", ar: "النوع — مثال: أفرو هاوس" },
  mood_placeholder: { en: "Mood for the cover — e.g. golden sunset, deep and hypnotic", ar: "أجواء الغلاف — مثال: غروب ذهبي، عميق ومنوّم" },
  projects: { en: "Projects", ar: "المشاريع" },
  no_projects: { en: "No projects yet", ar: "لا مشاريع بعد" },
  no_projects_desc: { en: "Create a project, drop in your mix, and the studio takes it from raw file to upload-ready release.", ar: "أنشئ مشروعاً، أضف المكس، والاستوديو يأخذه من ملف خام إلى إصدار جاهز للرفع." },
  start_project: { en: "+ Start a project", ar: "+ ابدأ مشروعاً" },

  // ── Quick Action Cards ──────────────────────────────────
  master_title: { en: "Master your mix", ar: "أتقن المكس" },
  master_desc: { en: "5-band EQ, compressor, soft clipper, limiter, stereo width — studio-grade, on-device.", ar: "معادل ٥ نطاقات، ضاغط، قاطع ناعم، محدد، عرض ستيريو — بجودة استوديو، على جهازك." },
  artwork_title: { en: "Cover artwork", ar: "غلاف العمل الفني" },
  artwork_desc: { en: "AI-designed covers (Gemini or fal.ai) or offline templates, exported at 3000×3000.", ar: "أغلفة مصممة بالذكاء الاصطناعي أو قوالب بدون إنترنت، بحجم ٣٠٠٠×٣٠٠٠." },
  release_title: { en: "Release & publish", ar: "الإصدار والنشر" },
  release_desc: { en: "Title, description, tracklist, tags, checks — formatted for YouTube and labels.", ar: "العنوان، الوصف، قائمة المقاطع، الوسوم، الفحوصات — منسقة ليوتيوب والليبلات." },

  // ── Master Panel ────────────────────────────────────────
  audio_source: { en: "Audio Source", ar: "مصدر الصوت" },
  choose_audio: { en: "⬆ Choose Audio File", ar: "⬆ اختر ملف صوتي" },
  replace_audio: { en: "↻ Replace Audio", ar: "↻ استبدال الصوت" },
  drop_audio: { en: "Drag and drop your raw mix (MP3, WAV, M4A, FLAC, AIFF) or browse.", ar: "اسحب المكس الخام (MP3, WAV, M4A, FLAC, AIFF) أو تصفح." },
  presets: { en: "Mastering Targets & Presets", ar: "أهداف الماسترنج والإعدادات المسبقة" },
  input_quick_fix: { en: "Input & Quick Fix", ar: "الإدخال والإصلاح السريع" },
  input_gain: { en: "Input Gain", ar: "مستوى الإدخال" },
  rumble_cut: { en: "Rumble Cut", ar: "قطع الضوضاء" },
  cut_mud: { en: "Cut Mud", ar: "قطع الطين" },
  add_air: { en: "Add Air", ar: "إضافة هواء" },
  mono_bass: { en: "Mono Bass", ar: "باس أحادي" },
  eq_5band: { en: "5-Band Parametric EQ", ar: "معادل بارامتري ٥ نطاقات" },
  compressor: { en: "Compressor", ar: "الضاغط" },
  threshold: { en: "Threshold", ar: "العتبة" },
  ratio: { en: "Ratio", ar: "النسبة" },
  attack: { en: "Attack", ar: "الهجوم" },
  release: { en: "Release", ar: "الإفلات" },
  knee: { en: "Knee", ar: "الركبة" },
  limiter_clipper_stereo: { en: "Limiter, Clipper & Stereo", ar: "المحدد، القاطع والستيريو" },
  limiter_drive: { en: "Limiter Drive", ar: "قوة المحدد" },
  true_peak_ceiling: { en: "True Peak Ceiling", ar: "سقف الذروة الحقيقية" },
  soft_clipper: { en: "Soft Clipper (analog warmth)", ar: "قاطع ناعم (دفء تناظري)" },
  clip_drive: { en: "Clip Drive", ar: "قوة القطع" },
  stereo_width: { en: "Stereo Width", ar: "عرض الستيريو" },
  dither: { en: "Dither (16-bit export)", ar: "ديثر (تصدير ١٦ بت)" },
  master_now: { en: "⚡ Master Mix Now", ar: "⚡ اتقن المكس الآن" },
  remaster: { en: "⚡ Re-Master Mix", ar: "⚡ إعادة الماسترنج" },
  mastering_execution: { en: "Mastering Execution", ar: "تنفيذ الماسترنج" },
  ab_preview: { en: "A/B Master Audition & Preview", ar: "معاينة ومقارنة A/B" },
  original_audio: { en: "Original Audio", ar: "الصوت الأصلي" },
  mastered_dsp: { en: "Mastered DSP", ar: "معالج رقمي متقن" },
  export_label: { en: "Label Deliverables & WAV Export", ar: "ملفات الليبل وتصدير WAV" },
  export_24bit: { en: "⬇ Export 24-Bit / 48kHz WAV (Label Master)", ar: "⬇ تصدير WAV ٢٤ بت / ٤٨ كيلوهرتز (ماستر الليبل)" },
  export_16bit: { en: "⬇ Export 16-Bit / 48kHz WAV (Dithered)", ar: "⬇ تصدير WAV ١٦ بت / ٤٨ كيلوهرتز (ديثر)" },

  // ── Tracklist ───────────────────────────────────────────
  tracklist: { en: "Tracklist", ar: "قائمة المقاطع" },
  add_track: { en: "+ Add Track", ar: "+ إضافة مقطوعة" },
  add_first_track: { en: "+ Add First Track", ar: "+ أضف المقطوعة الأولى" },
  no_tracks: { en: "No tracks added yet", ar: "لم تضف مقاطع بعد" },
  no_tracks_desc: { en: "Add every track in your set with the timestamp. This goes into your YouTube description, SoundCloud, 1001Tracklists.", ar: "أضف كل مقطوعة في السِت مع الوقت. ستُضاف لوصف يوتيوب وساوندكلاود و1001Tracklists." },
  copy_youtube: { en: "📋 Copy for YouTube", ar: "📋 نسخ ليوتيوب" },
  copy_1001: { en: "📋 Copy for 1001Tracklists", ar: "📋 نسخ لـ 1001Tracklists" },
  copy_markdown: { en: "📋 Copy Markdown", ar: "📋 نسخ ماركداون" },
  export_copy: { en: "Export & Copy", ar: "تصدير ونسخ" },

  // ── Artwork ─────────────────────────────────────────────
  cover_preview: { en: "Cover preview · 3000×3000", ar: "معاينة الغلاف · ٣٠٠٠×٣٠٠٠" },
  generate_cover: { en: "Generate Cover", ar: "إنشاء الغلاف" },
  save_use_cover: { en: "✓ Save & use this cover", ar: "✓ حفظ واستخدام هذا الغلاف" },

  // ── Release ─────────────────────────────────────────────
  generate_release: { en: "✨ Generate release pack", ar: "✨ إنشاء حزمة الإصدار" },
  release_not_generated: { en: "Release pack not generated yet", ar: "لم تُنشأ حزمة الإصدار بعد" },
  save_pack: { en: "💾 Save pack", ar: "💾 حفظ الحزمة" },
  copy_title: { en: "Copy title", ar: "نسخ العنوان" },
  copy_description: { en: "Copy description", ar: "نسخ الوصف" },
  copy_all: { en: "Copy all for upload", ar: "نسخ الكل للرفع" },
  release_notes: { en: "⬇ Release notes (.txt)", ar: "⬇ ملاحظات الإصدار (.txt)" },
  open_youtube: { en: "▶ Open YouTube Studio", ar: "▶ فتح يوتيوب ستوديو" },

  // ── Check ───────────────────────────────────────────────
  release_readiness: { en: "Release readiness", ar: "جاهزية الإصدار" },
  run_check: { en: "🔍 Run check", ar: "🔍 تشغيل الفحص" },

  // ── Library ─────────────────────────────────────────────
  music_library: { en: "Music Library", ar: "المكتبة الموسيقية" },
  add_files: { en: "Add files", ar: "إضافة ملفات" },
  add_folder: { en: "📁 Add folder", ar: "📁 إضافة مجلد" },
  nothing_playing: { en: "Nothing playing", ar: "لا شيء يعمل" },

  // ── Community ───────────────────────────────────────────
  mena_community: { en: "🌍 MENA Community", ar: "🌍 مجتمع الشرق الأوسط وشمال أفريقيا" },
  discover_artists: { en: "🔍 Discover Artists", ar: "🔍 اكتشف فنانين" },
  opportunities: { en: "🎯 Opportunities", ar: "🎯 فرص" },
  connect: { en: "🤝 Connect", ar: "🤝 تواصل" },
  all_genres: { en: "All Genres", ar: "كل الأنواع" },
  all_cities: { en: "All Cities", ar: "كل المدن" },
  looking_for: { en: "Looking for", ar: "يبحث عن" },
  request_sent: { en: "✓ Request Sent", ar: "✓ تم الإرسال" },
  connect_btn: { en: "Connect", ar: "تواصل" },
  apply_respond: { en: "Apply / Respond", ar: "تقديم / ردّ" },

  // ── GigRadar ────────────────────────────────────────────
  gig_radar: { en: "GigRadar", ar: "رادار الحفلات" },
  find_gigs: { en: "Find gigs", ar: "ابحث عن حفلات" },
  sweep_now: { en: "Sweep now", ar: "مسح الآن" },

  // ── EPK ─────────────────────────────────────────────────
  press_kit: { en: "Press Kit & EPK", ar: "الملف الصحفي" },
  upload_epk: { en: "⬆ Upload EPK", ar: "⬆ رفع الملف الصحفي" },
  upload_portrait: { en: "⬆ Upload portrait", ar: "⬆ رفع الصورة" },
  save_notes: { en: "💾 Save notes", ar: "💾 حفظ الملاحظات" },

  // ── Settings ────────────────────────────────────────────
  audio_output: { en: "Audio output", ar: "مخرج الصوت" },
  playback_device: { en: "Playback device", ar: "جهاز التشغيل" },
  test_audio: { en: "🔊 Test Audio Output", ar: "🔊 اختبار مخرج الصوت" },
  danger_zone: { en: "Danger zone", ar: "منطقة خطرة" },
  reset_all: { en: "Reset all studio data", ar: "مسح كل بيانات الاستوديو" },

  // ── Common ──────────────────────────────────────────────
  back_to_studio: { en: "← Studio", ar: "← الاستوديو" },
  total: { en: "total", ar: "إجمالي" },
  pass: { en: "pass", ar: "ناجح" },
  warn: { en: "warn", ar: "تحذير" },
  fail: { en: "fail", ar: "فاشل" },
  loading: { en: "Loading…", ar: "جارٍ التحميل…" },
  saved: { en: "✓ Saved", ar: "✓ تم الحفظ" },
  copied: { en: "✓ Copied", ar: "✓ تم النسخ" },
};

/**
 * Get translated text. Falls back to English if key not found.
 */
export function t(key: string, arabic: boolean): string {
  const entry = translations[key];
  if (!entry) return key;
  return arabic ? entry.ar : entry.en;
}

/**
 * Check if Arabic mode is active (reads from localStorage, safe for server).
 */
export function isArabic(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("emy-studio-arabic") === "true";
  } catch {
    return false;
  }
}


// Re-export useArabic for convenience
export { useArabic } from "@/components/studio/ArabicToggle";

/**
 * Hook: returns t() bound to current arabic state.
 * Usage: const { t, arabic } = useT();
 *        <h1>{t("studio_title")}</h1>
 */
export function useT() {
  // We can't call useArabic here since this is a .ts not .tsx
  // Use the raw check instead
  return { t, isArabic };
}
