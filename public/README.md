# Builds

| Build | Command | Contents |
|---|---|---|
| `docs/index.html` | `npm run standalone` | **Published build.** Includes EVG bank details and trade licence. |
| `public/index.html` | `npm run standalone:public` | Reduced build with no settlement or registration data. |

GitHub Pages can only serve from the repo root or `/docs` — not `/public`.
`docs/` is what gets published.

The Mashreq **CIF is never included in either build**: it doubles as the
password for Mashreq's protected statements, so it's a credential, not a
payment detail. Both builds hard-fail if it appears.
