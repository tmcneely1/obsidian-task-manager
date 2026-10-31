import { App, PluginSettingTab, Setting } from "obsidian";
import type TaskManagerPlugin from "./main";
import { FilterKey } from "./types";

const FILTER_OPTIONS: Record<FilterKey, string> = {
	today: "Today",
	overdue: "Overdue",
	upcoming: "Upcoming",
	all: "All",
	done: "Done",
};

/** Splits a comma-separated folder list into trimmed, non-empty paths. */
function parseFolders(value: string): string[] {
	return value
		.split(",")
		.map((folder) => folder.trim().replace(/^\/+|\/+$/g, ""))
		.filter((folder) => folder.length > 0);
}

export class TaskManagerSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: TaskManagerPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Folders to scan")
			.setDesc("Comma-separated folders. Leave empty to scan the whole vault.")
			.addText((text) =>
				text
					.setPlaceholder("Projects, Areas")
					.setValue(this.plugin.settings.includeFolders.join(", "))
					.onChange(async (value) => {
						this.plugin.settings.includeFolders = parseFolders(value);
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Folders to skip")
			.setDesc("Comma-separated folders to exclude, including their subfolders.")
			.addText((text) =>
				text
					.setPlaceholder("Archive, Templates")
					.setValue(this.plugin.settings.excludeFolders.join(", "))
					.onChange(async (value) => {
						this.plugin.settings.excludeFolders = parseFolders(value);
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Default view")
			.setDesc("The filter the task list opens on.")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(FILTER_OPTIONS)
					.setValue(this.plugin.settings.defaultFilter)
					.onChange(async (value) => {
						this.plugin.settings.defaultFilter = value as FilterKey;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Show completed tasks in All")
			.setDesc("Include done and cancelled tasks in the All view.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showCompleted).onChange(async (value) => {
					this.plugin.settings.showCompleted = value;
					await this.plugin.saveSettings();
				}),
			);
	}
}
