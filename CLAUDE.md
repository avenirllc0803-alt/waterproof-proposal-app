# waterproof-proposal-app

防水工事の見積書・請求書・提案書を作成・共有するWebアプリ。

## 技術スタック
- **フレームワーク**: Next.js 14 (App Router, Static Export)
- **ホスティング**: Cloudflare Pages（`git push` で自動デプロイ）
- **サーバーサイド**: Cloudflare Pages Functions (`functions/api/`)
- **スタイル**: Tailwind CSS 3 + PostCSS
- **PDF生成**: html2canvas + jsPDF（クライアントサイド）
- **画像生成**: Google Imagen 4（Pages Function経由プロキシ）
- **言語**: TypeScript, React 18

## ビルド & 開発
```bash
npm run dev          # ローカル開発（Pages Functionは動かない）
npm run build        # Static Export (out/)
wrangler pages dev   # Pages Function込みのローカルテスト
```

## デプロイ
- `git push origin main` → Cloudflare Pagesが自動ビルド＆デプロイ
- 本番URL: waterproof-proposal-app.pages.dev

## ディレクトリ構成
```
src/
  app/
    page.tsx           # トップ
    edit/              # 編集画面
    preview/           # 提案書プレビュー
    estimate/          # 見積書
    invoice/           # 請求書
    proposal/          # 提案書
  components/          # 共通コンポーネント（SharePdfModal, AnnotationCanvas等）
  data/                # デモデータ
  lib/                 # ユーティリティ（demoImages等）
  types/               # 型定義
functions/
  api/
    generate-image.ts  # Imagen 4画像生成プロキシ
    send-email.ts      # Resend APIメール送信（将来用、DNS設定待ち）
public/
  demo/                # 事前生成済みデモ画像
docs/
  handover/            # セッション引き継ぎ申し送り書（アーカイブ）
```

## 環境変数（Cloudflare Pages シークレット）
- `GOOGLE_AI_API_KEY` — Google AI API キー（Imagen 4 / Gemini用）

## 重要な設計判断
- `next.config.js` で `output: 'export'` — 完全静的サイト、SSR/APIルートなし
- サーバーサイド処理はCloudflare Pages Functionsで実装
- PDF共有はWeb Share API優先、mailto:フォールバック（ファイル添付不可）
- `tsconfig.json` で `functions/` は除外（Cloudflare Workers用の別ランタイム）
