import * as vscode from 'vscode';
import * as path from 'path';
import { ReferenceItem } from '../models/ReferenceItem';

export class ReferencesProvider implements vscode.TreeDataProvider<ReferenceItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ReferenceItem | undefined | void> = new vscode.EventEmitter<
        ReferenceItem | undefined | void
    >();
    readonly onDidChangeTreeData: vscode.Event<ReferenceItem | undefined | void> = this._onDidChangeTreeData.event;

    private references: ReferenceItem[] = [];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setReferences(references: vscode.Location[]) {
        this.references = references.map(ref => {
            const label = `${path.basename(ref.uri.fsPath)}:${ref.range.start.line + 1}`;
            return new ReferenceItem(label, vscode.TreeItemCollapsibleState.None, ref);
        });
        this.refresh();
    }

    clearReferences() {
        this.references = [];
        this.refresh();
    }

    getTreeItem(element: ReferenceItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ReferenceItem): Thenable<ReferenceItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.references);
        }
    }
}

export function registerReferencesProvider(provider : ReferencesProvider) {
    vscode.window.registerTreeDataProvider('goPathJumperReferences', provider);
}
