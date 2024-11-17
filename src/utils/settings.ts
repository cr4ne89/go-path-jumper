import * as vscode from 'vscode';
import { JumperSetting } from '../models/JumperSetting';

export function getJumperSettings(): JumperSetting[] {
    const config = vscode.workspace.getConfiguration('go-path-jumper');
    const settingsArray = config.get<any[]>('settings', []);
    return settingsArray
        .map((setting, index) => {
            const language = setting.language;
            const regexPattern = setting.regexPattern;
            const regexMatchPattern = setting.regexMatchPattern;
            const basePath = setting.basePath || '/';
            const fileExtension = setting.fileExtension || '';
            const delimiter = setting.delimiter || '/';

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
            } as JumperSetting;
        })
        .filter(setting => setting !== null) as JumperSetting[];
}
