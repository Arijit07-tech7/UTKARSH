# UTKARSH — Your Academic Command Center

Premium Next.js + Supabase college companion for Narula Institute of Technology, Information Technology, IT-C.

## Developers
- ARIJIT GUPTA
- ABIR GHOSH

## Setup

1. Copy `.env.example` to `.env.local` and keep your existing Supabase values.
2. Install dependencies: `npm install`
3. Start: `npm run dev`
4. Production check: `npm run build`

The application reads `.env.local` from the project root. Never commit service-role keys.

## Existing Supabase compatibility

Admin login uses the existing `admins` columns:
`id`, `phone_e164`, `name`, `password_hash`, `active`.

Student login uses:
`approved_students`: `id`, `name`, `roll_no`, `section`, `phone_e164`, `active`.

Academic resources use allowlisted Supabase tables: `notes`, `assignments`, `routine`, `syllabus`, `notices`, `queries`, `notifications`.
If a table is not present yet, the UI shows an empty state rather than crashing.

## Security

- Service-role key is server-only.
- Login creates an HTTP-only `utkarsh_session` cookie.
- Admin write APIs require an admin session.
- Student-facing data APIs require an authenticated session.
