# Shareable build

`public/index.html` is the version safe to publish. It deliberately contains
**no IBANs, no trade licence number and no bank CIF** — Emy needs pricing,
pitches and negotiation on her phone, never settlement details mid-conversation.

The full internal version (with company registration and bank details) is
`docs/index.html`. Do not publish that one.

Rebuild:
    npm run standalone          # docs/  — internal
    npm run standalone:public   # public/ — shareable

Both builds hard-fail if a credential leaks in.
