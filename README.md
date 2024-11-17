# Go Path Jumper

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/cr4ne89.go-path-jumper)](https://marketplace.visualstudio.com/items?itemName=cr4ne89.go-path-jumper)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/cr4ne89.go-path-jumper)](https://marketplace.visualstudio.com/items?itemName=cr4ne89.go-path-jumper)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/cr4ne89.go-path-jumper)](https://marketplace.visualstudio.com/items?itemName=cr4ne89.go-path-jumper)

Go Path Jumper は、コード内に記載されたファイルのパスから、対応するファイルに素早くジャンプできる拡張機能です。

## Feature

- **Command + Click** でコード内のファイルパスから直接ジャンプ
- **GPJ: Find File References** でファイルパスを参照している箇所を表示

## Installation

1. VSCode を開き、拡張機能タブをクリックします。
2. 検索バーに「**Go Path Jumper**」と入力し、一覧から選択します。
3. **[インストール]** ボタンをクリックします。

または、[Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=cr4ne89.go-path-jumper) から直接ダウンロードできます。

## Usage

#### パスから対象のファイルにジャンプする

1. 対象のファイルのパスが記載された部分にカーソルを合わせます。
2. **Command (Mac)** または **Ctrl (Windows/Linux)** キーを押しながら、ファイルのパスをクリックします。
3. 対応するファイルが開きます。

#### パスが記載されている箇所を探す

1. 対象のファイルを開き、右クリックで **GPJ: Find File References** をクリックします。
2. Explore > GO PATH JUMPER に参照元のファイルが表示されます。

## Setup

1. VSCode の設定ファイル（settings.json）を開きます。
2. 以下のように go-path-jumper.settings に設定を追加します。

```
"go-path-jumper.settings": [
  {
    "language": "go",
    "basePath": "/",
    "fileExtension": ".csv",
    "delimiter": "/",
    "regexPattern": "\".*\"",
    "regexMatchPattern": "\"([^\"]+)\""
  },
]
```

- **`language`**

  - **デフォルト**: `go`
  - **説明**: ファイルの対象言語を指定します。

- **`basePath`**

  - **デフォルト**: `/`
  - **説明**: ファイルのベースパスを指定します。

- **`fileExtension`**

  - **デフォルト**: `.csv`
  - **説明**: ファイルの拡張子を指定します。

- **`delimiter`**

  - **デフォルト**: `/`
  - **説明**: ファイルパスの区切り文字を設定します。

- **`regexPattern`**

  - **デフォルト**: `\".*\"`
  - **説明**: ファイルパスを検出するための正規表現パターンを指定します。

- **`regexMatchPattern`**
  - **デフォルト**: `\"([^\"]+)\"`
  - **説明**: ファイルパスを抽出するための正規表現パターンを指定します。
