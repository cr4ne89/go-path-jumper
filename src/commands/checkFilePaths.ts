import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { JumperSetting } from '../models/JumperSetting';
import { compileSettings } from '../utils/settings';
import { findFiles, processFilesInBatches, extractPathMatches, MatchedPath } from '../utils/fileSearch';
import { positionAt } from '../utils/textUtils';

export function registerCheckFilePathsCommand(
    context: vscode.ExtensionContext,
    settings: JumperSetting[],
    diagnosticCollection: vscode.DiagnosticCollection
) {
    const command = vscode.commands.registerCommand(
        'go-path-jumper.checkFilePaths',
        async () => {
            await checkFilePaths(settings, diagnosticCollection);
        }
    );
    context.subscriptions.push(command);
}

async function checkFilePaths(
    settings: JumperSetting[],
    diagnosticCollection: vscode.DiagnosticCollection
) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('ワークスペースフォルダが開かれていません。');
        return;
    }

    diagnosticCollection.clear();

    const lintSettings = settings.filter(s => s.lint !== false);
    const compiledSettings = compileSettings(lintSettings);
    if (compiledSettings.length === 0) {
        return;
    }

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'ファイルパスをチェックしています',
            cancellable: true,
        },
        async (progress, cancellationToken) => {
            const diagnosticsMap = new Map<string, vscode.Diagnostic[]>();
            let problemCount = 0;
            const existsCache = new Map<string, boolean>();

            for (const workspaceFolder of workspaceFolders) {
                const rootPath = workspaceFolder.uri.fsPath;

                const files = await findFiles(compiledSettings);
                if (files.length === 0) {
                    continue;
                }

                const completed = await processFilesInBatches(
                    files,
                    { cancellationToken, progress },
                    (file, text, fileExt) => {
                        const pathMatches = extractPathMatches(file, text, fileExt, compiledSettings, rootPath);
                        for (const match of pathMatches) {
                            let found = false;
                            for (const fullPath of match.fullPaths) {
                                const exists = existsCache.has(fullPath) ? existsCache.get(fullPath)! : fs.existsSync(fullPath);
                                existsCache.set(fullPath, exists);
                                if (exists) {
                                    found = true;
                                    break;
                                }
                            }

                            if (!found) {
                                addDiagnostic(diagnosticsMap, file, text, match, match.fullPaths[0]);
                                problemCount++;
                            }
                        }
                    }
                );

                if (!completed) {
                    vscode.window.setStatusBarMessage('GPJ キャンセルしました', 5000);
                    return;
                }
            }

            for (const [fileKey, diagnostics] of diagnosticsMap) {
                diagnosticCollection.set(vscode.Uri.parse(fileKey), diagnostics);
            }

            if (problemCount > 0) {
                vscode.window.setStatusBarMessage(`GPJ ${problemCount} 件の存在しないパスが見つかりました`, 5000);
            } else {
                vscode.window.setStatusBarMessage('GPJ すべてのパスが有効です', 5000);
            }
        }
    );
}

function addDiagnostic(
    diagnosticsMap: Map<string, vscode.Diagnostic[]>,
    file: vscode.Uri,
    text: string,
    match: MatchedPath,
    fullPath: string
) {
    const position = positionAt(text, match.matchIndex);
    const endPosition = positionAt(text, match.matchIndex + match.matchLength);
    const range = new vscode.Range(position, endPosition);

    const diagnostic = new vscode.Diagnostic(
        range,
        `ファイルが見つかりません: ${fullPath}`,
        vscode.DiagnosticSeverity.Warning
    );
    diagnostic.source = 'Go Path Jumper';

    const fileKey = file.toString();
    if (!diagnosticsMap.has(fileKey)) {
        diagnosticsMap.set(fileKey, []);
    }
    diagnosticsMap.get(fileKey)!.push(diagnostic);
}
