import { App, Modal, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';

interface DailyNoteHelperSettings {
	folder: string;
	section: string;
}

const DEFAULT_SETTINGS: DailyNoteHelperSettings = {
	folder: '',
	section: ''
}

export default class DailyNoteHelper extends Plugin {
	settings: DailyNoteHelperSettings;

	async onload() {
		await this.loadSettings();
		const vault = this.app.vault;
		console.log(vault.getName());
		this.app.workspace.onLayoutReady(() => {
			vault.on('create', (newFile) => {
				const folder = vault.getAbstractFileByPath(this.settings.folder);
				if(folder !== null && folder instanceof TFolder && folder.children.contains(newFile) && folder.children.length > 1) {
					const previousDailyNote = folder.children.at(folder.children.length-2);
					if(previousDailyNote instanceof TFile) {
						vault.cachedRead(folder.children.at(folder.children.length-2) as TFile).then(contents => {
							const checkboxRegex = /- \[ \] .*/;
							const lines = contents.split('\n');
							const uncheckedLines = lines.filter(line => {return checkboxRegex.test(line)}).join('\n').concat('\n');
							const newDailyNote = folder.children.at(folder.children.length-1);
							if(newDailyNote instanceof TFile) {
								if(this.settings.section.length === 0) {
									vault.append(newDailyNote, uncheckedLines);
								} else {
									vault.read(newDailyNote).then(contents => {
										const first = contents.slice(0, contents.indexOf(this.settings.section)+this.settings.section.length+1).concat(uncheckedLines);
										const second = contents.slice(contents.indexOf(this.settings.section)+this.settings.section.length+1, contents.length-1);
										vault.modify(newDailyNote, first.concat(second));
									})
								}
							}
						});
					}
				};
			});
		});

		this.addSettingTab(new DailyNoteSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class DailyNoteSettingTab extends PluginSettingTab {
	plugin: DailyNoteHelper;

	constructor(app: App, plugin: DailyNoteHelper) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Daily Note Folder')
			.setDesc('Folder which contains your daily notes')
			.addText(text => text
				.setValue(this.plugin.settings.folder)
				.onChange(async (value) => {
					this.plugin.settings.folder = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
		.setName('Section to place tasks')
		.setDesc('If you are using a daily note template, you can specify what section to place the tasks in')
		.addText(text => text
			.setValue(this.plugin.settings.section)
			.onChange(async (value) => {
				this.plugin.settings.section = value;
				await this.plugin.saveSettings();
			}));
	}
}
