import * as vscode from 'vscode';
import { getJumperSettings } from './utils/settings';
import { registerCommands } from './commands/findFileReferences';
import { ReferencesProvider, registerReferencesProvider } from './providers/ReferencesProvider';
import { registerJumpProviders } from './providers/JumpProvider';

export function activate(context: vscode.ExtensionContext) {
    const referencesProvider = new ReferencesProvider();
    const settings = getJumperSettings();

    registerJumpProviders(context, settings);
    registerReferencesProvider(referencesProvider);
    registerCommands(context, settings, referencesProvider);
}

export function deactivate() {}
