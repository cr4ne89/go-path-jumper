import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { JumperSetting } from '../models/JumperSetting';
import { resolveAllPaths } from '../utils/templateResolver';
import { getSearchExtensions } from '../utils/fileSearch';

interface CompiledSettingEntry {
    setting: JumperSetting;
    regex: RegExp;
}

class JumperDocumentLink extends vscode.DocumentLink {
    setting: JumperSetting;
    matchResult: RegExpMatchArray;
    rootPath: string;

    constructor(
        range: vscode.Range,
        setting: JumperSetting,
        matchResult: RegExpMatchArray,
        rootPath: string,
        tooltip?: string
    ) {
        super(range);
        this.setting = setting;
        this.matchResult = matchResult;
        this.rootPath = rootPath;
        if (tooltip) {
            this.tooltip = tooltip;
        }
    }
}

class JumpLinkProvider implements vscode.DocumentLinkProvider<JumperDocumentLink> {
    constructor(private compiled: CompiledSettingEntry[]) {}

    provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): JumperDocumentLink[] {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (!workspaceFolder) {
            return [];
        }
        const rootPath = workspaceFolder.uri.fsPath;
        const text = document.getText();
        const links: JumperDocumentLink[] = [];
        const fileExt = path.extname(document.fileName).replace(/^\./, '');

        for (const { setting, regex } of this.compiled) {
            // Check if this setting applies to the current file's extension
            const extensions = getSearchExtensions(setting);
            if (!extensions.includes(fileExt)) {
                continue;
            }

            // Reset lastIndex for 'g' flag regex
            regex.lastIndex = 0;

            let matchResult: RegExpExecArray | null;
            while ((matchResult = regex.exec(text)) !== null) {
                if (token.isCancellationRequested) {
                    return links;
                }
                if (!matchResult.indices) {
                    continue;
                }

                const captureIndices = matchResult.indices[setting.pathCapture];
                if (!captureIndices) {
                    continue;
                }

                const [startOffset, endOffset] = captureIndices;
                const startPos = document.positionAt(startOffset);
                const endPos = document.positionAt(endOffset);
                const range = new vscode.Range(startPos, endPos);

                // Compute tooltip from first candidate
                const candidates = resolveAllPaths(setting, matchResult);
                let tooltip: string | undefined;
                if (candidates.length > 0) {
                    const first = candidates[0];
                    tooltip = path.join(rootPath, first.basePath, first.filePath + setting.targetExt);
                }

                links.push(new JumperDocumentLink(range, setting, matchResult, rootPath, tooltip));
            }
        }

        return links;
    }

    resolveDocumentLink(link: JumperDocumentLink, _token: vscode.CancellationToken): JumperDocumentLink {
        const candidates = resolveAllPaths(link.setting, link.matchResult);

        // 候補パスを順に試し、存在するファイルを優先
        for (const resolved of candidates) {
            const fullPath = path.join(link.rootPath, resolved.basePath, resolved.filePath + link.setting.targetExt);
            if (fs.existsSync(fullPath)) {
                link.target = vscode.Uri.file(fullPath);
                return link;
            }
        }

        // どれも存在しない場合は最初の候補を返す（従来の動作）
        if (candidates.length > 0) {
            const fallback = candidates[0];
            const fullPath = path.join(link.rootPath, fallback.basePath, fallback.filePath + link.setting.targetExt);
            link.target = vscode.Uri.file(fullPath);
        }

        return link;
    }
}

export function registerJumpProviders(context: vscode.ExtensionContext, settings: JumperSetting[]): void {
    const allExtensions = new Set<string>();
    const allEntries: CompiledSettingEntry[] = [];

    settings.forEach((setting, index) => {
        let regex: RegExp;
        try {
            regex = new RegExp(setting.regex, 'gd');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`正規表現のコンパイルに失敗しました（設定 ${index + 1}）：${message}`);
            return;
        }

        const entry: CompiledSettingEntry = { setting, regex };
        allEntries.push(entry);

        for (const ext of setting.sourceExt) {
            allExtensions.add(ext.replace(/^\./, ''));
        }
    });

    if (allExtensions.size === 0 || allEntries.length === 0) {
        return;
    }

    // 全拡張子をカバーするglobパターンで1つのプロバイダーを登録
    const pattern = `**/*.{${[...allExtensions].join(',')}}`;
    const disposable = vscode.languages.registerDocumentLinkProvider(
        [{ scheme: 'file', pattern }],
        new JumpLinkProvider(allEntries)
    );
    context.subscriptions.push(disposable);
}
