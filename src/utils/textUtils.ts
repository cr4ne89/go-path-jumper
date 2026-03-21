import * as vscode from 'vscode';
import { JumperSetting } from '../models/JumperSetting';
import { getSearchExtensions } from './fileSearch';

/** テキスト内のオフセットから Position を算出する */
export function positionAt(text: string, offset: number): vscode.Position {
    const before = text.slice(0, offset);
    const lines = before.split('\n');
    return new vscode.Position(lines.length - 1, lines[lines.length - 1].length);
}

/** ファイル拡張子が設定のソース拡張子と一致するか判定する */
export function matchesFileExtension(setting: JumperSetting, fileExt: string): boolean {
    const extensions = getSearchExtensions(setting);
    const normalizedExt = fileExt.replace(/^\./, '');
    return extensions.includes(normalizedExt);
}
