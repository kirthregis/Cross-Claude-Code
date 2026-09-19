/**
 * The app's own product name — distinct from the artist's name
 * (settings.artistName, used inside contracts/releases/pitches).
 *
 * Set NEXT_PUBLIC_STUDIO_NAME when deploying your own copy of this app to
 * rebrand the parts that render before any settings can load (the page
 * title, PWA install title). The in-app header and everything else read
 * settings.studioName instead, which defaults to this value but can be
 * changed from Settings without a redeploy.
 */
export const DEFAULT_STUDIO_NAME = process.env.NEXT_PUBLIC_STUDIO_NAME?.trim() || "EmyStudio";
