/* Public client configuration.
   The Supabase URL and publishable (anon) key are designed to be public:
   every table is protected by row-level security on the server.
   Leave them empty to run in device-only mode (no accounts). */
window.CISSP_CONFIG = {
  // On the live site, database calls go through the site's own address (/sb), which Netlify
  // forwards to Supabase. Networks that block supabase.co therefore don't break sign-in.
  supabaseUrl: /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "https://llwvcdcxpiejurqtpgsw.supabase.co"
    : location.origin + "/sb",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsd3ZjZGN4cGllanVycXRwZ3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzODczODUsImV4cCI6MjEwOTk2MzM4NX0.kzRybwys2ww4dSxF-WfIzP7AeQbJBxQqo23vSahh5AE",
  privacyVersion: "2026-11-v1",
  contactEmail: "" // grievance / privacy contact shown in the privacy notice
};
