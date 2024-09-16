# Go Path Jumper

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/cr4ne89.go-path-jumper)](https://marketplace.visualstudio.com/items?itemName=cr4ne89.go-path-jumper)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/cr4ne89.go-path-jumper)](https://marketplace.visualstudio.com/items?itemName=cr4ne89.go-path-jumper)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/cr4ne89.go-path-jumper)](https://marketplace.visualstudio.com/items?itemName=cr4ne89.go-path-jumper)

Go Path Jumper は、Go 言語のコード内に記載されたファイルのパスから、対応するファイルに素早くジャンプできる拡張機能です。

## Feature

- **Command + Click** でコード内のファイルパスから直接ジャンプ
- ユーザー設定可能なベースパス、拡張子、正規表現パターン

## Installation

1. VSCode を開き、拡張機能タブをクリックします。
2. 検索バーに「**Go Path Jumper**」と入力し、一覧から選択します。
3. **[インストール]** ボタンをクリックします。

または、[Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=cr4ne89.go-path-jumper) から直接ダウンロードできます。

## Usage

1. Go ファイルを開き、対象のファイルのパスが記載された部分にカーソルを合わせます。
2. **Command (Mac)** または **Ctrl (Windows/Linux)** キーを押しながら、ファイルのパスをクリックします。
3. 対応するファイルが開きます。

## Setup

- **`go-path-jumper.BasePath`**

  - **デフォルト**: `/`
  - **説明**: ファイルのベースパスを指定します。

- **`go-path-jumper.FileExtension`**

  - **デフォルト**: `.csv`
  - **説明**: ファイルの拡張子を指定します。

- **`go-path-jumper.RegexPattern`**

  - **デフォルト**: `\".*\"`
  - **説明**: ファイルパスを検出するための正規表現パターンを指定します。

- **`go-path-jumper.RegexMatchPattern`**
  - **デフォルト**: `\"([^\"]+)\"`
  - **説明**: ファイルパスを抽出するための正規表現パターンを指定します。
