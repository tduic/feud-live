# Feud Live

A free, realtime Family-Feud-style web app:
- 4 teams
- lobby + team assignment
- buzzer (first tap wins)
- question/answer board with reveal
- host scoring + strikes + round multiplier
- shared timer

## 1) Prereqs (free)
- Node.js 18+
- A free Firebase project (Firestore)
- (Optional) free Vercel account for deployment

## 2) Firebase setup (one-time)
1. Create a Firebase project
2. Enable **Firestore**
3. Paste rules from `FIRESTORE_RULES.txt` into Firestore Rules
4. Add a **Web app** and copy the config values into a file named `.env.local` (start from `.env.local.example`)

## 3) Run locally
```bash
npm install
npm run dev
```
Open the URL printed (usually http://localhost:3000)

## 4) Deploy for free (Vercel)
1. Push this repo to GitHub
2. In Vercel: New Project -> Import your repo
3. Set the same env vars from `.env.local` in Vercel's Environment Variables
4. Deploy

## Notes
- This is designed for friends / party use. Subcollection writes (players/buzzes) are intentionally permissive.
