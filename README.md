# CertificateOfDataScientist 受講者演習サイト

**Version: V2**

このフォルダーは「ビジネスパーソンのためのデータリテラシー入門」の受講者向け演習サイト V3 です。

## V3 の主な変更点
- 1ページ構成から複数ページ構成へ変更
- Excel風データ操作画面を追加
- テキストの章・ページに対応した確認問題を追加
- SQL Labを追加
- GROUP BYの処理を「並べ替え → 色分け → 集計」の順に可視化
- Python補助演習ページを追加

## ページ構成
- `index.html` : 章別ポータル
- `workbook.html` : Excel風データ操作
- `quiz.html` : 章別確認問題
- `sql.html` : SQL Lab
- `python.html` : Python補助演習

## データ
`data/theme_park_wait_times_raw.csv` は研修用に生成した架空のテーマパークデータです。

## Cloudflare Pages
静的サイトとして公開できます。
- Framework preset: None
- Build command: 空欄
- Build output directory: `/`

## Version History
| Version | 内容 |
|---|---|
| V1 | 初期版。1ページ型の受講者サイト |
| **V2** | **複数ページ化、Excel風UI、テキスト連動問題、SQL Labを追加** |
