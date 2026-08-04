/** Small helpers for EMY Studio. */

let counter = 0;

export function newId(): string {
  counter = (counter + 1) % 1000;
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rand}-${counter.toString(36)}`;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
