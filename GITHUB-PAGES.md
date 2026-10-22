# GitHub Pages demo

The `gh-pages` branch contains the browser-only desktop and mobile prototype.

GitHub Pages is enabled for this branch. To review or change its publishing source:

1. Settings → Pages.
2. Source: Deploy from a branch.
3. Branch: `gh-pages`, folder: `/ (root)`.
4. Save and wait for the Pages deployment to finish.

Desktop: https://aalee-me.github.io/sahko/
Mobile presentation: https://aalee-me.github.io/sahko/mobile.html

This is a standalone demo. Tasks, thoughts, profile photo and session reports stay on the visitor's device. The example rooms and newly planned rooms are local previews; a room code cannot connect other visitors. Shared accounts, live rooms, invitations, messages and voice require the backend in this repository and a server host. The Pages demo does not send user content to another host.

To rebuild, run `node build-github-pages.mjs` and publish the generated contents of `pages/` to the root of `gh-pages`. Keep source code on `main`. Do not include `CNAME`, hosting credentials or runtime data. The project path `/sahko/` does not replace the account's portfolio website.

Upload your profile photo from the top-right profile menu. In demo rooms, a friend’s people menu also offers Upload photo. The crop editor supports drag, keyboard position controls and zoom, and can frame a face automatically when the browser supplies native face detection. Other browsers use an adjustable center crop. Strangers keep anonymous avatars. The original upload is never stored; only the cropped portrait is saved.

The current brand mark is the exact user-supplied `frontend/sahko-oe.svg`, including both dots. Get started first offers Solo or Group activity. The room browser places room-code entry below its tabs and previews whole-session progress before joining. eecho is a demo friend with an E avatar.
