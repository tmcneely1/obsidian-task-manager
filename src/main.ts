import { Editor, Notice, Plugin, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
import { TaskIndex } from "./index";
import { nextStatus, parseTaskLine, statusToChar } from "./parse";
import { TaskManagerSettingTab } from "./settings";
import { DEFAULT_SETTINGS, TaskManagerSettings } from "./types";
import { TASK_VIEW_TYPE, TaskListView } from "./view";
import { today } from "./dates";

export default class TaskManagerPlugin extends Plugin {
	settings: TaskManagerSettings = { ...DEFAULT_SETTINGS };
	index!: TaskIndex;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.index = new TaskIndex(this.app, this.settings);

		this.registerView(
			TASK_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new TaskListView(leaf, this.index, this.settings),
		);

		this.addRibbonIcon("checkbox-glyph", "Open tasks", () => void this.openTaskView());
		this.addSettingTab(new TaskManagerSettingTab(this.app, this));

		this.addCommand({
			id: "open-task-list",
			name: "Open task list",
			callback: () => void this.openTaskView(),
		});

		this.addCommand({
			id: "toggle-task",
			name: "Toggle task on current line",
			editorCallback: (editor: Editor) => this.toggleTaskAtCursor(editor),
		});

		this.addCommand({
			id: "insert-task-due-today",
			name: "Insert task due today",
			editorCallback: (editor: Editor) => {
				editor.replaceSelection(`- [ ] 📅 ${today()}`);
			},
		});

		this.addCommand({
			id: "rebuild-index",
			name: "Rebuild task index",
			callback: async () => {
				await this.index.rebuild();
				new Notice(`Task Manager: indexed ${this.index.all().length} tasks.`);
			},
		});

		// The vault is not fully loaded during onload, so the first scan waits for it.
		this.app.workspace.onLayoutReady(() => void this.index.rebuild());

		this.registerEvent(
			this.app.vault.on("modify", (file: TAbstractFile) => {
				if (file instanceof TFile) void this.index.indexFile(file);
			}),
		);
		this.registerEvent(
			this.app.vault.on("create", (file: TAbstractFile) => {
				if (file instanceof TFile) void this.index.indexFile(file);
			}),
		);
		this.registerEvent(this.app.vault.on("delete", (file: TAbstractFile) => this.index.remove(file)));
		this.registerEvent(
			this.app.vault.on("rename", (file: TAbstractFile, oldPath: string) =>
				this.index.rename(file, oldPath),
			),
		);
	}

	/** Reveals the task view, reusing an open leaf when there is one. */
	async openTaskView(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(TASK_VIEW_TYPE);
		if (existing.length > 0) {
			await this.app.workspace.revealLeaf(existing[0]);
			return;
		}
		const leaf = this.app.workspace.getRightLeaf(false);
		if (!leaf) return;
		await leaf.setViewState({ type: TASK_VIEW_TYPE, active: true });
		await this.app.workspace.revealLeaf(leaf);
	}

	private toggleTaskAtCursor(editor: Editor): void {
		const cursor = editor.getCursor();
		const raw = editor.getLine(cursor.line);
		const task = parseTaskLine(raw, "", cursor.line);
		if (!task) {
			new Notice("Task Manager: no task on this line.");
			return;
		}
		const char = statusToChar(nextStatus(task.status));
		// Replace only the checkbox character so the cursor and the rest of the line survive.
		const offset = raw.indexOf("[") + 1;
		editor.replaceRange(
			char,
			{ line: cursor.line, ch: offset },
			{ line: cursor.line, ch: offset + 1 },
		);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		// The index closes over the settings object, so refresh what depends on them.
		await this.index.rebuild();
	}
}
