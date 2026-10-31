import { ItemView, WorkspaceLeaf } from "obsidian";
import { TaskIndex } from "./index";
import { formatDue, today } from "./dates";
import { nextStatus } from "./parse";
import { FilterKey, Priority, Task, TaskManagerSettings } from "./types";
import { revealTask, writeTaskStatus } from "./vault";

export const TASK_VIEW_TYPE = "task-manager-list";

const FILTERS: { key: FilterKey; label: string }[] = [
	{ key: "today", label: "Today" },
	{ key: "overdue", label: "Overdue" },
	{ key: "upcoming", label: "Upcoming" },
	{ key: "all", label: "All" },
	{ key: "done", label: "Done" },
];

const PRIORITY_LABEL: Record<Priority, string> = {
	high: "High",
	medium: "Medium",
	low: "Low",
	none: "",
};

export class TaskListView extends ItemView {
	private filter: FilterKey;
	private unsubscribe: (() => void) | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private index: TaskIndex,
		private settings: TaskManagerSettings,
	) {
		super(leaf);
		this.filter = settings.defaultFilter;
	}

	getViewType(): string {
		return TASK_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Tasks";
	}

	getIcon(): string {
		return "checkbox-glyph";
	}

	async onOpen(): Promise<void> {
		this.unsubscribe = this.index.onChange(() => this.render());
		this.render();
	}

	async onClose(): Promise<void> {
		this.unsubscribe?.();
		this.unsubscribe = null;
	}

	setFilter(filter: FilterKey): void {
		this.filter = filter;
		this.render();
	}

	private render(): void {
		const container = this.contentEl;
		container.empty();
		container.addClass("task-manager-view");

		this.renderTabs(container);

		const tasks = this.index.query(this.filter);
		if (tasks.length === 0) {
			container.createDiv({
				cls: "task-manager-empty",
				text: this.filter === "done" ? "Nothing completed yet." : "No tasks here.",
			});
			return;
		}

		const list = container.createDiv({ cls: "task-manager-list" });
		for (const task of tasks) this.renderTask(list, task);
	}

	private renderTabs(container: HTMLElement): void {
		const counts = this.index.counts();
		const tabs = container.createDiv({ cls: "task-manager-tabs" });
		for (const { key, label } of FILTERS) {
			const tab = tabs.createEl("button", {
				cls: "task-manager-tab",
				text: counts[key] > 0 ? `${label} ${counts[key]}` : label,
			});
			if (key === this.filter) tab.addClass("is-active");
			tab.addEventListener("click", () => this.setFilter(key));
		}
	}

	private renderTask(list: HTMLElement, task: Task): void {
		const row = list.createDiv({ cls: "task-manager-row" });

		const checkbox = row.createEl("input", { type: "checkbox" });
		checkbox.addClass("task-manager-checkbox");
		checkbox.checked = task.status === "done" || task.status === "cancelled";
		checkbox.addEventListener("click", async (event) => {
			event.stopPropagation();
			// The index refresh triggered by the write re-renders the row, so the
			// checkbox is disabled only to stop a second click racing the first.
			checkbox.disabled = true;
			await writeTaskStatus(this.app, task, nextStatus(task.status));
		});

		const body = row.createDiv({ cls: "task-manager-body" });
		const title = body.createDiv({ cls: "task-manager-text", text: task.text || "(untitled)" });
		if (task.status === "done" || task.status === "cancelled") title.addClass("is-complete");

		const meta = body.createDiv({ cls: "task-manager-meta" });
		if (task.due) {
			const due = meta.createSpan({ cls: "task-manager-due", text: formatDue(task.due) });
			if (task.due < today()) due.addClass("is-overdue");
		}
		if (task.priority !== "none") {
			meta.createSpan({
				cls: `task-manager-priority is-${task.priority}`,
				text: PRIORITY_LABEL[task.priority],
			});
		}
		for (const tag of task.tags) {
			meta.createSpan({ cls: "task-manager-tag", text: `#${tag}` });
		}
		meta.createSpan({ cls: "task-manager-path", text: task.path.replace(/\.md$/, "") });

		row.addEventListener("click", () => void revealTask(this.app, task));
	}
}
