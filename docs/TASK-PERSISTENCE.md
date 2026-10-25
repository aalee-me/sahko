# Task persistence

Unfinished tasks remain on this device across reloads and sessions. Completed tasks are excluded from the next session’s outstanding list. Removing a task or choosing Disregard all persists the resulting snapshot, so recovery does not resurrect deleted tasks.

`frontend/plan-storage.js` preserves the existing `sahko-plan-v1` format, mirrors drafts in sessionStorage and saves durable snapshots in IndexedDB (`sahko-plans`). The newest timestamp wins on startup. Task editing waits for recovery before accepting changes. No task text is sent to a server. Existing localStorage tasks migrate on the next save. A quiet inline status explains when durable saving is unavailable.

Run `tests/task-persistence.cjs` against the GitHub Pages build. It covers unfinished drafts across reloads, failed localStorage writes, IndexedDB recovery and completed versus outstanding tasks on a new session.
