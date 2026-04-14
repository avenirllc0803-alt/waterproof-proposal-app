# Veo 3.1 プロンプティングガイド

## モデル情報

| モデル | ID | ステータス |
|--------|-----|-----------|
| Veo 3.1 Generate | `veo-3.1-generate-001` | GA |
| Veo 3.1 Fast Generate | `veo-3.1-fast-generate-001` | GA |
| Veo 3.1 Lite Generate | `veo-3.1-lite-generate-001` | Preview |

## 技術仕様

| 項目 | Generate / Fast | Lite |
|------|----------------|------|
| 解像度 | 720p, 1080p, 4K(preview) | 720p, 1080p |
| アスペクト比 | 16:9, 9:16 | 16:9, 9:16 |
| 最大尺 | 8秒（4/6/8秒から選択） | 同左 |
| フレームレート | 24 FPS | 24 FPS |
| 出力形式 | MP4 | MP4 |
| 1リクエスト最大出力 | 4本 | 4本 |
| 入力画像上限 | 20MB | 20MB |

対応機能: テキスト→動画、画像→動画、音声生成、動画延長(preview)、参照画像、C2PA透かし

## プロンプト構文テンプレート

```
[Cinematography] + [Subject] + [Action] + [Context/Setting] + [Style & Audio]
```

- **Cinematography**: ショットタイプ + カメラ移動 + レンズ/フォーカス
- **Subject**: 具体的な外見特徴を持つ被写体
- **Action**: 1つの明確な動作を具体的動詞で
- **Context/Setting**: 場所・時間帯・天候・環境
- **Style & Audio**: 映像スタイル + ライティング + 音声（台詞/SFX/環境音）

オプション: Duration(4/6/8s), Aspect Ratio, Negative Prompt, Reference Images

### 音声の3カテゴリ
- 台詞: `A woman says, "We have to leave now."`
- SFX: `SFX: Thunder rumbles in the distance`
- 環境音: `Ambient noise: The low hum of a starship bridge`

### タイムスタンプ構文（マルチショット）
```
[00:00–00:02] Medium shot...
[00:02–00:04] Reverse shot...
[00:04–00:06] Tracking shot...
```

## プロンプト例

### 例1: シネマティックポートレート
```
A hyper-realistic, cinematic portrait of a wise, androgynous shaman of indeterminate age. Their weathered skin is etched with intricate, bioluminescent circuit-like tattoos that pulse with a soft, cyan light. They are draped in ceremonial robes woven from dark moss and shimmering, metallic fiber-optic threads. In one hand, they hold a gnarled wooden staff entwined with glowing energy conduits and topped with a floating, crystalline artifact.
```

### 例2: 台詞付きシーン
```
A medium shot in a dimly lit interrogation room. The seasoned detective says: Your story has holes. The nervous informant, sweating under a single bare bulb, replies: I'm telling you everything I know. The only other sounds are the slow, rhythmic ticking of a wall clock and the faint sound of rain against the window.
```

### 例3: B-Roll実務プロンプト
```
Wide to medium office shot; slow dolly left; Subjects: people working on an office; Action: markers write keywords while a laptop screen scrolls code; Context: sunlit open office, plants, city view; Style: documentary, natural skin tones; Audio: Ambient office murmur, marker squeak, soft keyboard; Duration: 8 s; AR: 16:9; Negative: no readable proprietary code, no talking heads.
```

## 制限事項・禁止事項

- 1クリップに複数の複雑なアクションを詰め込まない（1ショット1動作）
- 曖昧な記述を避ける（"experiences a rainy moment" → 具体的な動作に）
- Duration・Aspect Ratioの指定を省略しない
- ネガティブプロンプトで "no" "don't" は使わない → 除外対象を描写的に記述
- スタイル参照画像は非対応（キャラ/小道具の参照画像のみ）
- 最大8秒の制約があるため、タイムラプス表現には不向き
- 全出力にSynthID透かしが付与される（除去不可）
- 安全フィルターにより不適切プロンプトはブロックされる
