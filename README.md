# GitHub Pages demo

The `gh-pages` branch contains the browser-only desktop and mobile prototype.

Enable hosting once in the repository:

1. Settings → Pages.
2. Source: Deploy from a branch.
3. Branch: `gh-pages`, folder: `/ (root)`.
4. Save and wait for the Pages deployment to finish.

Desktop: https://aalee-me.github.io/sahko/
Mobile presentation: https://aalee-me.github.io/sahko/mobile.html

This is a standalone demo. Tasks, thoughts, profile photo and session reports stay on the visitor's device. The example rooms and newly planned rooms are local previews; a room code cannot connect other visitors. Shared accounts, live rooms, invitations, messages and voice require the backend in this repository and a server host. The Pages demo does not send user content to another host.

To rebuild, run `node build-github-pages.mjs` and publish the generated contents of `pages/` to the root of `gh-pages`. Keep source code on `main`. Do not include `CNAME`, hosting credentials or runtime data. The project path `/sahko/` does not replace the account's portfolio website.
