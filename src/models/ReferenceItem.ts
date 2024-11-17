import * as vscode from 'vscode';

export class ReferenceItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly location?: vscode.Location
    ) {
        super(label, collapsibleState);
        this.iconPath = new vscode.ThemeIcon('go-to-file');
        if (location) {
            this.command = {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [location.uri, { selection: location.range }]
            };
        }
        this.tooltip = location ? `${location.uri.fsPath}:${location.range.start.line + 1}` : '';
    }
}
