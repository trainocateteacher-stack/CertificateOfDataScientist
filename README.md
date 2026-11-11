# CertificateOfDataScientist 受講者ページ

テーマパークの架空データを使う、データリテラシー研修用の静的Webサイトです。

## Cloudflare Pages 設定

- Production branch: `main`
- Framework preset: `None`
- Build command: 空欄
- Build output directory: `/`
- Root directory: `/`

## 公開方法

このフォルダーの中身をGitHubリポジトリのルートへアップロードしてコミットします。Cloudflare PagesとのGit連携後は、`main`へのコミットで自動的に再公開されます。

## 内容

- Excel風のデータ閲覧、フィルター、並べ替え
- 平均、中央値、平均満足度の自動計算
- DS検定風の確認問題
- SQL穴埋め演習
- Pythonコード例
- 最終改善提案テンプレート
- CSVおよびExcel教材のダウンロード

## 注意

- データは研修用に生成した架空データです。
- Zoom URL、受講者情報、顧客固有情報は配置しないでください。
- ローカルで `index.html` を直接開くと、ブラウザーの制約でCSVを読み込めない場合があります。Cloudflare Pages上、またはローカルWebサーバーで確認してください。
