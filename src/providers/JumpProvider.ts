import * as vscode from 'vscode';
import * as path from 'path';
import { JumperSetting } from '../models/JumperSetting';

class JumpProvider implements vscode.DefinitionProvider {
    constructor(private setting: JumperSetting, private regexPattern: RegExp, private regexMatchPattern: RegExp) {}

    provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
        const range = document.getWordRangeAtPosition(position, this.regexPattern);
        if (!range) {
            return null;
        }

        const matchResult = document.getText(range).match(this.regexMatchPattern);
        let filePath = matchResult ? matchResult[1] : null;

        if (filePath) {
            filePath = filePath.replace(new RegExp(this.setting.delimiter, 'g'), '/');
        } else {
            return null;
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('ワークスペースフォルダが開かれていません。');
            return null;
        }
        const rootPath = workspaceFolder.uri.fsPath;

        let fullPath = path.join(rootPath, this.setting.basePath, filePath + this.setting.fileExtension);
        let fileUri = vscode.Uri.file(fullPath);

        return new vscode.Location(fileUri, new vscode.Position(0, 0));
    }
}

export function registerJumpProviders(context: vscode.ExtensionContext, settings: JumperSetting[]) {
    settings.forEach((setting, index) => {
        let regexPattern: RegExp;
        let regexMatchPattern: RegExp;

        try {
            regexPattern = new RegExp(setting.regexPattern);
            regexMatchPattern = new RegExp(setting.regexMatchPattern);
        } catch (error: any) {
            vscode.window.showErrorMessage(`正規表現のコンパイルに失敗しました（設定 ${index + 1}）：${error.message}`);
            return;
        }

        const disposable = vscode.languages.registerDefinitionProvider(
            [{ scheme: 'file', language: setting.language }],
            new JumpProvider(setting, regexPattern, regexMatchPattern)
        );
        context.subscriptions.push(disposable);
    });
}
