import { GoogleGenerativeAI } from '@google/generative-ai'

// Gemini APIクライアントを初期化
export function createGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey)
}

// システムプロンプト
export const SYSTEM_PROMPT = `# Role
あなたは、孤独な魂に寄り添う、世界で一匹だけの「ソウルメイト（守護動物）」を幻視し、
その存在に「名前」と「物語」を与える創造者です。

# Guideline
Step A: 核となるコンセプトの決定
- 詩的な言葉と動物を組み合わせる
- 動物: 哺乳類、水生生物（爬虫類・昆虫はNG）
- 幻想的で神秘的な特徴を大幅に付与

Step B: 固有名詞（名前）の決定
- カタカナ、またはひらがな
- 響きが良く、感情移入しやすい

Step C: キャラクター設定の定義
- 性格: 孤独な魂に寄り添う
- 口調: サンプルセリフ付き

Step D: 画像生成プロンプトの作成
- 英語プロンプト
- 幻想的特徴を強調

# Output Format
## ソウルメイトのプロフィール
**コンセプト:** [詩的な言葉 + 動物]
**名前:** [固有名詞]
**性格:** [性格描写]
**口調:** [口調特徴とサンプルセリフ]

## 画像生成プロンプト
\`[英語プロンプト], Kawaii illustration, simple vector art style, thick rounded outlines, 
flat pastel colors, no shading, minimalist, mystical and healing atmosphere, gentle soul, 
storybook style, soft expression, no text, no words, no letters, no signature, no watermark\``

// スタイル固定部分
export const IMAGE_STYLE_SUFFIX = ', Kawaii illustration, simple vector art style, thick rounded outlines, flat pastel colors, no shading, minimalist, mystical and healing atmosphere, gentle soul, storybook style, soft expression, no text, no words, no letters, no signature, no watermark'

// プロフィール生成
export async function generateProfile(
  apiKey: string,
  animalEn: string,
  animalJa: string,
  name: string
) {
  const genAI = createGeminiClient(apiKey)
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 1.8,
      maxOutputTokens: 500,
      topP: 0.98,
      topK: 50,
    }
  })

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
  const prompt = `${SYSTEM_PROMPT}

【必須指定】
ベースとなる動物: ${animalEn} (${animalJa})
名前: ${name}

ユニークID: ${uniqueId}`

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()
  
  return parseProfileResponse(text)
}

// プロフィールレスポンスをパース
function parseProfileResponse(text: string) {
  // コンセプトを抽出
  const conceptMatch = text.match(/\*\*コンセプト:\*\*\s*(.+)/)
  const concept = conceptMatch ? conceptMatch[1].trim() : ''

  // 名前を抽出
  const nameMatch = text.match(/\*\*名前:\*\*\s*(.+)/)
  const name = nameMatch ? nameMatch[1].trim() : ''

  // 性格を抽出
  const personalityMatch = text.match(/\*\*性格:\*\*\s*(.+?)(?=\*\*|$)/s)
  const personality = personalityMatch ? personalityMatch[1].trim() : ''

  // 口調を抽出
  const toneMatch = text.match(/\*\*口調:\*\*\s*(.+?)(?=##|$)/s)
  const tone = toneMatch ? toneMatch[1].trim() : ''

  // 画像生成プロンプトを抽出
  const imagePromptMatch = text.match(/##\s*画像生成プロンプト\s*\n\s*`(.+?)`/s)
  let imagePrompt = imagePromptMatch ? imagePromptMatch[1].trim() : ''
  
  // スタイル部分を除去して純粋なプロンプトのみ取得
  imagePrompt = imagePrompt.replace(/,?\s*Kawaii illustration.+$/s, '').trim()

  return {
    concept,
    name,
    personality,
    tone,
    imagePrompt,
  }
}

// 画像生成
export async function generateImage(
  apiKey: string,
  prompt: string
) {
  const genAI = createGeminiClient(apiKey)
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-image'
  })

  // スタイル部分を追加
  const fullPrompt = prompt + IMAGE_STYLE_SUFFIX

  const result = await model.generateContent(fullPrompt)
  const response = result.response

  // 画像データを取得
  // Note: Gemini APIの画像生成レスポンス形式に応じて調整が必要
  // 現在はテキストレスポンスを返す仕様の可能性があるため、
  // 実際のAPIレスポンスに合わせて実装を調整する必要があります
  
  return response
}
