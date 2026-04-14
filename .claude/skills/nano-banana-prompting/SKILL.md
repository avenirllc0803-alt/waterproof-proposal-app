# Nano Banana プロンプティングガイド

## モデル情報

| モデル | ID | 特徴 |
|--------|-----|------|
| Nano Banana Pro | `gemini-3-pro-image-preview` | 最高品質、テキスト精度高、思考プロセス有 |
| Nano Banana 2 | `gemini-3.1-flash-image-preview` | 高速（2秒未満）、Pro品質をFlash速度で |
| Nano Banana (初代) | `gemini-2.5-flash-image` | 旧モデル、日本語テキスト精度低め |

Pro=本番アセット・広告・長文テキスト描画、2=高速イテレーション・日常使用

## 技術仕様

| 項目 | Pro | 2 |
|------|-----|---|
| 解像度 | 1K, 2K, 4K | 512, 1K, 2K, 4K |
| 入力トークン | 65,536 | 131,072 |
| 出力トークン | 32,768 | 32,768 |
| 参照画像（キャラ） | 最大5体 | 最大4体 |
| 参照画像（オブジェクト） | 最大14枚（6枚が高忠実度） | 最大14枚（10枚が高忠実度） |
| Thinking | 常時有効（無効化不可） | minimal/high切替可能 |
| 検索グラウンディング | Google検索対応 | 画像検索グラウンディング対応 |

### アスペクト比（全モデル共通）
1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9, 1:4, 4:1, 1:8, 8:1

## プロンプト構文テンプレート（生成用）

```
[Style/medium] of [specific subject with details] in [setting],
[action or pose], [lighting description], [mood/atmosphere],
[camera angle/composition], [additional details].
[Purpose context if relevant.]
```

要素: 被写体(素材感まで) + ライティング(方向・種類) + カメラ(ショット・レンズ) + テキスト(引用符+フォント+色+配置) + 用途コンテキスト

## プロンプト構文テンプレート（編集用）

マスキング不要。自然言語でセマンティックに指示する。80%正しければ再生成せず会話的に微調整。

```
[変更内容を具体的に]. Keep [維持する要素] identical.
[新しい要素の詳細指定].
```

例: `Turn this scene into winter. Keep house architecture identical, but add snow to roof and yard, changing lighting to cold, overcast afternoon.`

## プロンプト例

### 例1: プロダクトフォトグラフィー
```
Flat lay of artisanal coffee beans spilling from matte black ceramic cup onto weathered oak table, soft directional window light from upper left, warm earth tones with deep shadows, shot from directly above, styled for premium coffee brand's Instagram.
```

### 例2: シネマティックポートレート
```
Cinematic medium close-up of jazz musician mid-performance, eyes closed, sweat glistening under warm amber stage lighting, shallow depth of field with bokeh from string lights, shot on 35mm film with natural grain.
```

### 例3: テキスト入りデザイン
```
Vintage concert poster with text 'MIDNIGHT REVERIE' in bold art deco typography at top, silhouette of saxophone player against deep indigo night sky with full moon, 'Live at The Blue Note — March 15, 2026' in smaller elegant serif at bottom, gold and navy palette.
```

## 制限事項・禁止事項

### やってはいけないプロンプトパターン
- **タグスープ禁止**: `dog, park, 4k, realistic` → 自然言語の文章で書く
- **ジェネリック修飾語不要**: `4k, trending on artstation, masterpiece` は効果なし
- **曖昧な主語禁止**: "a person" ではなく具体的特徴を書く
- **ムード/ライティング省略禁止**: 雰囲気と照明は必須
- **矛盾する指示禁止**: 互いに打ち消し合う記述を入れない
- **テキスト指示は詳細に**: フォント種類・色・配置を明示

### 技術的制限
- 透明背景非対応（ステッカーは白背景指定）/ SynthID透かし除去不可
- 小さい顔・正確なスペル・細部で品質低下の可能性あり
- Thinkingトークンは `includeThoughts` 設定に関係なく課金される
- 画像検索グラウンディングで人物検索は不可
