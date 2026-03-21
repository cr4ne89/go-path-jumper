# Go Path Jumper

[![Open VSX Version](https://img.shields.io/open-vsx/v/cr4ne89/go-path-jumper)](https://open-vsx.org/extension/cr4ne89/go-path-jumper)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/cr4ne89/go-path-jumper)](https://open-vsx.org/extension/cr4ne89/go-path-jumper)
[![Open VSX Rating](https://img.shields.io/open-vsx/rating/cr4ne89/go-path-jumper)](https://open-vsx.org/extension/cr4ne89/go-path-jumper)

Go Path Jumper は、コード内に記載されたファイルのパスから、対応するファイルに素早くジャンプできる VS Code 拡張機能です。

## Feature

- **Command + Click** でコード内のファイルパスから直接ジャンプ
- **GPJ: Find File References** でファイルパスを参照している箇所を表示
- **GPJ: Check File Paths** で存在しないファイルパスを検出し警告を表示

## Installation

1. VSCode を開き、拡張機能タブをクリックします。
2. 検索バーに「**Go Path Jumper**」と入力し、一覧から選択します。
3. **[インストール]** ボタンをクリックします。

または、[Open VSX Registry](https://open-vsx.org/extension/cr4ne89/go-path-jumper) から直接ダウンロードできます。

## Usage

#### パスから対象のファイルにジャンプする

1. 対象のファイルのパスが記載された部分にカーソルを合わせます。
2. **Command (Mac)** または **Ctrl (Windows/Linux)** キーを押しながら、ファイルのパスをクリックします。
3. 対応するファイルが開きます。

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
    "language": "go",
    "basePath": "/",
    "fileExtension": ".csv",
    "delimiter": "/",
    "regexPattern": "\".*\"",
    "regexMatchPattern": "\"([^\"]+)\""
  }
]
```

### 設定プロパティ

- **`language`** (必須)
  - **型**: `string | string[]`
  - **説明**: 対象言語を指定します。配列で複数言語を指定できます（例: `["go", "typescript"]`）。

- **`regexPattern`** (必須)
  - **型**: `string`
  - **説明**: ファイルパスを検出するための正規表現パターン（ワード範囲の判定に使用）。

- **`regexMatchPattern`** (必須)
  - **型**: `string`
  - **説明**: ファイルパスを抽出するための正規表現パターン（キャプチャグループでパスを取得）。

- **`basePath`**
  - **デフォルト**: `/`
  - **説明**: ファイルのベースパス。テンプレート変数 `${N}` を使ってキャプチャグループの値を埋め込めます（例: `/csv/${1}/templates/`）。

- **`fileExtension`**
  - **デフォルト**: `""`
  - **説明**: ファイルの拡張子を指定します。

- **`delimiter`**
  - **デフォルト**: `/`
  - **説明**: ファイルパスの区切り文字。パスの正規化に使用されます。

- **`pathCapture`**
  - **デフォルト**: `1`
  - **説明**: ファイルパスとして使用する `regexMatchPattern` のキャプチャグループ番号。

- **`defaultBasePath`**
  - **型**: `string`（オプション）
  - **説明**: `basePath` のテンプレート変数が解決できない場合のフォールバック先。ジャンプ時にファイルが見つからない場合のフォールバックとしても機能します。

- **`sourceExtensions`**
  - **型**: `string[]`（オプション）
  - **説明**: 検索対象のファイル拡張子を直接指定します（例: `[".go"]`）。省略時は `language` から自動検出します。

- **`lint`**
  - **デフォルト**: `true`
  - **説明**: `false` に設定すると、この設定を GPJ: Check File Paths の対象から除外します。

### 除外パス設定

```json
"go-path-jumper.excludePaths": ["**/vendor/**", "**/generated/**"]
```

検索対象から除外するパスの glob パターンを指定できます。`node_modules`、`.git`、`out`、`dist` はデフォルトで除外されます。

## License

MIT
