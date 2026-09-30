# Existing Supabase contract

This build intentionally does not overwrite an existing database.

Required existing authentication tables:

- `admins`: `id`, `phone_e164`, `name`, `password_hash`, `active`
- `approved_students`: `id`, `name`, `roll_no`, `section`, `phone_e164`, `active`

Optional academic tables used by the UI:

- `notes`
- `assignments`
- `routine`
- `syllabus`
- `notices`
- `queries`
- `notifications`

The API uses the server-side service-role client for controlled operations and does not expose the service-role key to the browser.
