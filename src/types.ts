export type TaskStatus = "open" | "inProgress" | "done" | "cancelled";

export type Priority = "high" | "medium" | "low" | "none";

/** A single task parsed from a markdown checkbox line. */
export interface Task {
	/** Vault-relative path of the file the task lives in. */
	path: string;
	/** 0-based line number within that file. */
	line: number;
	status: TaskStatus;
	/** Task text with all inline metadata stripped out. */
	text: string;
	due: string | null;
	start: string | null;
	priority: Priority;
	tags: string[];
	/** Leading whitespace, used to preserve indentation on rewrite. */
	indent: string;
}

export interface TaskManagerSettings {
	/** Folders to scan. Empty means the whole vault. */
	includeFolders: string[];
	/** Folders to skip, matched as path prefixes. */
	excludeFolders: string[];
	/** Default filter the task view opens on. */
	defaultFilter: FilterKey;
	/** Show tasks that are done or cancelled in list views. */
	showCompleted: boolean;
}

export type FilterKey = "all" | "today" | "overdue" | "upcoming" | "done";

export const DEFAULT_SETTINGS: TaskManagerSettings = {
	includeFolders: [],
	excludeFolders: [],
	defaultFilter: "today",
	showCompleted: false,
};
