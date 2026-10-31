# Changelog

## v0.1.0 - 2026-10-31

Initial release — the foundation of an independent implementation.

### Added
- **Task parser** — reads tasks from ordinary markdown checkboxes, supporting four
  statuses (`[ ]`, `[/]`, `[x]`, `[-]`), due and start dates in both emoji and
  `[field:: value]` form, three priority levels, and nested tags. Bullet and
  numbered list markers are both recognized at any indent depth, and inline
  metadata is stripped from the task's display text.
- **Vault index** — parses every markdown file once on startup, then refreshes
  individual files on create, modify, delete and rename, so views never rescan the
  whole vault. Include/exclude folder rules are applied at index time.
- **Task list view** — a sidebar view with Today, Overdue, Upcoming, All and Done
  filters, each showing a live count. Tasks sort by due date, then priority, then
  text. Overdue dates are highlighted, and dates render relative ("Today",
  "Tomorrow", "Yesterday") where that reads better.
- **Write-back** — toggling a row's checkbox rewrites only the checkbox character
  in the source file, preserving indentation, list marker and trailing metadata.
  The target line is re-read before writing so a stale index cannot flip the wrong
  task.
- **Commands** — open the task list, toggle the task under the cursor, insert a
  task due today, and rebuild the index.
- **Settings** — folders to scan, folders to skip, default filter, and whether
  completed tasks appear in the All view.
