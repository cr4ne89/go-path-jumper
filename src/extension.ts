import * as vscode from 'vscode';
import { getJumperSettings } from './utils/settings';
import { registerCommands } from './commands/findFileReferences';
import { registerCheckFilePathsCommand } from './commands/checkFilePaths';
import { ReferencesProvider, registerReferencesProvider } from './providers/ReferencesProvider';
import { registerJumpProviders } from './providers/JumpProvider';

export function activate(context: vscode.ExtensionContext) {
    const referencesProvider = new ReferencesProvider();
    const settings = getJumperSettings();
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('go-path-jumper');

    registerJumpProviders(context, settings);
    registerReferencesProvider(referencesProvider);
    registerCommands(context, settings, referencesProvider);
    registerCheckFilePathsCommand(context, settings, diagnosticCollection);

    context.subscriptions.push(diagnosticCollection);
}

export function deactivate() {}
