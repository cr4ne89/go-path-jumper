import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.languages.registerDefinitionProvider(
        { scheme: 'file', language: 'go' },
        {
            provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
                const config = vscode.workspace.getConfiguration('go-path-jumper');
                const regexPattern = new RegExp(config.get('RegexPattern', ''));
                const regexMatchPattern = new RegExp(config.get('RegexMatchPattern', ''));
                const basePath = config.get('BasePath', '');
				const fileExtension = config.get('FileExtension', '');

                const range = document.getWordRangeAtPosition(position, regexPattern);
                if (!range) {
                    return null;
                }

                const matchResult = document.getText(range).match(regexMatchPattern);
                const filePath = matchResult ? matchResult[1] : null;

                const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage('ワークスペースフォルダが開かれていません。');
                    return null;
                }
                const rootPath = workspaceFolder?.uri.fsPath;

                const fullPath = path.join(rootPath, basePath, filePath + fileExtension);
                const fileUri = vscode.Uri.file(fullPath);

                return new vscode.Location(fileUri, new vscode.Position(0, 0));
            }
        }
    )

	context.subscriptions.push(disposable);
}

export function deactivate() {}
