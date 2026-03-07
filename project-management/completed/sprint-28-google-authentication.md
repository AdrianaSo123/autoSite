# Sprint 28 — Google Authentication

## Objective
Add Google OAuth authentication via NextAuth.

## Tasks
- [x] Configure Google provider in NextAuth
- [x] Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ADMIN_EMAIL env vars
- [x] Implement isAdmin helper (session.user.email === ADMIN_EMAIL)
- [x] Add sign-in UI to navigation

## Verification
- [x] user can sign in with Google
- [x] session contains user email
- [x] admin email detection works
