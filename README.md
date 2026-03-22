# Go Path Jumper

[![Open VSX Version](https://img.shields.io/open-vsx/v/cr4ne89/go-path-jumper)](https://open-vsx.org/extension/cr4ne89/go-path-jumper)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/cr4ne89/go-path-jumper)](https://open-vsx.org/extension/cr4ne89/go-path-jumper)
[![Open VSX Rating](https://img.shields.io/open-vsx/rating/cr4ne89/go-path-jumper)](https://open-vsx.org/extension/cr4ne89/go-path-jumper)

Go Path Jumper は、コード内に記載されたファイルのパスから、対応するファイルに素早くジャンプできる VS Code 拡張機能です。

## Feature

- **Command + Click** でコード内のファイルパスから直接ジャンプ（パス部分に常時下線表示、ホバーでジャンプ先パスを確認可能）
- **GPJ: Find File References** でファイルパスを参照している箇所を表示
- **GPJ: Check File Paths** で存在しないファイルパスを検出し警告を表示

## Installation

1. VSCode を開き、拡張機能タブをクリックします。
2. 検索バーに「**Go Path Jumper**」と入力し、一覧から選択します。
3. **[インストール]** ボタンをクリックします。

または、[Open VSX Registry](https://open-vsx.org/extension/cr4ne89/go-path-jumper) から直接ダウンロードできます。

## Usage

#### パスから対象のファイルにジャンプする

1. 対象のファイルのパスには自動的に下線が表示されます。
2. ホバーするとジャンプ先のファイルパスを確認できます。
3. クリックすると対応するファイルが開きます。

#### パスが記載されている箇所を探す

1. 対象のファイルを開き、右クリックで **GPJ: Find File References** をクリックします。
2. Explorer > GO PATH JUMPER に参照元のファイルが表示されます。

#### 存在しないファイルパスをチェックする

1. エディタ上で右クリックし、**GPJ: Check File Paths** をクリックします。
2. 存在しないファイルパスがある場合、問題パネルに警告が表示されます。

## Setup

### 基本設定

VSCode の設定ファイル（settings.json）を開き、`go-path-jumper.settings` に設定を追加します。

```json
"go-path-jumper.settings": [
  {
    "sourceExt": [".go"],
    "basePath": "/",
    "targetExt": ".csv",
    "delimiter": "/",
    "regex": "\"([^\"]+)\""
  }
]
```

### 設定プロパティ

- **`sourceExt`** (必須)
  - **型**: `string[]`
  - **説明**: 検索対象のファイル拡張子を指定します（例: `[".go"]`、`[".go", ".ts"]`）。

- **`regex`** (必須)
  - **型**: `string`
  - **説明**: ファイルパスを抽出するための正規表現パターン（キャプチャグループでパスを取得）。

- **`basePath`**
  - **デフォルト**: `/`
  - **説明**: ファイルのベースパス。テンプレート変数 `${N}` を使ってキャプチャグループの値を埋め込めます（例: `/csv/${1}/templates/`）。

- **`targetExt`**
  - **デフォルト**: `""`
  - **説明**: ファイルの拡張子を指定します。

- **`delimiter`**
  - **デフォルト**: `/`
  - **説明**: ファイルパスの区切り文字。パスの正規化に使用されます。

- **`pathCapture`**
  - **デフォルト**: `1`
  - **説明**: ファイルパスとして使用する `regex` のキャプチャグループ番号。

- **`fallbackPath`**
  - **型**: `string`（オプション）
  - **説明**: `basePath` のテンプレート変数が解決できない場合のフォールバック先。ジャンプ時にファイルが見つからない場合のフォールバックとしても機能します。

- **`checkFilePaths`**
  - **デフォルト**: `true`
  - **説明**: `false` に設定すると、この設定を GPJ: Check File Paths の対象から除外します。

### 除外パス設定

```json
"go-path-jumper.excludePaths": ["**/vendor/**", "**/generated/**"]
```

検索対象から除外するパスの glob パターンを指定できます。`node_modules`、`.git`、`out`、`dist` はデフォルトで除外されます。

## License

MIT
