# Quick Anki Adder - Anki 単語追加を、かつてない速さで。

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Quick Anki Adder**は、Web ブラウジング中に気になった単語を、AI の力を借りて瞬時にリッチな Anki カードとして登録できる Chrome 拡張機能です。もう、単語をコピーし、Anki を開き、手動で入力する手間はありません。

![アプリの動作イメージ](https://github.com/user-attachments/assets/bf32d935-6063-4e52-bb1d-757b569d09c1)
_(画像は設定画面のイメージです)_

---

## ✨ 主な機能

- **コンテキストメニュー連携**: Web ページ上で単語を選択し、右クリックするだけで Anki に追加できます。
- **AI によるカード自動生成**: OpenAI API (GPT-3.5-turbo) を利用し、単語の意味、発音記号、例文、類義語、豆知識などを自動で生成し、カードの裏面に設定します。
- **メディア自動取得**: 単語の発音音声と関連画像を自動で取得し、カードに添付します。
- **ポップアップからの追加**: ツールバーアイコンからポップアップを開き、単語を手入力して追加することも可能です。
- **柔軟なカスタマイズ**:
  - 登録先の Anki デッキや、自動で付与するタグを自由に設定できます。
  - ユーザー自身の OpenAI API キーを設定して使用することが可能です。
- **Anki 接続ステータス表示**: Anki および AnkiConnect アドオンとの接続状況を、拡張機能アイコンのバッジ（ON/OFF）でリアルタイムに確認できます。
- **重複チェック**: 同じ単語が既に指定のデッキに存在する場合、重複して登録するのを防ぎます。

## 🚀 インストール

### 1. Chrome ウェブストアから（推奨）

_(現在準備中です。公開後にリンクを設置します)_

### 2. 開発者としてソースからインストール

1.  **リポジトリをクローン**:

    ```bash
    git clone https://github.com/Jagashira/Quick-Anki.git
    cd Quick-Anki
    ```

2.  **依存パッケージをインストール**:
    このプロジェクトでは `pnpm` を使用しています。

    ```bash
    pnpm install
    ```

3.  **拡張機能をビルド**:

    ```bash
    pnpm run build
    ```

    プロジェクトルートに `dist` ディレクトリが生成されます。

4.  **Chrome に読み込む**:
    - Chrome で `chrome://extensions` を開きます。
    - 右上の「デベロッパーモード」をオンにします。
    - 「パッケージ化されていない拡張機能を読み込む」をクリックし、生成された `dist` ディレクトリを選択します。

## 使い方

### 準備

1.  PC に[Anki](https://apps.ankiweb.net/)デスクトップアプリをインストールします。
2.  Anki に[AnkiConnect](https://ankiweb.net/shared/info/2055492159)アドオンをインストールします。
3.  **Anki アプリを起動した状態**でブラウジングを行ってください。

### 設定

1.  Chrome のツールバーにある本拡張機能のアイコンを右クリックし、「オプション」を選択して設定ページを開きます。
2.  **デフォルトの登録先デッキ**や**タグ**を設定します。
3.  （任意）ご自身の**OpenAI API キー**を設定してください。キーはブラウザ内に安全に保存されます。

### 単語の追加

- **方法 1（推奨）**: Web ページ上の単語を選択し、右クリックメニューから「『(選択した単語)』を Anki に追加 」を選択します。
- **方法 2**: ツールバーのアイコンをクリックしてポップアップを開き、単語を入力して追加します。

## 🛠️ 開発

開発に参加、または自身でカスタマイズしたい場合は、以下の手順に従ってください。

1.  **セットアップ**:

    - Node.js v18 以上と `pnpm` が必要です。
    - リポジトリをクローンし、`pnpm install` を実行します。

2.  **開発サーバーの起動**:

    ```bash
    pnpm run dev
    ```

    これにより、ファイルの変更が自動的にビルドされ、拡張機能に反映されます。（`dist` ディレクトリを Chrome に読み込んだ状態で、拡張機能の管理ページでリロードしてください）

## 💻 使用技術

- **拡張機能**:
  - [React](https://react.dev/) 19
  - [TypeScript](https://www.typescriptlang.org/)
  - [Vite](https://vitejs.dev/) + [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin)
  - [Tailwind CSS](https://tailwindcss.com/)
- **API サーバー (Next.js)**:
  - [Next.js](https://nextjs.org/) App Router
  - [OpenAI API](https://platform.openai.com/docs/api-reference)
  - [Zod](https://zod.dev/)
- **連携**:
  - [AnkiConnect](https://github.com/FooSoft/anki-connect)

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。
