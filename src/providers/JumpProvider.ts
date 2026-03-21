import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { JumperSetting } from '../models/JumperSetting';
import { resolveAllPaths } from '../utils/templateResolver';

class JumpProvider implements vscode.DefinitionProvider {
    constructor(private setting: JumperSetting, private regexPattern: RegExp, private regexMatchPattern: RegExp) {}

    provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
        const range = document.getWordRangeAtPosition(position, this.regexPattern);
        if (!range) {
            return null;
        }

        const matchResult = document.getText(range).match(this.regexMatchPattern);
        if (!matchResult) {
            return null;
        }

        const candidates = resolveAllPaths(this.setting, matchResult);
        if (candidates.length === 0) {
            return null;
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('ワークスペースフォルダが開かれていません。');
            return null;
        }
        const rootPath = workspaceFolder.uri.fsPath;

        // 候補パスを順に試し、存在するファイルを優先
        for (const resolved of candidates) {
            const fullPath = path.join(rootPath, resolved.basePath, resolved.filePath + this.setting.fileExtension);
            if (fs.existsSync(fullPath)) {
                return new vscode.Location(vscode.Uri.file(fullPath), new vscode.Position(0, 0));
            }
        }

        // どれも存在しない場合は最初の候補を返す（従来の動作）
        const fallback = candidates[0];
        const fullPath = path.join(rootPath, fallback.basePath, fallback.filePath + this.setting.fileExtension);
        return new vscode.Location(vscode.Uri.file(fullPath), new vscode.Position(0, 0));
    }
}

export function registerJumpProviders(context: vscode.ExtensionContext, settings: JumperSetting[]) {
    settings.forEach((setting, index) => {
        let regexPattern: RegExp;
        let regexMatchPattern: RegExp;

        try {
            regexPattern = new RegExp(setting.regexPattern);
            regexMatchPattern = new RegExp(setting.regexMatchPattern);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`正規表現のコンパイルに失敗しました（設定 ${index + 1}）：${message}`);
            return;
        }

        const languages = Array.isArray(setting.language) ? setting.language : [setting.language];
        for (const lang of languages) {
            const disposable = vscode.languages.registerDefinitionProvider(
                [{ scheme: 'file', language: lang }],
                new JumpProvider(setting, regexPattern, regexMatchPattern)
            );
            context.subscriptions.push(disposable);
        }
    });
}
