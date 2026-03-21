import * as vscode from 'vscode';
import * as path from 'path';
import { JumperSetting } from '../models/JumperSetting';
import { ReferencesProvider } from '../providers/ReferencesProvider';
import { compileSettings } from '../utils/settings';
import { findFiles, processFilesInBatches, extractPathMatches } from '../utils/fileSearch';
import { positionAt } from '../utils/textUtils';

export function registerCommands(
    context: vscode.ExtensionContext,
    settings: JumperSetting[],
    referencesProvider: ReferencesProvider
) {
    const command = vscode.commands.registerCommand(
        'go-path-jumper.findFileReferences',
        async (uri: vscode.Uri) => {
            await findFileReferences(uri, settings, referencesProvider);
        }
    );
    context.subscriptions.push(command);
}

async function findFileReferences(
    uri: vscode.Uri,
    settings: JumperSetting[],
    referencesProvider: ReferencesProvider
) {
    try {
        const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
        if (!targetUri) {
            vscode.window.showErrorMessage('対象のファイルが選択されていません。');
            return;
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(targetUri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('ワークスペースフォルダが開かれていません。');
            return;
        }
        const rootPath = workspaceFolder.uri.fsPath;

        const targetExtension = path.extname(targetUri.fsPath);
        const relevantSettings = settings.filter(s => s.fileExtension === targetExtension);

        if (relevantSettings.length === 0) {
            vscode.window.showInformationMessage('このファイルに関連する設定が見つかりませんでした。');
            return;
        }

        const compiledSettings = compileSettings(relevantSettings);
        if (compiledSettings.length === 0) {
            return;
        }

        const files = await findFiles(compiledSettings);
        if (files.length === 0) {
            vscode.window.showInformationMessage('対象言語のファイルが見つかりませんでした。');
            return;
        }

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'ファイルの参照を検索しています ',
                cancellable: true,
            },
            async (progress, cancellationToken) => {
                const references: vscode.Location[] = [];
                const normalizedTargetPath = path.normalize(targetUri.fsPath);

                const completed = await processFilesInBatches(
                    files,
                    { cancellationToken, progress },
                    (file, text, fileExt) => {
                        const pathMatches = extractPathMatches(file, text, fileExt, compiledSettings, rootPath);
                        for (const match of pathMatches) {
                            const hasTarget = match.fullPaths.some(
                                fp => path.normalize(fp) === normalizedTargetPath
                            );
                            if (hasTarget) {
                                references.push(new vscode.Location(file, positionAt(text, match.matchIndex)));
                            }
                        }
                    }
                );

                if (!completed) {
                    referencesProvider.clearReferences();
                    vscode.window.setStatusBarMessage('GPJ キャンセルしました', 5000);
                    return;
                }

                if (references.length > 0) {
                    referencesProvider.setReferences(references);
                    vscode.window.setStatusBarMessage(`GPJ ${references.length} 件の参照が見つかりました`, 5000);
                    vscode.commands.executeCommand('workbench.view.explorer');
                } else {
                    referencesProvider.clearReferences();
                    vscode.window.setStatusBarMessage('GPJ 参照が見つかりませんでした', 5000);
                }
            }
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`参照の検索中にエラーが発生しました：${message}`);
    }
}
