# StudyCISSP

A book-like CISSP study companion for any learner, written against the
**CISSP Exam Outline effective 15 April 2024** (in force until 14 April 2027).

## What's inside

- **Accounts** (Supabase Auth): sign up with email verification, sign in with
  email *or* username, password reset. Admins can also create learners.
- **Onboarding**: name, experience, target and latest exam dates, weekly hours,
  and a self-assessment per domain. The answers order the learner's path,
  generate their study plan and set focus domains.
- **Eight long-form chapters** with callouts, Memorise cards and per-topic quizzes.
- **Quiz** by domain, by topic, mixed (exam-weighted) or "my weak areas";
  **Flashcards** with spaced repetition; timed **Mock exams**.
- **Insights**: active study time per day, domain and topic, streaks, accuracy, mock trend.
- **My library**: upload documents (private storage) or save links and YouTube videos.
- **Privacy & trust centre**: GDPR / DPDP notice, consent records, data export,
  correction requests, analytics opt-out and self-service account deletion;
  ISO 27001:2022 control mapping and an ISO 31000 risk register.
- **Admin console**: learner analytics, leaderboards, hardest topics, per-learner
  drill-down, append-only audit trail with CSV export, privacy-request queue,
  role changes, erasure, and learner creation.
- Without database settings the site runs in **device-only mode** (no accounts,
  data kept in the browser).

## Structure

```
index.html                     page shell
assets/css/style.css           styles
assets/js/config.js            Supabase URL + publishable key (public by design)
assets/js/content-1/2.js       chapter content, Domains 1-8
assets/js/bank.js              extra questions, flashcards, encouragement
assets/js/pages.js             tactics, what's new, resources
assets/js/db.js                data layer (Supabase or device-only)
assets/js/app.js               core: router, plan generator, time tracking, reading views
assets/js/study.js             quiz, flashcards, mock, insights, library
assets/js/account.js           sign-in, onboarding, profile, privacy centre
assets/js/admin.js             admin console
supabase/migrations/           database schema, RLS policies, functions
supabase/functions/            admin-create-user edge function
```

## Database set-up (Supabase free tier)

1. Create a free Supabase project.
2. Run `supabase/migrations/0001_cissp_reader.sql` in the SQL editor.
3. Set the admin email:
   `update app_settings set value = 'admin@example.com' where key = 'admin_email';`
4. Deploy `supabase/functions/admin-create-user`.
5. Authentication → URL configuration: set the Site URL to the Netlify URL.
6. Put the project URL and publishable key in `assets/js/config.js`.
7. For more than a few sign-ups an hour, add a free SMTP provider under
   Authentication → Emails (Supabase's built-in mailer is rate-limited).

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

## Deploy to Netlify

No build step. In Netlify, *Add new site → Import from Git*, pick this repo,
leave the build command empty and set the publish directory to `.`
(`netlify.toml` already does this). Or drag the folder onto
https://app.netlify.com/drop.

## Editing content

Each domain is a plain JavaScript object in `content-1.js` / `content-2.js`:
`sections[].body` is HTML, `memorise` is a list of strings, and `questions`
have `options`, a zero-based `answer`, and `why`.

*Not affiliated with ISC2. CISSP is a registered mark of ISC2, Inc.*
