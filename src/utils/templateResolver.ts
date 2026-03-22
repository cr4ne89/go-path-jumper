import { JumperSetting } from '../models/JumperSetting';

export interface ResolvedPath {
    basePath: string;
    filePath: string;
}

export function resolvePathFromMatch(setting: JumperSetting, matchResult: RegExpMatchArray): ResolvedPath | null {
    const filePath = matchResult[setting.pathCapture];
    if (!filePath) {
        return null;
    }

    let basePath = setting.basePath;

    // basePath にテンプレート変数 ${N} があれば、キャプチャグループの値で置換
    let hasTemplate = false;
    let allResolved = true;
    basePath = basePath.replace(/\$\{(\d+)\}/g, (_match, groupNum) => {
        hasTemplate = true;
        const value = matchResult[parseInt(groupNum, 10)];
        if (value === undefined) {
            allResolved = false;
            return '';
        }
        return value;
    });

    if (hasTemplate && !allResolved) {
        // テンプレート解決失敗 → fallbackPath にフォールバック
        if (setting.fallbackPath) {
            basePath = setting.fallbackPath;
        } else {
            return null;
        }
    }

    const normalizedFilePath = filePath.replace(new RegExp(setting.delimiter, 'g'), '/');

    return { basePath, filePath: normalizedFilePath };
}

/**
 * マッチ結果から候補パスを全て返す。
 * basePath（テンプレート解決済み）を先頭に、fallbackPath が異なる場合はフォールバックとして追加。
 */
export function resolveAllPaths(setting: JumperSetting, matchResult: RegExpMatchArray): ResolvedPath[] {
    const filePath = matchResult[setting.pathCapture];
    if (!filePath) {
        return [];
    }

    const normalizedFilePath = filePath.replace(new RegExp(setting.delimiter, 'g'), '/');
    const paths: ResolvedPath[] = [];

    const primary = resolvePathFromMatch(setting, matchResult);
    if (primary) {
        paths.push(primary);
    }

    // fallbackPath が存在し、primary と異なる場合はフォールバック候補として追加
    if (setting.fallbackPath) {
        const alreadyIncluded = paths.some(p => p.basePath === setting.fallbackPath);
        if (!alreadyIncluded) {
            let fallbackFilePath = normalizedFilePath;
            const templateMatches = setting.basePath.matchAll(/\$\{(\d+)\}/g);
            for (const tm of templateMatches) {
                const groupNum = parseInt(tm[1], 10);
                if (groupNum !== setting.pathCapture) {
                    const value = matchResult[groupNum];
                    if (value !== undefined) {
                        fallbackFilePath = value + '/' + fallbackFilePath;
                    }
                }
            }
            paths.push({ basePath: setting.fallbackPath, filePath: fallbackFilePath });
        }
    }

    return paths;
}
