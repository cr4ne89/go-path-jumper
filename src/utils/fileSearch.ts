import * as vscode from 'vscode';
import * as path from 'path';
import { JumperSetting } from '../models/JumperSetting';
import { resolveAllPaths } from './templateResolver';
import { CompiledSetting } from './settings';
import { matchesFileExtension } from './textUtils';

interface ContributedLanguage {
    id: string;
    extensions?: string[];
}

const DEFAULT_EXCLUDES = ['**/node_modules/**', '**/.git/**', '**/out/**', '**/dist/**'];

function getExcludePattern(): string {
    const config = vscode.workspace.getConfiguration('go-path-jumper');
    const userExcludes = config.get<string[]>('excludePaths', []);
    return `{${[...DEFAULT_EXCLUDES, ...userExcludes].join(',')}}`;
}

const extensionCache = new Map<string, string[]>();

/** 設定からソースファイルの拡張子リストを取得する */
export function getSearchExtensions(setting: JumperSetting): string[] {
    if (setting.sourceExtensions && setting.sourceExtensions.length > 0) {
        return setting.sourceExtensions.map(ext => ext.replace(/^\./, ''));
    }
    const languages = Array.isArray(setting.language) ? setting.language : [setting.language];
    const allExtensions = new Set<string>();
    for (const lang of languages) {
        for (const ext of getExtensionsForLanguage(lang)) {
            allExtensions.add(ext);
        }
    }
    return [...allExtensions];
}

/** 言語IDからファイル拡張子を取得する（メモ化あり） */
export function getExtensionsForLanguage(languageId: string): string[] {
    if (extensionCache.has(languageId)) {
        return extensionCache.get(languageId)!;
    }
    const languages = vscode.extensions.all.flatMap(ext => ext.packageJSON.contributes?.languages || []);
    const language = languages.find((lang: ContributedLanguage) => lang.id === languageId);
    const extensions = language?.extensions?.map((ext: string) => ext.replace(/^\./, '')) || [];
    extensionCache.set(languageId, extensions);
    return extensions;
}

/** 設定に該当するファイルを検索する */
export async function findFiles(settings: { setting: JumperSetting }[]): Promise<vscode.Uri[]> {
    const allFileExtensions = new Set<string>();
    for (const { setting } of settings) {
        for (const ext of getSearchExtensions(setting)) {
            allFileExtensions.add(ext);
        }
    }
    if (allFileExtensions.size === 0) {
        return [];
    }
    const globPattern = `**/*.{${[...allFileExtensions].join(',')}}`;
    return vscode.workspace.findFiles(globPattern, getExcludePattern());
}

export interface ProgressContext {
    cancellationToken: vscode.CancellationToken;
    progress: vscode.Progress<{ increment?: number; message?: string }>;
}

/** ファイルをバッチ処理する。各ファイルのテキストと拡張子をコールバックに渡す */
export async function processFilesInBatches(
    files: vscode.Uri[],
    batch: ProgressContext,
    callback: (file: vscode.Uri, text: string, fileExt: string) => void
): Promise<boolean> {
    const BATCH_SIZE = 5;
    const totalFiles = files.length;
    let processedFiles = 0;

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        if (batch.cancellationToken.isCancellationRequested) {
            return false;
        }

        const currentBatch = files.slice(i, i + BATCH_SIZE);
        const batchContents = await Promise.all(
            currentBatch.map(file => vscode.workspace.fs.readFile(file))
        );

        for (let j = 0; j < currentBatch.length; j++) {
            if (batch.cancellationToken.isCancellationRequested) {
                return false;
            }

            const file = currentBatch[j];
            const text = new TextDecoder().decode(batchContents[j]);
            const fileExt = path.extname(file.fsPath);

            callback(file, text, fileExt);
        }

        processedFiles = Math.min(i + BATCH_SIZE, totalFiles);
        batch.progress.report({
            increment: (BATCH_SIZE / totalFiles) * 100,
            message: `(${processedFiles}/${totalFiles})`,
        });

        // イベントループに制御を戻す
        await new Promise(resolve => setImmediate(resolve));
    }

    return true;
}

export interface MatchedPath {
    file: vscode.Uri;
    matchIndex: number;
    matchLength: number;
    fullPaths: string[];
}

/** 各コンパイル済み設定に対してマッチを抽出し、候補フルパスを返す */
export function extractPathMatches(
    file: vscode.Uri,
    text: string,
    fileExt: string,
    compiledSettings: CompiledSetting[],
    rootPath: string
): MatchedPath[] {
    const matches: MatchedPath[] = [];

    for (const { setting, regex } of compiledSettings) {
        if (!matchesFileExtension(setting, fileExt)) {
            continue;
        }

        const localRegex = new RegExp(regex.source, regex.flags);
        let matchResult;

        while ((matchResult = localRegex.exec(text)) !== null) {
            const candidates = resolveAllPaths(setting, matchResult);
            if (candidates.length === 0) {
                continue;
            }

            const fullPaths = candidates.map(resolved =>
                path.join(rootPath, resolved.basePath, resolved.filePath + setting.fileExtension)
            );

            matches.push({
                file,
                matchIndex: matchResult.index,
                matchLength: matchResult[0].length,
                fullPaths,
            });
        }
    }

    return matches;
}
