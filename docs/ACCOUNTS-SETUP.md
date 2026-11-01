# Free accounts and a real public/friends room directory

The website stays on GitHub Pages. Supabase Free provides authenticated accounts, unique tags, friendships and authoritative room state. PeerJS remains available for the existing guest demo/phone transport. No paid plan, SMTP subscription or hosting deployment is created by this integration.

## Connect your new project

### Current project setup

The `sahko` project was created in the `aalee-me` Free organization in `us-east-1`. Project reference: `zousmxqtoghscryeneef`. The `sahko_accounts_and_rooms` migration is installed, and `frontend/service-config.js` contains only its public URL and publishable key. The website configuration is prepared locally; publication is pending explicit approval for the account/database update to `main` and `gh-pages`.

Live checks confirmed 12 Sähkö tables with RLS enabled, no direct anonymous room reads or authenticated room writes, an available public directory, a signup-profile trigger, and rejection of unauthenticated joins. The local SQL integration test also passed.

**Still required in the dashboard:** [Authentication → URL Configuration](https://supabase.com/dashboard/project/zousmxqtoghscryeneef/auth/url-configuration): set **Site URL** to `https://aalee-me.github.io/sahko/` and add the same URL to **Redirect URLs**. The connected database tools do not expose an Auth configuration update operation. Email confirmation/delivery settings were not changed; see step 3 below.

Security advisor notices about [RLS with no policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) are expected for private room tables: browser privileges are revoked, and all access goes through checked RPCs. The [anonymous](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) SECURITY DEFINER notices identify the deliberately exposed RPC surface. Public RPCs return only directory previews and tag availability; authenticated operations check identity, friendship, membership and ownership. Internal helpers are not executable by browser roles. No table-reset or project-deletion operation was performed.

1. Create a **Free** Supabase project. In SQL Editor, run [`supabase/sahko.sql`](../supabase/sahko.sql). It creates only Sähkö-prefixed tables/functions and a Sähkö signup-profile trigger. Room tables deny direct browser reads/writes; authenticated functions enforce membership and ownership. Public profile rows contain a display name and unique tag, never an email address.
2. In Authentication → URL Configuration, set Site URL and an allowed redirect URL to `https://aalee-me.github.io/sahko/`.
3. Choose the email behavior for the demo. With email confirmation enabled, configure an approved mail provider or use the recipients allowed by Supabase's built-in sender. That sender has strict delivery/rate limits. For a small prototype, you can disable **Confirm email** under Authentication → Providers → Email; users then sign in immediately, but email addresses are unverified. The app handles both cases. No paid email service is configured automatically.
4. Send the **Project URL** and **publishable key** (or legacy **anon key**) so they can be added to `frontend/service-config.js`. Both are public browser configuration. Never send or commit a service-role or `sb_secret_` key. The application rejects private keys. Do not change the plan to enable this integration.
5. Refresh the GitHub app. Profile → **Account** offers real signup/sign-in, unique tags, profile editing, password recovery and sign-out. Demo and Closed sessions remain available without an account. Live account-backed rooms require sign-in.

## Behavior

- **Open → Public:** signed-in users create rooms that appear in Available rooms for other browsers. Guests can see public listings; joining requires an account. Password protection is a separate setting.
- **Open → Friends only:** only the owner's accepted friends can discover or join the room. Knowing the code alone does not bypass this check. Add friends by their unique `@tag` from Profile → Friends; incoming requests must be accepted.
- **Closed:** a personal session; no room code or public listing.
- Demo cards remain explicitly labeled. Maya, Eli, Sofia and Eecho are simulated demo participants and are never inserted into a real room.
- The owner can promote another member or remove them. Removal blocks that account from rejoining that room. In-app Exit asks for the next owner and defaults to the longest-present member. A sudden close/disconnect falls back to the oldest active member. The shared timer is stored in Supabase and continues independently of the original tab.
- On actual page exit, a `keepalive` leave request is sent. No custom owner picker can be shown by the browser's native tab-close prompt. If the request is lost, remaining participants' state checks expire the missing member after 90 seconds and promote the longest-present active member atomically.
- Private Void content, task lists, recap archives and uploaded profile photos retain their device-local storage. Account-backed room presence, voluntarily shared tasks, explicit chat, friendship requests and signaling use the database. Photos use the same local source throughout the orbital/profile; no cloud photo bucket is configured.
- Insights show measured trends from session timelines, with demos excluded by default. Missing measurements are gaps, not zeroes.

## Free-service limits

Supabase Free has quotas and may pause inactive projects. No paid upgrade or spend-cap change is made here. Current policies: [pricing](https://supabase.com/pricing), [cost control](https://supabase.com/docs/guides/platform/cost-control), [default email sender](https://supabase.com/docs/guides/auth/auth-smtp). Project owners manage their own Auth delivery settings and project availability.

## Verification

`tests/supabase-rooms.mjs` runs the real SQL with in-memory Postgres/PGlite. It checks unique tags, RLS, public discovery, friends access, owner-only controls, kick/rejoin protection, chosen successors, stale-member promotion and verified message/jolt attribution.

`tests/accounts-room-browser.cjs` uses the official Supabase SDK with locally intercepted synthetic Auth requests and the same in-memory Postgres functions. It checks forms, unique identities, discovery in another browser, friends-only hiding, moderation, owner selection and page-exit handoff. No real credentials or project requests are sent by that test. Live project checks require the project URL/key and schema setup above.
