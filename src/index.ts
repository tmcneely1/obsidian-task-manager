import { App, TAbstractFile, TFile } from "obsidian";
import { parseTasks } from "./parse";
import { FilterKey, Priority, Task, TaskManagerSettings } from "./types";
import { fromToday, today } from "./dates";

const PRIORITY_RANK: Record<Priority, number> = {
	high: 0,
	medium: 1,
	low: 2,
	none: 3,
};

/**
 * Keeps a per-file cache of parsed tasks for the whole vault and refreshes
 * individual files as they change, so views never rescan everything.
 */
export class TaskIndex {
	private byPath = new Map<string, Task[]>();
	private listeners = new Set<() => void>();

	constructor(
		private app: App,
		private settings: TaskManagerSettings,
	) {}

	onChange(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notify(): void {
		for (const listener of this.listeners) listener();
	}

	/** True when a path is inside the configured include/exclude folders. */
	isIndexable(path: string): boolean {
		if (!path.endsWith(".md")) return false;
		const { includeFolders, excludeFolders } = this.settings;
		if (excludeFolders.some((folder) => folder && path.startsWith(folder))) return false;
		if (includeFolders.length === 0) return true;
		return includeFolders.some((folder) => folder && path.startsWith(folder));
	}

	/** Parses every indexable markdown file in the vault. */
	async rebuild(): Promise<void> {
		this.byPath.clear();
		const files = this.app.vault.getMarkdownFiles().filter((file) => this.isIndexable(file.path));
		await Promise.all(files.map((file) => this.indexFile(file, false)));
		this.notify();
	}

	async indexFile(file: TFile, notify = true): Promise<void> {
		if (!this.isIndexable(file.path)) {
			this.byPath.delete(file.path);
			if (notify) this.notify();
			return;
		}
		const contents = await this.app.vault.cachedRead(file);
		const tasks = parseTasks(contents, file.path);
		if (tasks.length > 0) this.byPath.set(file.path, tasks);
		else this.byPath.delete(file.path);
		if (notify) this.notify();
	}

	remove(file: TAbstractFile): void {
		if (this.byPath.delete(file.path)) this.notify();
	}

	rename(file: TAbstractFile, oldPath: string): void {
		this.byPath.delete(oldPath);
		if (file instanceof TFile) void this.indexFile(file);
		else this.notify();
	}

	all(): Task[] {
		const tasks: Task[] = [];
		for (const fileTasks of this.byPath.values()) tasks.push(...fileTasks);
		return tasks;
	}

	/** Tasks matching a named filter, sorted for display. */
	query(filter: FilterKey): Task[] {
		const now = today();
		const weekOut = fromToday(7);

		const matches = this.all().filter((task) => {
			const complete = task.status === "done" || task.status === "cancelled";
			switch (filter) {
				case "done":
					return complete;
				case "today":
					return !complete && task.due !== null && task.due <= now;
				case "overdue":
					return !complete && task.due !== null && task.due < now;
				case "upcoming":
					return !complete && task.due !== null && task.due > now && task.due <= weekOut;
				case "all":
				default:
					return this.settings.showCompleted || !complete;
			}
		});

		return matches.sort(compareTasks);
	}

	counts(): Record<FilterKey, number> {
		return {
			all: this.query("all").length,
			today: this.query("today").length,
			overdue: this.query("overdue").length,
			upcoming: this.query("upcoming").length,
			done: this.query("done").length,
		};
	}
}

/** Due date first (undated last), then priority, then text. */
function compareTasks(a: Task, b: Task): number {
	if (a.due !== b.due) {
		if (a.due === null) return 1;
		if (b.due === null) return -1;
		return a.due < b.due ? -1 : 1;
	}
	const priority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
	if (priority !== 0) return priority;
	return a.text.localeCompare(b.text);
}
