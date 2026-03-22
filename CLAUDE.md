# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Go Path Jumper は、コード内に記載されたファイルパスから対象ファイルにジャンプできる **VS Code 拡張機能**（TypeScript製）。名前に "go" とあるが Go プロジェクトではない。

主な機能:

- **Cmd+Click ジャンプ**: コード内のファイルパスを Cmd/Ctrl+Click で対応ファイルを開く
- **ファイル参照検索**: 「GPJ: Find File References」コマンドで特定ファイルを参照している箇所を一覧表示
- **ファイルパスチェック**: 「GPJ: Check File Paths」コマンドで存在しないファイルパスを検出し警告表示

詳細は handbook.md に記載

## ビルド・検証コマンド

```bash
npm run compile    # TypeScript コンパイル
npm run lint       # ESLint 静的解析
npm run watch      # ファイル監視で自動コンパイル
npm run package    # .vsix ファイル生成
```

## アーキテクチャ

```
src/
├── extension.ts              # エントリーポイント
├── commands/
│   ├── findFileReferences.ts # 参照検索コマンド
│   └── checkFilePaths.ts     # パス存在チェックコマンド
├── models/
│   ├── JumperSetting.ts      # 設定インターフェース
│   └── ReferenceItem.ts      # ツリービューアイテム
├── providers/
│   ├── JumpProvider.ts       # DocumentLinkProvider（パスリンク表示 + Click ジャンプ）
│   └── ReferencesProvider.ts # TreeDataProvider（Explorer パネル）
└── utils/
    ├── settings.ts           # 設定読み込み + 正規表現コンパイル（CompiledSetting）
    ├── fileSearch.ts         # ファイル検索 + バッチ処理 + extractPathMatches
    ├── templateResolver.ts   # basePath テンプレート変数 ${N} の解決
    └── textUtils.ts          # テキスト位置計算 + 拡張子判定
```

## 設定フィールド（`go-path-jumper.settings`）

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `sourceExt` | Yes | 検索対象の拡張子（例: `[".go", ".ts"]`） |
| `regex` | Yes | パス抽出用の正規表現 |
| `basePath` | - | ベースパス（デフォルト: `/`、テンプレート `${N}` 対応） |
| `targetExt` | - | ジャンプ先ファイルの拡張子 |
| `delimiter` | - | パス区切り文字（デフォルト: `/`） |
| `pathCapture` | - | パスのキャプチャグループ番号（デフォルト: `1`） |
| `fallbackPath` | - | `basePath` テンプレート解決失敗時のフォールバック |
| `checkFilePaths` | - | `false` でパスチェック対象から除外 |

## 主要な型

| 型名 | ファイル | 説明 |
|------|---------|------|
| `JumperSetting` | models/JumperSetting.ts | ユーザー設定 |
| `CompiledSetting` | utils/settings.ts | 正規表現コンパイル済み設定 |
| `ProgressContext` | utils/fileSearch.ts | バッチ処理の進捗コンテキスト |
| `MatchedPath` | utils/fileSearch.ts | パスマッチ結果（位置 + 候補パス） |
| `ResolvedPath` | utils/templateResolver.ts | テンプレート解決済みパス |

## データフロー

設定読み込み → 正規表現コンパイル → ファイル検索 → バッチ処理 → `extractPathMatches()` でマッチ抽出 → 各コマンドが用途別に処理
