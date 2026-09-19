/**
 * The app's own product name — distinct from the artist's name
 * (settings.artistName, used inside contracts/releases/pitches). Used as
 * the default for settings.studioName (Settings → Studio Name, renameable
 * live) and wherever server-side code can't read that per-browser setting
 * (email from-names, the crash screen, page metadata rendered before
 * Settings loads).
 */
export const DEFAULT_STUDIO_NAME = "EmyStudio";
