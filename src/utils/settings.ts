import * as vscode from 'vscode';
import { JumperSetting } from '../models/JumperSetting';

export interface CompiledSetting {
    setting: JumperSetting;
    regex: RegExp;
}

/** 正規表現を事前コンパイルする */
export function compileSettings(settings: JumperSetting[]): CompiledSetting[] {
    const compiled: CompiledSetting[] = [];
    for (const [index, setting] of settings.entries()) {
        try {
            compiled.push({
                setting,
                regex: new RegExp(setting.regex, 'g'),
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(
                `正規表現のコンパイルに失敗しました（設定 ${index + 1}）：${message}`
            );
        }
    }
    return compiled;
}

export function getJumperSettings(): JumperSetting[] {
    const config = vscode.workspace.getConfiguration('go-path-jumper');
    const settingsArray = config.get<Record<string, unknown>[]>('settings', []);
    return settingsArray
        .map((setting, index) => {
            const regex = setting.regex;
            const basePath = setting.basePath || '/';
            const targetExt = setting.targetExt || '';
            const delimiter = setting.delimiter || '/';
            const pathCapture = setting.pathCapture ?? 1;
            const fallbackPath = setting.fallbackPath;
            const sourceExt = setting.sourceExt;

            if (!regex) {
                console.warn(`設定${index + 1}が不完全なため、スキップされました（regex が未設定）。`);
                return null;
            }

            if (!Array.isArray(sourceExt) || sourceExt.length === 0) {
                console.warn(`設定${index + 1}が不完全なため、スキップされました（sourceExt が未設定または空）。`);
                return null;
            }

            return {
                regex,
                basePath,
                targetExt,
                delimiter,
                pathCapture,
                fallbackPath,
                sourceExt,
                checkFilePaths: setting.checkFilePaths,
            } as JumperSetting;
        })
        .filter(setting => setting !== null) as JumperSetting[];
}
