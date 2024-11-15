import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('go-path-jumper');
    const settingsArray = config.get<any[]>('settings', []);

    settingsArray.forEach((setting, index) => {
        const language = setting.language;
        const regexPatternString = setting.regexPattern;
        const regexMatchPatternString = setting.regexMatchPattern;
        const basePath = setting.basePath || '/';
        const fileExtension = setting.fileExtension || '';
        const delimiter = setting.delimiter || '/';

        if (!language || !regexPatternString || !regexMatchPatternString) {
            console.warn(`設定${index + 1}が不完全なため、スキップされました。`);
            return;
        }

        let regexPattern: RegExp;
        let regexMatchPattern: RegExp;

        try {
            regexPattern = new RegExp(regexPatternString);
            regexMatchPattern = new RegExp(regexMatchPatternString);
        } catch (error: any) {
            vscode.window.showErrorMessage(`正規表現のコンパイルに失敗しました（設定 ${index + 1}）：${error.message}`);
            return;
        }

        const disposable = vscode.languages.registerDefinitionProvider(
            [{ scheme: 'file', language: language }],
            {
                provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
                    const range = document.getWordRangeAtPosition(position, regexPattern);
                    if (!range) {
                        return null;
                    }

                    const matchResult = document.getText(range).match(regexMatchPattern);
                    let filePath = matchResult ? matchResult[1] : null;

                    if (filePath) {
                        filePath = filePath.replace(new RegExp(delimiter, 'g'), '/');
                    } else {
                        return null;
                    }

                    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
                    if (!workspaceFolder) {
                        vscode.window.showErrorMessage('ワークスペースフォルダが開かれていません。');
                        return null;
                    }
                    const rootPath = workspaceFolder.uri.fsPath;

                    let fullPath = path.join(rootPath, basePath, filePath + fileExtension);
                    let fileUri = vscode.Uri.file(fullPath);

                    return new vscode.Location(fileUri, new vscode.Position(0, 0));
                }
            }
        );

        context.subscriptions.push(disposable);
    });
}

export function deactivate() {}