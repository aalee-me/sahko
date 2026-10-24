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
| Icon stroke | `--icon-stroke` | 1.7; rounded caps/joins |
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

At a card content width ≤340px, title gets its own row, followed by avatar summary, then aligned code/presence. This uses a container query, so it works in a sidebar or mobile without page-specific conditions. Text may wrap; no fixed header height. Copy/share is anchored to the code line, not the title/card edge. Roster is a separate interactive details control; do not nest it in the open-room button.

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
