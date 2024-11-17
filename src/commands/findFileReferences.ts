import * as vscode from 'vscode';
import * as path from 'path';
import { JumperSetting } from '../models/JumperSetting';
import { ReferencesProvider } from '../providers/ReferencesProvider';

export function registerCommands(
    context: vscode.ExtensionContext,
    settings: JumperSetting[],
    referencesProvider: ReferencesProvider
) {
    const findFileReferencesCommand = vscode.commands.registerCommand(
        'go-path-jumper.findFileReferences',
        async (uri: vscode.Uri) => {
            await findFileReferences(uri, settings, referencesProvider);
        }
    );
    context.subscriptions.push(findFileReferencesCommand);
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

        // 開いているファイルの拡張子に関連する設定を取得する(検索時に関係のない言語のファイルを読み取りたくないため)
        const relevantSettings = settings.filter(setting => setting.fileExtension === targetExtension);

        if (relevantSettings.length === 0) {
            vscode.window.showInformationMessage('このファイルに関連する設定が見つかりませんでした。');
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
                let totalFiles = 0;
                let processedFiles = 0;

                // 現状は同じ言語の設定を複数持つケースは想定していないため、設定をループする必要ないかも
                for (const [index, setting] of relevantSettings.entries()) {
                    if (cancellationToken.isCancellationRequested) {
                        referencesProvider.clearReferences();
                        cancelFindReferences();
                        return;
                    }

                    let regexMatchPattern: RegExp;

                    try {
                        regexMatchPattern = new RegExp(setting.regexMatchPattern, 'g');
                    } catch (error: any) {
                        vscode.window.showErrorMessage(
                            `正規表現のコンパイルに失敗しました（設定 ${index + 1}）：${error.message}`
                        );
                        continue;
                    }

                    let targetFilePath = path.relative(path.join(rootPath, setting.basePath), targetUri.fsPath);
                    targetFilePath = targetFilePath.replace(/\\/g, '/'); // Windows対応
                    targetFilePath = targetFilePath.replace(/\//g, setting.delimiter);
                    targetFilePath = targetFilePath.replace(new RegExp(`${setting.fileExtension}$`), '');

                    const files = await getSearchFiles(rootPath, setting);
                    totalFiles += files.length;

                    for (const file of files) {
                        if (cancellationToken.isCancellationRequested) {
                            referencesProvider.clearReferences();
                            cancelFindReferences();
                            return;
                        }

                        processedFiles++;

                        if (processedFiles % 10 === 0 || processedFiles === totalFiles) {
                            progress.report({
                                increment: (10 / totalFiles) * 100,
                                message: `(${processedFiles}/${totalFiles}) ${path.basename(file.fsPath)}`,
                            });
                        }

                        const fileDocument = await vscode.workspace.openTextDocument(file);
                        if (fileDocument.languageId !== setting.language) continue;

                        const text = fileDocument.getText();

                        let matchResult;
                        while ((matchResult = regexMatchPattern.exec(text)) !== null) {
                            if (cancellationToken.isCancellationRequested) {
                                referencesProvider.clearReferences();
                                cancelFindReferences();
                                return;
                            }

                            let filePath = matchResult[1];
                            if (filePath) {
                                filePath = filePath.replace(new RegExp(setting.delimiter, 'g'), '/');
                                const fullPath = path.join(rootPath, setting.basePath, filePath + setting.fileExtension);
                                const normalizedFullPath = path.normalize(fullPath);
                                const normalizedTargetPath = path.normalize(targetUri.fsPath);

                                if (normalizedFullPath === normalizedTargetPath) {
                                    const position = fileDocument.positionAt(matchResult.index);
                                    references.push(new vscode.Location(file, position));
                                }
                            }
                        }
                    }
                }

                if (cancellationToken.isCancellationRequested) {
                    referencesProvider.clearReferences();
                    cancelFindReferences();
                    return;
                }

                if (references.length > 0) {
                    referencesProvider.setReferences(references);
                    successFindReferences(references.length);
                    vscode.commands.executeCommand('workbench.view.explorer');
                } else {
                    referencesProvider.clearReferences();
                    failureFindReferences();
                }
            }
        );
    } catch (error: any) {
        vscode.window.showErrorMessage(`参照の検索中にエラーが発生しました：${error.message}`);
    }
}

async function getSearchFiles(rootPath: string, setting: JumperSetting): Promise<vscode.Uri[]> {
    const languageExtensions = getExtensionsForLanguage(setting.language);
    if (!languageExtensions || languageExtensions.length === 0) {
        console.warn(`言語 '${setting.language}' に対応するファイル拡張子が見つかりませんでした。`);
        return [];
    }
    const globPattern = `**/*.{${languageExtensions.join(',')}}`;
    const files = await vscode.workspace.findFiles(globPattern);
    return files;
}

function getExtensionsForLanguage(languageId: string): string[] {
    const languages = vscode.extensions.all.flatMap(ext => ext.packageJSON.contributes?.languages || []);
    const language = languages.find((lang: any) => lang.id === languageId);
    if (language && language.extensions) {
        return language.extensions.map((ext: string) => ext.replace(/^\./, ''));
    }
    return [];
}

function successFindReferences(i: number) {
    vscode.window.setStatusBarMessage(`GPJ ${i} 件の参照が見つかりました`, 5000);
}

function failureFindReferences() {
    vscode.window.setStatusBarMessage('GPJ 参照が見つかりませんでした', 5000);
}

function cancelFindReferences() {
    vscode.window.setStatusBarMessage('GPJ キャンセルしました', 5000);
}