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
                regex: new RegExp(setting.regexMatchPattern, 'g'),
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
            const language = setting.language;
            const regexPattern = setting.regexPattern;
            const regexMatchPattern = setting.regexMatchPattern;
            const basePath = setting.basePath || '/';
            const fileExtension = setting.fileExtension || '';
            const delimiter = setting.delimiter || '/';
            const pathCapture = setting.pathCapture ?? 1;
            const defaultBasePath = setting.defaultBasePath;

            if (!language || !regexPattern || !regexMatchPattern) {
                console.warn(`設定${index + 1}が不完全なため、スキップされました。`);
                return null;
            }

            return {
                language,
                regexPattern,
                regexMatchPattern,
                basePath,
                fileExtension,
                delimiter,
                pathCapture,
                defaultBasePath,
                sourceExtensions: setting.sourceExtensions,
                lint: setting.lint,
            } as JumperSetting;
        })
        .filter(setting => setting !== null) as JumperSetting[];
}
