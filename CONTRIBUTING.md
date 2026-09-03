# Contributing to Menkeu

Thanks for considering a contribution. Menkeu is a small, single-user personal finance tracker — the goal is to keep it simple and dependable, not to grow it into a multi-tenant SaaS. Keep that in mind when proposing bigger changes.

## Getting started

1. Fork the repo and clone your fork.
2. Follow the [Setup](README.md#setup) section in the README to get a local Supabase project, env vars, and the dev server running.
3. Create a branch for your change: `git checkout -b fix/short-description`.

## Development workflow

```bash
pnpm dev              # start the dev server (Turbopack)
pnpm lint             # ESLint
pnpm exec vitest run  # unit tests
pnpm build             # production build — run this before opening a PR
```

Notes on the codebase:

- **Next.js App Router + Server Actions.** Data mutations go through `actions.ts` files (server-side); there are no client-side API calls to Supabase. Keep it that way — see the [Security notes](README.md#security-notes) on why the service-role key must never reach the browser.
- **Single-user design.** There's no auth/accounts system by design (`APP_PASSWORD` gate only). If your change assumes multiple users, discuss it in an issue first — it's likely out of scope, or needs a bigger design conversation than a single PR.
- **Migrations.** Schema changes go in a new numbered file under `supabase/migrations/` (`NNNN_description.sql`), never edited into an old one. Update the migration list in the README's Setup section to match.
- **Indonesian UI copy, English code/comments.** The app's UI text is in Indonesian (the target audience); code, commit messages, and comments stay in English.

## Making a pull request

- Keep PRs focused — one feature or fix per PR is easier to review than a bundle of unrelated changes.
- Write a clear PR description: what changed and why. Screenshots are appreciated for UI changes.
- Make sure `pnpm lint`, `pnpm exec vitest run`, and `pnpm build` all pass before requesting review.
- If you're adding a feature that touches the database, include the migration and mention what you tested it against (fresh Supabase project vs. existing data).

## Reporting bugs / suggesting features

Open a GitHub issue with:

- What you expected to happen vs. what actually happened.
- Steps to reproduce, if it's a bug.
- Your environment (self-hosted vs. Vercel, Node version) if relevant.

## Code of conduct

Be respectful and constructive. This is a small personal-scale project maintained in spare time — response times may vary.
