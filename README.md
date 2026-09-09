# Expertising Register — Stanley Gibbons

Internal system for tracking stamps sent away for expertising.

## What it does

1. **Items for Expertising** — the IFE form, one per item. The expertiser is chosen here.
2. **Awaiting sending** — everything not yet sent, grouped under its expertiser.
3. **Sending lists** — a group becomes a numbered list (#1000). Each item takes a position, so item 1 on list 1000 is reference `1000/1`. That reference is fixed from then on.
4. **Print** — each list prints as one A4 sheet: expertiser at the top, numbered items below.
5. **Returns & search** — find an item by `1000/1`, by list number, or by description, and record the date back, the result and the certificate number.

## Setting it up (no terminal needed)

### 1. Supabase

- Create a project.
- **SQL Editor → New query**, paste the whole of `supabase-schema.sql`, and Run.
- **Authentication → Users → Add user**. Create one account for the team, tick **Auto Confirm User**, and note the email and password. This is the shared login.
- **Project Settings → API**: copy the **Project URL** and the **anon public** key.

### 2. GitHub

Create the repository and add these files, keeping the folder structure exactly:

```
package.json
vite.config.js
index.html
supabase-schema.sql
src/main.jsx
src/App.jsx
src/index.css
src/lib/supabase.js
src/lib/constants.js
src/components/Login.jsx
src/components/IFEForm.jsx
src/components/Sending.jsx
src/components/Lists.jsx
src/components/PrintSheet.jsx
src/components/Returns.jsx
```

To create a file in a folder, use **Add file → Create new file** and type the full path,
e.g. `src/components/Login.jsx` — GitHub makes the folders for you.

### 3. Vercel

- Import the repository. Framework preset: **Vite**. Leave the build settings alone.
- Add two environment variables before deploying:
  - `VITE_SUPABASE_URL` — the Project URL
  - `VITE_SUPABASE_ANON_KEY` — the anon public key
- Deploy.

If you add the variables after the first deploy, redeploy for them to take effect.

## Changing things later

- **Team members** — `src/lib/constants.js`, the `TEAM` list. Names appear in every dropdown.
- **Result options** — `src/lib/constants.js`, the `RESULTS` list.
- **Starting list number** — set before the first list is created: Supabase → Table Editor →
  `settings` → change `next_list_number`. It is 1000 by default.
- **Colours** — the `:root` block at the top of `src/index.css`.
