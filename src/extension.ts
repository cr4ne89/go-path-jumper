import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.languages.registerDefinitionProvider(
        [
            { scheme: 'file', language: 'go' },
            { scheme: 'file', language: 'svelte' },
        ],
        {
            provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
                const config = vscode.workspace.getConfiguration('go-path-jumper');

                const Settings = {
                    "default": {
                        regexPattern: new RegExp(config.get('RegexPattern', '')),
                        regexMatchPattern: new RegExp(config.get('RegexMatchPattern', '')),
                        basePath: config.get('BasePath', ''),
                        fileExtension: config.get('FileExtension', ''),
                        splitter: "/",
                        notFoundPath: config.get('SecondaryNotFoundPath', ''),
                    },
                    "secondary": {
                        regexPattern: new RegExp(config.get('SecondaryRegexPattern', '')),
                        regexMatchPattern: new RegExp(config.get('SecondaryRegexMatchPattern', '')),
                        basePath: config.get('SecondaryBasePath', ''),
                        fileExtension: config.get('SecondaryFileExtension', ''),
                        splitter: config.get('SecondarySplitter', ''),
                        notFoundPath: config.get('SecondaryNotFoundPath', ''),
                    }
                }


                const r1 = document.getWordRangeAtPosition(position, Settings.default.regexPattern);
                const r2 = document.getWordRangeAtPosition(position, Settings.secondary.regexPattern);

                var pattern: "default" | "secondary" = "default";

                let range: vscode.Range;
                if (r1) {
                    pattern = "default";
                    range = r1;
                } else if (r2) {
                    pattern = "secondary";
                    range = r2;
                } else {
                    return null;
                }

                const applySettings = Settings[pattern];

                const matchResult = document.getText(range).match(applySettings.regexMatchPattern);
                let filePath = matchResult ? matchResult[1] : null;

                if (filePath) {
                    filePath = filePath.replaceAll(applySettings.splitter, "/");
                }

                const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage('ワークスペースフォルダが開かれていません。');
                    return null;
                }
                const rootPath = workspaceFolder?.uri.fsPath;

                let fullPath = path.join(rootPath, applySettings.basePath, filePath + applySettings.fileExtension);
                let fileUri = vscode.Uri.file(fullPath);

                return new vscode.Location(fileUri, new vscode.Position(0, 0));
            }
        }
    )

    context.subscriptions.push(disposable);
}

export function deactivate() { }
