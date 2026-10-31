import { Priority, Task, TaskStatus } from "./types";

/** Matches a markdown checkbox list item and captures indent, status char and body. */
const TASK_LINE = /^(\s*)(?:[-*+]|\d+[.)])\s+\[(.)\]\s?(.*)$/;

const DATE = "\\d{4}-\\d{2}-\\d{2}";

/** `📅 2026-11-05`, `[due:: 2026-11-05]` or `(due:: 2026-11-05)` */
const DUE = new RegExp(`\\s*(?:📅\\s*(${DATE})|[\\[(]\\s*due\\s*::\\s*(${DATE})\\s*[\\])])`, "u");
/** `🛫 2026-11-05`, plus `start::`/`scheduled::` inline fields. */
const START = new RegExp(
	`\\s*(?:🛫\\s*(${DATE})|[\\[(]\\s*(?:start|scheduled)\\s*::\\s*(${DATE})\\s*[\\])])`,
	"u",
);
const PRIORITY = /\s*(🔺|⏫|🔼|🔽|⏬)/u;
const TAG = /(^|\s)#([A-Za-z0-9_\-\/]+)/gu;

export function charToStatus(char: string): TaskStatus {
	switch (char) {
		case "x":
		case "X":
			return "done";
		case "/":
			return "inProgress";
		case "-":
			return "cancelled";
		default:
			return "open";
	}
}

export function statusToChar(status: TaskStatus): string {
	switch (status) {
		case "done":
			return "x";
		case "inProgress":
			return "/";
		case "cancelled":
			return "-";
		default:
			return " ";
	}
}

function symbolToPriority(symbol: string): Priority {
	switch (symbol) {
		case "🔺":
		case "⏫":
			return "high";
		case "🔼":
			return "medium";
		case "🔽":
		case "⏬":
			return "low";
		default:
			return "none";
	}
}

/**
 * Parses one line of markdown into a Task, or returns null when the line is not
 * a checkbox list item. Inline metadata is removed from `text` so callers can
 * render the task description on its own.
 */
export function parseTaskLine(raw: string, path: string, line: number): Task | null {
	const match = TASK_LINE.exec(raw);
	if (!match) return null;

	const [, indent, statusChar, bodyRaw] = match;
	let body = bodyRaw;

	const dueMatch = DUE.exec(body);
	const due = dueMatch ? dueMatch[1] ?? dueMatch[2] ?? null : null;
	if (dueMatch) body = body.replace(dueMatch[0], " ");

	const startMatch = START.exec(body);
	const start = startMatch ? startMatch[1] ?? startMatch[2] ?? null : null;
	if (startMatch) body = body.replace(startMatch[0], " ");

	const priorityMatch = PRIORITY.exec(body);
	const priority = priorityMatch ? symbolToPriority(priorityMatch[1]) : "none";
	if (priorityMatch) body = body.replace(priorityMatch[0], " ");

	const tags: string[] = [];
	// `lastIndex` is shared across calls on a global regex, so reset before use.
	TAG.lastIndex = 0;
	for (let tagMatch = TAG.exec(body); tagMatch; tagMatch = TAG.exec(body)) {
		tags.push(tagMatch[2]);
	}

	return {
		path,
		line,
		status: charToStatus(statusChar),
		text: body.replace(/\s+/g, " ").trim(),
		due,
		start,
		priority,
		tags,
		indent,
	};
}

/** Parses every task in a file's contents. */
export function parseTasks(contents: string, path: string): Task[] {
	const tasks: Task[] = [];
	const lines = contents.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const task = parseTaskLine(lines[i], path, i);
		if (task) tasks.push(task);
	}
	return tasks;
}

/** Rewrites the checkbox character of an existing task line, leaving the rest intact. */
export function setLineStatus(raw: string, status: TaskStatus): string {
	return raw.replace(TASK_LINE, (_full, indent, _old, body) => {
		const marker = /^(\s*)(?:[-*+]|\d+[.)])/.exec(raw)?.[0].trim() ?? "-";
		return `${indent}${marker} [${statusToChar(status)}] ${body}`;
	});
}

/** The status a task moves to when toggled. */
export function nextStatus(status: TaskStatus): TaskStatus {
	return status === "done" ? "open" : "done";
}
