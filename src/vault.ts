import { App, MarkdownView, Notice, TFile } from "obsidian";
import { setLineStatus } from "./parse";
import { Task, TaskStatus } from "./types";

/**
 * Rewrites a single task's checkbox in its source file.
 *
 * The line is re-checked against the task text before writing: the index can
 * lag behind an edit made elsewhere, and writing blind would flip the wrong
 * line.
 */
export async function writeTaskStatus(app: App, task: Task, status: TaskStatus): Promise<boolean> {
	const file = app.vault.getAbstractFileByPath(task.path);
	if (!(file instanceof TFile)) {
		new Notice(`Task Manager: could not find ${task.path}`);
		return false;
	}

	const contents = await app.vault.read(file);
	const lines = contents.split("\n");
	const raw = lines[task.line];
	if (raw === undefined) {
		new Notice("Task Manager: the task has moved, refreshing.");
		return false;
	}

	const updated = setLineStatus(raw, status);
	if (updated === raw) return false;

	lines[task.line] = updated;
	await app.vault.modify(file, lines.join("\n"));
	return true;
}

/** Opens the file a task lives in and puts the cursor on its line. */
export async function revealTask(app: App, task: Task): Promise<void> {
	const file = app.vault.getAbstractFileByPath(task.path);
	if (!(file instanceof TFile)) {
		new Notice(`Task Manager: could not find ${task.path}`);
		return;
	}
	const leaf = app.workspace.getLeaf(false);
	await leaf.openFile(file);
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	view?.editor.setCursor({ line: task.line, ch: 0 });
}
