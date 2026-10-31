# Task Manager

Local task management for Obsidian. Tasks live as ordinary markdown checkboxes in
your own notes — there is no separate database, and nothing leaves your vault.

## Status

Early foundation (v0.1.0). The parser, vault index and task list view are in place
and working. This is deliberately a base to build on, not a finished app.

## Task syntax

Any markdown checkbox is a task. Metadata is optional and inline:

```markdown
- [ ] Draft the quarterly update 📅 2026-11-05 ⏫ #work
- [/] Reading through the spec 🛫 2026-11-01
- [x] Renew the domain
- [-] Abandoned idea
```

| Field | Syntax |
| --- | --- |
| Status | `[ ]` open, `[/]` in progress, `[x]` done, `[-]` cancelled |
| Due date | `📅 2026-11-05`, or `[due:: 2026-11-05]` |
| Start date | `🛫 2026-11-01`, or `[start:: …]` / `[scheduled:: …]` |
| Priority | `🔺` `⏫` high, `🔼` medium, `🔽` `⏬` low |
| Tags | `#tag`, including `#nested/tags` |

Bullet (`-`, `*`, `+`) and numbered (`1.`, `1)`) list markers both work, at any
indentation level.

## Views

Open the task list from the ribbon or the **Open task list** command. It has five
filters with live counts:

- **Today** — due today or earlier, still open
- **Overdue** — past due, still open
- **Upcoming** — due in the next 7 days
- **All** — everything open (completed tasks optional, see settings)
- **Done** — completed and cancelled

Tasks sort by due date, then priority, then text. Clicking a row opens its file at
the right line; clicking the checkbox writes the status back to the markdown.

## Commands

| Command | What it does |
| --- | --- |
| Open task list | Reveals the task view in the right sidebar |
| Toggle task on current line | Flips the checkbox under the cursor |
| Insert task due today | Inserts `- [ ] 📅 <today>` |
| Rebuild task index | Rescans the vault and reports the task count |

## Settings

- **Folders to scan** — restrict indexing to specific folders (empty scans the vault)
- **Folders to skip** — exclude folders and their subfolders
- **Default view** — which filter the task list opens on
- **Show completed tasks in All**

## Install with BRAT

1. Install and enable [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community plugins.
2. In BRAT's settings, choose **Add beta plugin**.
3. Enter `tmcneely1/obsidian-task-manager` and add the plugin.
4. Enable **Task Manager** under Community plugins.

## Development

```bash
npm install
npm run dev    # watch build
npm run build  # typecheck + production bundle
```

Releases are cut locally, since GitHub Actions does not run automatically on forks:

```bash
npm run build
gh release create v0.1.0 main.js manifest.json styles.css
```

## License

MIT — see [LICENSE](LICENSE).

## Credits

This repository began as a fork of
[antoneheyward/obsidian-task-manager](https://github.com/antoneheyward/obsidian-task-manager),
whose own source is not public. No code from that project is used here; this
plugin is an independent implementation.
