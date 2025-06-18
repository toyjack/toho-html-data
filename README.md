# 東方學デジタル図書館 IIIF システム使用ガイド

本文書では、IIIF（International Image Interoperability Framework）マニフェスト生成システムの使用方法について説明します。

## コアワークフロー

### 完全データ処理フロー

1. **HTML解析** (`index.ts`) - HTMLメニューファイルから書籍メタデータと構造を抽出
2. **IIIF生成** (`generate-iiif-manifests.ts`) - 解析データに基づいてIIIFマニフェストを作成
3. **インデックス生成** (`update-index.ts`) - 閲覧可能なHTMLインターフェースを作成
4. **検証** (`validate-manifests.ts`) - 生成されたIIIFマニフェストを検証
5. **データベーススキーマ** (`generate-prisma-schema.ts`) - Prismaデータベーススキーマを生成

## 利用可能なスクリプト

### 1. HTMLデータ解析 (`index.ts`)

**用途**: HTMLファイルから書籍メタデータと構造情報を抽出し、`toho-data.json`を生成します。

**実行方法**:
```bash
# HTMLファイルを解析して書籍構造を抽出
bun run index.ts
# または
bun run start
```

### 2. IIIFマニフェスト生成 (`generate-iiif-manifests.ts`)

**用途**: `toho-data.json`データファイルからIIIF Presentation API 3.0準拠のマニフェストファイルを生成します。

**実行方法**:
```bash
bun run generate-manifests
```

### 3. インデックスHTML更新 (`update-index.ts`)

**用途**: `./docs/index.html`ファイルを動的に生成・更新し、すべてのIIIFマニフェストの概要を表示します。

**実行方法**:
```bash
bun run update-index
```

### 4. IIIFマニフェスト検証 (`validate-manifests.ts`)

**用途**: 生成されたIIIFマニフェストファイルがIIIF Presentation API 3.0仕様に準拠しているかを検証します。

**実行方法**:
```bash
bun run validate-manifests
```

## 推奨ワークフロー

```bash
# 1. HTMLファイルを解析して書籍構造を抽出（toho-data.jsonを生成）
bun run index.ts

# 2. IIIFマニフェストを生成
bun run generate-manifests

# 3. 生成されたマニフェストを検証
bun run validate-manifests

# 4. HTMLインデックスインターフェースを更新
bun run update-index
```

## データベース管理（Prisma）

```bash
# Prismaスキーマと設定ファイルを生成
bun run generate-prisma-schema

# データベースを初期化（.env設定後）
bun run db:generate
bun run db:push
bun run db:seed

# データベース管理
bun run db:studio
bun run db:reset
```

## ファイル構成

### 入力ファイル
- `html/` - 書籍メタデータとナビゲーション情報を含む元のHTMLファイル
- `toho-data.json` - 解析された書籍データ（index.tsにより生成）

### 生成される出力
- `docs/` - IIIFマニフェストファイル（.json）と閲覧可能なindex.html
- 各書籍に対応する`{BookID}.json`マニフェストファイルが生成される

### ディレクトリ構造:
```
docs/
├── A001.json, A002.json, ... （各種マニフェストファイル）
├── collection.json （IIIFコレクションインデックス）
├── index.html （動的に生成されるHTMLインターフェース）
└── README.md （マニフェスト文書）
```

## スクリプト機能

### `update-index.ts`の機能:
- ✅ すべてのマニフェストファイルを自動スキャン
- ✅ 中国語と英語のタイトルを解析
- ✅ 王朝、著者、巻数などのメタデータを抽出
- ✅ ファイルサイズを計算して形式化表示
- ✅ レスポンシブグリッドレイアウト
- ✅ 美しいモダンUIデザイン
- ✅ 最終更新時刻を表示
- ✅ IIIFコレクションリンクを提供
- ✅ 使用説明と外部リンクを含む

### 処理されるメタデータフィールド:
- **タイトル**: `label.zh[0]`または`label.ja[0]`
- **英語タイトル**: `label.en[0]`
- **王朝**: メタデータから「Dynasty」または「朝代」を抽出
- **著者**: メタデータから「Author(s)」または「作者」を抽出
- **巻数**: メタデータから「Volumes」または「卷數」を抽出
- **ページ数**: `items.length`（キャンバス数）
- **概要**: `summary.zh[0]`または`summary.en[0]`

## 重要な設定

### IIIF設定（generate-iiif-manifests.ts:13-14）

```typescript
const BASE_URL = "https://toho-digital-library.zinbun.kyoto-u.ac.jp";
const IMAGE_SERVICE_BASE_URL = "https://iiif.toyjack.net/iiif";
```

### 画像サービス統合
システムは画像がIIIF画像APIサーバーを通じて提供されることを前提としています。画像URLは以下のパターンに従います：
`{IMAGE_SERVICE_BASE_URL}/{BookID}/{VolumeID}_{PageNumber}.jpg`

## トラブルシューティング

スクリプトに問題が発生した場合：

1. **依存関係の確認**: bunとTypeScriptがインストールされていることを確認
2. **ファイルパスの確認**: 正しいディレクトリでスクリプトを実行していることを確認
3. **権限の確認**: `./docs/`ディレクトリへの書き込み権限があることを確認
4. **JSON形式の確認**: 検証スクリプトを使用してマニフェストファイルをチェック

## IIIFマニフェスト構造

生成されるマニフェストはIIIF Presentation API 3.0仕様に準拠しています：

- **多言語ラベル**: 中国語（zh）、日本語（ja）、英語（en）
- **閲覧方向**: 右から左（伝統的な中国語テキスト）
- **メタデータフィールド**: 王朝、著者、出版情報、巻数
- **キャンバス作成**: ページごとに適切な寸法を持つキャンバス
- **画像サービス統合**: IIIFイメージサーバーへのリンク

## 中国語テキスト処理

### 特殊処理ロジック
- **数字変換**: 中国語数字（一二三四五）をアラビア数字に変換
- **王朝抽出**: 説明文から中国語王朝名を識別
- **著者解析**: 「某某撰」、「某某輯」などのパターンを使用して著者を抽出
- **巻数解析**: 複雑な巻数番号システムを処理

## 開発時の注意事項

### 新機能を追加する際
1. 既存のデータフローに従う：HTML → 解析データ → IIIF → 検証
2. データ構造を変更する際はすべての関連インターフェースを更新
3. マニフェスト生成後に検証スクリプトでテスト
4. 構造変更後にHTMLインデックスを更新

### 一般的なタスク
- **メタデータフィールドの追加**: BookEntryインターフェースとindex.tsの解析ロジックを更新
- **IIIF出力の変更**: generate-iiif-manifests.tsのgenerateManifest()を編集
- **検証ルールの変更**: validate-manifests.tsの検証メソッドを更新
- **HTMLインターフェースの変更**: update-index.tsのgenerateHTML()を変更

## 出力例

`bun run update-index`実行後の出力例：
```
🔄 Updating index.html for IIIF Manifests...
📄 Found 318 manifest files
✅ Successfully parsed 318 manifests
📝 Updated docs\index.html
✨ Index HTML generation completed!

📊 Summary:
  Total manifests: 318
  Total pages: 113,984
  Total volumes: 0
```

## 関連リソース

- [IIIF Presentation API 3.0](https://iiif.io/api/presentation/3.0/)
- [Mirador IIIF Viewer](https://projectmirador.org/)
- [Universal Viewer](https://universalviewer.io/)
- [IIIF Validator](https://presentation-validator.iiif.io/)