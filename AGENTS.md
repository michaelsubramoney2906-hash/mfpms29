# Project Instructions & Rules

- **Mandatory Storage Pipeline (Supabase)**: Everything in this application, every single module and subsequently sub module, MUST be stored on Supabase.
- **No Local State**: Do not use in-memory data structures (e.g. `Map`, `Array`) or local disk files to persist any application data.
- **Data Fetching architecture**: All database interactions must happen via a secure server-side implementation utilizing the official `@supabase/supabase-js` client rather than exposing service keys or sensitive schemas to the frontend React environment.
