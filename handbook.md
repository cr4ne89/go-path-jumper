# Go Path Jumper ハンドブック

このドキュメントは、Go Path Jumper の開発とリリースの手順をまとめたものです。

## プロジェクト概要

Go Path Jumper は、コード内に記載されたファイルパスから対応するファイルに素早くジャンプできる **VS Code / Cursor 向け拡張機能** です。TypeScript で実装されています。

主な機能:
- **Cmd+Click ジャンプ**: コード内のファイルパスをクリックして対応ファイルを開く
- **ファイル参照検索**: 「GPJ: Find File References」で特定ファイルを参照している箇所を一覧表示
- **ファイルパスチェック**: 「GPJ: Check File Paths」で存在しないファイルパスを検出し警告表示

## 技術スタック

| 項目 | 技術 |
|------|------|
| 言語 | TypeScript 5.9 |
| ターゲット | ES2022 / Node16 モジュール |
| 対応エディタ | VS Code / Cursor（engines.vscode: 1.105.1） |
| リンター | ESLint 10 + @typescript-eslint |
| パッケージング | @vscode/vsce |
| 公開先 | [Open VSX Registry](https://open-vsx.org/extension/cr4ne89/go-path-jumper) |

## 開発手順

### セットアップ

```bash
git clone https://github.com/cr4ne89/go-path-jumper.git
cd go-path-jumper
npm install
```

### 開発中に使うコマンド

```bash
npm run compile    # TypeScript をコンパイル（出力: out/）
npm run watch      # ファイル変更を監視して自動コンパイル
npm run lint       # ESLint で静的解析
```

### デバッグ

1. VS Code / Cursor でプロジェクトを開く
2. `npm run watch` を実行しておく
3. **F5** キーまたは「Run Extension」起動構成でデバッグ開始
4. Extension Development Host が起動し、拡張機能を実際に試せる

### プロジェクト構成

```
src/
├── extension.ts                  # エントリーポイント（activate で全体を登録）
├── commands/
│   ├── findFileReferences.ts     # ファイル参照検索コマンド
│   └── checkFilePaths.ts         # ファイルパス存在チェックコマンド
├── models/
│   ├── JumperSetting.ts          # 設定インターフェース
│   └── ReferenceItem.ts          # ツリービューアイテム
├── providers/
│   ├── JumpProvider.ts           # DocumentLinkProvider（パスリンク表示 + Click ジャンプ）
│   └── ReferencesProvider.ts     # TreeDataProvider（Explorer パネル）
└── utils/
    ├── settings.ts               # VS Code 設定の読み込み・正規表現コンパイル
    ├── fileSearch.ts             # ファイル検索・バッチ処理・パスマッチ抽出
    ├── templateResolver.ts       # basePath テンプレート変数の解決
    └── textUtils.ts              # テキスト位置計算・拡張子判定
```

### アーキテクチャ

```
extension.ts（初期化）
├── JumpLinkProvider（DocumentLinkProvider: パスに下線表示 + Click ジャンプ）
├── ReferencesProvider（検索結果表示）
├── findFileReferences コマンド（参照検索）
└── checkFilePaths コマンド（パス検証）

ユーティリティ層:
├── settings       … 設定読み込み + 正規表現コンパイル（CompiledSetting）
├── fileSearch     … ファイル検索 + バッチ処理 + extractPathMatches（共通マッチ抽出）
├── templateResolver … basePath テンプレート変数 ${N} の解決 + フォールバック
└── textUtils      … テキストオフセット→Position 変換 + 拡張子判定
```

**データフロー**:

1. `settings.ts` でユーザー設定（`go-path-jumper.settings`）を読み込み `JumperSetting[]` に変換
2. `compileSettings()` で正規表現を事前コンパイル → `CompiledSetting[]`
3. `fileSearch.ts` の `findFiles()` で `sourceExt` に該当するファイルを検索
4. `processFilesInBatches()` でファイルをバッチ処理
5. `extractPathMatches()` が各ファイルからパスマッチを抽出（共通処理）
6. 各コマンドがマッチ結果を用途に応じて処理:
   - **JumpLinkProvider**: ファイル開時にパスリンクを生成（下線表示）→ クリック時に候補パスの存在チェック → ジャンプ
   - **findFileReferences**: 候補パスがターゲットファイルと一致するかチェック
   - **checkFilePaths**: `checkFilePaths: false` の設定を除外 → 候補パスのいずれかが存在するかチェック → 存在しなければ診断警告

### 設定フィールド（`go-path-jumper.settings`）

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `sourceExt` | Yes | 検索対象の拡張子（例: `[".go", ".ts"]`） |
| `regex` | Yes | パス抽出用の正規表現 |
| `basePath` | - | ベースパス（デフォルト: `/`、テンプレート `${N}` 対応） |
| `targetExt` | - | ジャンプ先ファイルの拡張子 |
| `delimiter` | - | パス区切り文字（デフォルト: `/`） |
| `pathCapture` | - | パスのキャプチャグループ番号（デフォルト: `1`） |
| `fallbackPath` | - | `basePath` テンプレート解決失敗時のフォールバック |
| `checkFilePaths` | - | `false` でパスチェック対象から除外（デフォルト: `true`） |

### 主要な型

| 型名 | ファイル | 説明 |
|------|---------|------|
| `JumperSetting` | models/JumperSetting.ts | ユーザー設定のインターフェース |
| `CompiledSetting` | utils/settings.ts | 正規表現コンパイル済み設定 |
| `ProgressContext` | utils/fileSearch.ts | バッチ処理のキャンセル・進捗コンテキスト |
| `MatchedPath` | utils/fileSearch.ts | パスマッチ結果（位置情報 + 候補フルパス） |
| `ResolvedPath` | utils/templateResolver.ts | テンプレート解決済みパス（basePath + filePath） |

## リリース手順

### 1. バージョンを上げる

```bash
npm version patch    # パッチ: 0.0.10 → 0.0.11
npm version minor    # マイナー: 0.0.11 → 0.1.0
npm version major    # メジャー: 0.1.0 → 1.0.0
```

このコマンドで `package.json` の `version` が更新され、git タグも自動作成されます。

### 2. .vsix ファイルをビルド

```bash
npm run package
```

`go-path-jumper-<version>.vsix` が生成されます。ビルド前に `npm run compile` が自動実行されます。

### 3. Open VSX に公開

```bash
npm run publish:ovsx -- <ファイル名>.vsix -p <アクセストークン>
```

### アクセストークンの取得方法

1. https://open-vsx.org にGitHubアカウントでログイン
2. プロフィール設定 →「Access Tokens」→「Generate New Token」
3. トークンをコピーして安全な場所に保管（再表示不可）

### 公開先

- **Open VSX**: https://open-vsx.org/extension/cr4ne89/go-path-jumper
- **GitHub**: https://github.com/cr4ne89/go-path-jumper
