import { App, Modal, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';

// Remember to rename these classes and interfaces!

interface DailyNoteHelperSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: DailyNoteHelperSettings = {
	mySetting: 'default'
}

export default class DailyNoteHelper extends Plugin {
	settings: DailyNoteHelperSettings;

	async onload() {
		await this.loadSettings();
		const vault = this.app.vault;
		console.log(vault.getName());
		this.app.workspace.onLayoutReady(() => {
			vault.on('create', (newFile) => {
				const folder = vault.getAbstractFileByPath("Daily Notes");
				if(folder !== null && folder instanceof TFolder && folder.children.contains(newFile) && folder.children.length > 1) {
					vault.cachedRead(folder.children.at(folder.children.length-2) as TFile).then(contents => {
						const checkboxRegex = /- \[ \] .*/;
						const lines = contents.split('\n');
						const uncheckedLines = lines.filter(line => {return checkboxRegex.test(line)}).join('\n').concat('\n');
						vault.read(folder.children.at(folder.children.length-1) as TFile).then(contents => {
							const first = contents.slice(0, contents.indexOf('## To Do')+9).concat(uncheckedLines);
							const second = contents.slice(contents.indexOf('## To Do')+9, contents.length-1);
							vault.modify(folder.children.at(folder.children.length-1) as TFile, first.concat(second));
						})
					});
				};
			});
		});
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: DailyNoteHelper;

	constructor(app: App, plugin: DailyNoteHelper) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
