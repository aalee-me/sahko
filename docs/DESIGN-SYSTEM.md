# Sähkö UI handoff

Live component reference: `https://aalee-me.github.io/sahko/components.html`.

## Source of truth

- `frontend/design-system.css`: sizing tokens, reusable atoms, switcher, shared room header/card, setup adapters.
- `frontend/ui-components.js`: DOM factories for `SahkoUI.iconLabel` and `SahkoUI.roomHeader`.
- `frontend/components.html`: visual specimens with the production stylesheet and factories. Includes light/dark, text scale, enabled/disabled/invalid states.
- `frontend/theme.css`: semantic colors; use `--text`, `--muted`, `--line`, `--surface-raised`, `--action-accent` rather than hex colors in new components.
- `frontend/onboarding.js`: room data, domain controls and actions; composes the reusable header in directory and expanded views.

The foundation is adopted by setup form fields/actions, animated switchers across the app, room directory cards, expanded room headers and timing. Session timer, orbital, Void composer, and floating dock keep their existing specialized density/motion. Remaining legacy page CSS is not fully migrated. New components should use this contract rather than copying old page overrides.

## Sizing contract

All values are rem; examples below assume the default 16px root. Existing Settings → Text size scales the root (90/100/110/125%). Do not add viewport-specific font overrides to individual labels.

| Role | Token | Default |
| --- | --- | --- |
| Caption / presence | `--text-caption` | 12px / 1.4 |
| Label / metadata / tab | `--text-label` | 14px / 1.4 |
| Body / input / button | `--text-body` | 16px / 1.5 |
| Card title | `--text-title` | 20px / 1.2; 18px on phone |
| Room code | `--text-code` | 20px / 1.4; 18px on phone, .1em tracking |
| Page heading | `--text-heading` | 28–40px / 1.2 |

Weights: regular 400, medium 500, strong 600. Titles are strong; captions remain regular. The live session timer has its own display hierarchy and stable numeral styling; it is not a card heading.

Spacing is a 4px base: `--space-1/2/3/4/5/6/8/10/12` = 4/8/12/16/20/24/32/40/48px. Use 8px within a labeled group, 16px between related groups, 24px between sections. Card inset = 24px desktop, 16px phone. Never compensate for text alignment with per-element `top` offsets.

| Geometry | Token | Value |
| --- | --- | --- |
| Standard input/button/tab group height | `--control-height` | 44px |
| Compact utility | `--control-compact` | 32px; keep a larger hit area where possible |
| Icon | `--icon-size` | 20px |
| Small icon | `--icon-small` | 16px |
| Icon stroke | `--icon-stroke` | 1.5; rounded caps/joins |
| Card corners | `--radius-card` | 24px |
| Input/button/switcher corners | `--radius-input` | fully rounded |

## Atoms and states

- `.ui-input`: label sits 8px above. Placeholder shares body size. Invalid input uses `aria-invalid=true` and a plain red error below, never a toast.
- `.ui-button`: label plus optional right arrow; `.ui-button--primary` is yellow. Disabled buttons cannot activate. Loading preserves dimensions. Focus-visible has a 2px yellow outline with 3px offset.
- `.ui-icon-button`: centered 20px icon within a 44px target. Accessible label required; tooltip does not replace the label.
- `.ui-label`, `.ui-body`: typography roles.
- `SahkoUI.iconLabel({label, icon, className})`: centered vector and text, consistent 8px gap. Used for block/time/duration.
- `.unified-switcher`: shared animated selection indicator and 14px labels. Keep keyboard left/right/home/end behavior and tab semantics. Colors come from semantic theme tokens. Existing `desktop-companion.js` measures the selected tab, not text positions.

Hover, focus, active, disabled and invalid must be shown in a component review. Motion uses 160/260ms and `--ease-ui`; respect reduced motion. Copy/share remain bare icon controls sliding from the code, with no enclosing pill.

## Room header molecule

`SahkoUI.roomHeader({title, code, availability, people, expanded})` takes DOM slots. `expanded` changes the heading to h2; directory uses h3.

Grid anatomy:

1. Title left; avatar summary right.
2. Code left; people-present text right, vertically centered on the code.
3. Access/availability below the code.

Title and avatar summary always share the first row. At a card content width ≤340px the stack shows two portraits; at ≤260px it shows one. The +N indicator updates to count the hidden portraits. Code and presence keep the second row. This uses a container query, so it works in a sidebar or mobile without page-specific conditions. Text may wrap; no fixed header height. Copy/share is anchored to the code line, not the title/card edge. Roster is a separate interactive details control; do not nest it in the open-room button.

The former `fitCardCode` ResizeObserver and calculated top/padding offsets have been removed. Do not reintroduce them.

## Room card composition

`.ui-room-card` → shared header → `.room-card-open` containing progress, block/time, divider and planned duration, with the navigation arrow at the trailing edge. Expanded room uses the same header/timing, then people, credential field and join action. Full rooms retain disabled activation. Private solo sessions do not become joinable rooms.

To change **title-to-code spacing**, edit the shared header `row-gap: var(--space-2)` in `design-system.css`. To change **outside padding**, edit `--card-inset`. To change **block/time size**, edit `--text-label`. Do not patch Available rooms and Who’s around independently.

## Verification and migration

`PLAYWRIGHT_MODULE=/path/to/playwright node tests/ui-components.cjs`

Checks 320/390/768/1440px widths at 100% and 125% text, grid alignment and bounds, timing order, expanded header and credential validation. Screenshots go to `/tmp`.

For future migrations: move a complete component family into this stylesheet, remove its old sizing rules, reuse its atom/molecule, and add an example to the reference. Scoped adapters currently override older setup rules during migration; unrelated orbital, timer and Void layout rules remain in their existing files.


## Edit visually without writing CSS

1. Open the app → Settings → Visual design → **Open design editor**. Or use **Edit styles** on the component reference. The direct app link is `https://aalee-me.github.io/sahko/?design=1`.
2. Select Desktop or Phone. Changes affect that breakpoint only; resize the browser to preview it. On a phone, Collapse keeps the preview visible while you inspect it.
3. Pick a component on the page, or select Typography, Cards, Controls, or Spacing. Enter a rem value. Blank means inherit the design system default, shown as a placeholder; each token has Reset. Reset breakpoint clears that breakpoint's overrides.
4. Changes are saved in this browser and immediately previewed across components using the token. They do not alter the repository or other visitors. Desktop and phone share the same named tokens but can have different overrides.
5. Click **Export CSS**. Rename the downloaded `sahko-design-overrides.css` to `design-overrides.css`, then replace `frontend/design-overrides.css` in GitHub and commit. This file is already linked after the foundation on both the app and reference page. If updating the existing `gh-pages` publication directly, replace `design-overrides.css` at that branch's root as well. Current deployment does not automatically copy main to gh-pages.

Editing source directly: open `frontend/design-overrides.css` using GitHub's pencil button or a local editor. Use `:root` custom properties; the example in that file shows both breakpoints. Keep `design-system.css` as the baseline and use the overrides file for your intentional customizations.

**rem:** `1rem` equals the user's root text size (normally 16px). `1.5rem` normally equals 24px and scales with Settings → Text size. Border hairlines, SVG viewBox geometry and media-query thresholds may remain px/unitless; component text and spacing use rem.

This is a token/style editor, not a page builder. It supports shared sizing, picking components, local persistence, breakpoint overrides and export. Freeform dragging, new sections, text content editing, multiplayer editing, and publishing directly from the panel are not included. A full Framer authoring workflow would require a separate content/layout model or rebuilding the editable pages in Framer.


### Visible component previews

Use `https://aalee-me.github.io/sahko/components.html?design=1` for the editor with a dedicated live canvas. The preview displays the selected component family and updates on every valid input. Cards shows two cards so spacing changes are visible. Phone/Desktop changes the embedded preview viewport to 390px/900px without requiring you to resize the browser. The in-app editor also opens this canvas; **Open standalone preview** opens it in a separate tab. Collapse hides the canvas while you navigate the app. Local edits sync between same-origin tabs. Out-of-range values show a message and keep the last valid preview.


### Compact session layout and icons

`frontend/compact-session.css` owns compact session sizing independently of setup/card overrides: display timer, small playback controls, tightly grouped title/code, an orbital stage that overlaps the timeline, and a reserved activity/composer dock. Profile and action targets use square dimensions with centered vectors. The activity rail stays visible, reveals the feed on hover/focus, and supports wheel/keyboard browsing even when messages are hidden. It shows a three-line affordance for short/empty history.

`SahkoUI.iconSVG(name)` in `frontend/ui-components.js` is the common icon registry. Block, clock, lock, hourglass, person, copy, share, pause, play, skip, checklist, menu and desktop use a 24-unit viewBox and rounded 1.5-unit strokes. The metadata row uses one size for its vectors; `icon-contract.css` applies their shared stroke treatment. Branding, timeline graphics and filled memo artwork remain separate.

### Room ownership

The active room owner is listed first and labeled **Owner** in room lists and the participant dropdown. The owner can open **Transfer ownership** beneath the roster, select a current member, and confirm. The new owner gets timer/invitation authority immediately; the former owner stays as a member. The backend validates the caller, confirmation, target membership and current ownership; account IDs are not returned. The existing leave behavior hands ownership to a remaining active member.

The GitHub Pages demo supports local role changes for rooms created in that demo. Shared transfer uses `POST /api/rooms/:code/ownership` in the updated backend and requires that backend to be running; this change does not deploy the separate internet pairing service.


### Alignment and setup interaction details

Participant portraits use square, non-shrinking targets in a gently overlapping stack; the adjacent chevron uses the same dimensions and no outline ring. Missing dates on legacy tasks are omitted; newly entered tasks retain their recorded creation timestamps. The This session / Disregard all labels share the caption text role. The break-page action menu is positioned at the trailing edge of its composer dock.

The Void mark uses an explicitly centered square control. Star-marker styling targets direct children only, so it cannot add margins/glows to waveform bars. Voice playback uses twelve bars in the short preview, centered beside play and duration. The compact map has no added CSS fade mask; the reserved stage and dock handle its bounds.

Room setup includes a sticky, full-width **Review session** button. Entry, rhythm and room-discovery switchers share the same height, indicator insets and spacing. Friends/Available rooms retain their DOM while changing selection so animation works both directions, with a brief content transition. Break-alert radio choices use a shared rounded option treatment and native radio keyboard behavior. `frontend/favicon.svg` uses the uploaded Ö path with a square viewport and theme-aware color.


### Whole-pill audio alignment and measured insights

Recording uses a centered waveform column (maximum 12rem) and equal-width leading/trailing columns. Its timer is on the left and cancel/stop controls on the right. Playback also uses equal side columns and a centered, short waveform. Center against the complete pill, not only the available middle-cell space. Activity navigation retains its neutral color on hover; only the line-length animation remains.

`frontend/session-insights.js` derives profile insights from retained session timeline timestamps. Average focus block uses actual focused seconds in finished blocks, excluding idle, pauses and breaks; early-ended or running blocks do not count as finished samples. Focus before idle uses uninterrupted observed focus stretches ending in an idle/drifting state. Focus share is focused / (focused + idle), excluding breaks and pauses. Incomplete or truncated timelines never fall back to planned interval lengths; missing averages display an em dash. Phone pickups only appear as a number for sessions with motion tracking. Sample counts accompany averages. All of these insights remain local to the device's retained session history.

### Session controls and compact geometry

`SahkoUI.button` supplies the reusable Review session control in setup and the Controls preview. Header utilities share centered square targets, with Profile always last. The compact view has a leading Leave session control; opening Profile keeps the orbital renderer running.

The feed navigator uses up to five message-driven bars in a stable 1.5rem × 2rem box. Compact feed edges fade over .25rem; the orbital’s lower boundary fades over .875rem into the feed, without changing the map’s other edges. Break-page tools sit on the right. Voice playback fits its content, and task checkboxes use a vector checkmark.

People menus use `SahkoUI.rosterMotion`: header portraits dip .5rem and fade over 180ms with a 50ms stagger, while list portraits pop in locally. Reduced motion skips the transition. Focus-status text is omitted from card and roster identities.

Progress percentages use a small dark tooltip with a triangular pointer below the marker. Only hovering the circle reveals it; the progressbar ARIA value provides the percentage for assistive technology. The activity rail stays 2rem high, is empty before activity, and caps its message-driven bars at five.

Setup sections use `.ui-stack` for a 1rem parent gap and zero direct-child block margins. Rhythm cards retain .75rem between revealed cards; expanded editors do not change the gap around the finish-mode switcher. Closed clock controls are excluded from layout spacing.

Closed/Open replaces Solo (private)/Open world in session setup. Closed means only you and proceeds directly to review; Open configures a joinable room without repeating the visibility choice. `SahkoUI.choice` supplies reminder radio cards and their Controls preview, with the same card surface and selected outline as orbital choices.

Roster transitions never move portraits to list coordinates; orbital portraits never participate in the dropdown animation. The orbital header includes a responsive +N count, and Orbiters dropdowns in compact view are capped at 45vw × min(11rem, 28dvh), with scrolling and no automatic secondary panel on hover. Dock positioning removes workspace slide transforms before calculating its fixed anchor, keeping space navigation stationary.

The session-menu SVG morphs its existing list strokes and dots into an X and reverses on close; the menu panel retains its original slide animation. Sent thoughts retain the upward 750ms motion, now measured against the selected message’s text bounds. The message is revealed at landing and remains visible for one second before fading.

Closing a people menu fades the list over 120ms, then returns the header portraits and +N indicator upward by .5rem over 180ms with the same 50ms stagger. Reduced motion closes immediately.

Task lists share `.task-surface` across setup, check-in and Tasks: 14px task text, 12px muted headings/actions, 11px creation dates and a 2px text-to-date gap, all expressed in rem. Rows size to their content; popovers use a 1rem inset. Tasks has no exit action. Check-in and exit confirmation use Exit session with the menu’s exit vector.

Roster header portraits use CSS transitions tied to the native details state in both directions, so closing does not flash visible before restarting a separate animation. Dropdown headings read Orbiters and use the shared people vector. Compact headers expose an icon-only Exit compact view control, retaining the original full-view/PiP return behavior. Closed/Open titles and descriptions align to the same left edge: For you to lock in alone / For friends or other orbiters to join.

Room titles and codes share the identity type role (Manrope at `--text-title`) in room headers, reviews and full session view; compact identity uses 1.125rem for both. Editable room title/code fields share the body type role. Review details—including timeline labels, times, finish estimate and tasks—use .875rem with weight/color for emphasis.


### Live time-left control

`SahkoControls.remainingDial` is the seconds-based rotary countdown atom in `frontend/remaining-dial.js`. Time left is the first timer-settings card and reads the actual live `M:SS`; turning the knob changes the current countdown without changing the planned focus/break interval. Arrow Left/Right adjust one second; Arrow Up/Down or Shift adjust one minute. The separate interval cards retain the setup dial and presets. Room ownership restrictions remain in `frontend/session-tools.js`.

### Into the Clouds

The additive `frontend/clouds.js` / `clouds.css` module wraps the original private Void in a two-viewport stack. Its labels use rem units. Capture, typed-thought actions and the quiet tether are independent controls; voice release is unavailable. See `docs/INTO-THE-CLOUDS.md` for local demo, storage and backend contracts.


### Quiet demo controls and compact home

Settings → Demo tools is collapsed by default. Its Run session demo switch calls the existing local 30-second simulation, reflects running/stopped state, and is disabled in live rooms. The compact header places the supplied Sähkö vector wordmark at the far right as the home action, with confirmation before ending a running session. Exit compact view remains a separate utility. The activity rail keeps its natural message-position widths on hover; the bottom line has no special expansion.

Settings also includes **Show navigation shortcuts**, off by default and stored locally. It controls the legacy Live room / Plan session / Solo / Compact view shortcuts while retaining the primary setup flow and compact header utilities. The camera, demo and navigation switches share the native `.ui-switch` atom and keyboard behavior. The Void camera, organize and undo actions share the floating capsule and reveal their labels on hover/focus. Capture opens a contracted viewfinder with geometry as the default, an optional Show text switch and a Save PNG action.


### Input alignment contract

Task rows use a 1.5rem leading control box and a 1.5rem input line. Plus, checkbox and remove controls align to the task's first line; dates stay in the nested text column. The plus circle stays 18px within a centered 24px vector; its cross grows from 8 to 12 vector units.

The Void composer separates the text line, icon artwork and square control target. Full view uses a 1.5rem line and 2.25rem controls; compact uses a 1.25rem line and 2rem controls. Its shared rules live in `frontend/design-system.css` using `--composer-*` variables. `fitThought` in `frontend/experience.js` measures whole text lines, keeps an empty placeholder to one line, and refits on input, viewport resize and compact-mode changes. `tests/input-alignment.cjs` verifies centers, square controls, multiline sizing and task gaps at 320/390/768/1440px.
