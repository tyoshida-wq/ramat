// Gemini API サービス

const GEMINI_TEXT_MODEL = 'gemini-2.0-flash-exp';
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

export interface SoulmateProfile {
  concept: string;
  name: string;
  personality: string;
  tone: string;
  imagePrompt: string;
}

// システムプロンプト
const SYSTEM_PROMPT = `# Role
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
storybook style, soft expression, no text, no words, no letters, no signature, no watermark\``;

// プロフィール生成
export async function generateProfile(
  animal: string,
  name: string,
  apiKey: string
): Promise<SoulmateProfile> {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  const userPrompt = `【必須指定】
ベースとなる動物: ${animal}
名前: ${name}

ユニークID: ${uniqueId}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${SYSTEM_PROMPT}\n\n${userPrompt}`
        }]
      }],
      generationConfig: {
        temperature: 1.8,
        maxOutputTokens: 500,
        topP: 0.98,
        topK: 50
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;

  // レスポンスをパース
  return parseProfile(text, name);
}

// プロフィールテキストをパース
function parseProfile(text: string, fallbackName: string): SoulmateProfile {
  // コンセプト抽出
  const conceptMatch = text.match(/\*\*コンセプト:\*\*\s*(.+)/);
  const concept = conceptMatch ? conceptMatch[1].trim() : '';

  // 名前抽出
  const nameMatch = text.match(/\*\*名前:\*\*\s*(.+)/);
  const name = nameMatch ? nameMatch[1].trim() : fallbackName;

  // 性格抽出
  const personalityMatch = text.match(/\*\*性格:\*\*\s*(.+?)(?=\*\*|##|$)/s);
  const personality = personalityMatch ? personalityMatch[1].trim() : '';

  // 口調抽出
  const toneMatch = text.match(/\*\*口調:\*\*\s*(.+?)(?=##|$)/s);
  const tone = toneMatch ? toneMatch[1].trim() : '';

  // 画像生成プロンプト抽出（バッククォート内）
  const imagePromptMatch = text.match(/`([^`]+)`/);
  const imagePrompt = imagePromptMatch ? imagePromptMatch[1].trim() : '';

  return {
    concept,
    name,
    personality,
    tone,
    imagePrompt
  };
}

// 画像生成
export async function generateImage(
  prompt: string,
  apiKey: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        responseModalities: ['image']
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini Image API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  // 画像データを取得（base64）
  const imageData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  
  if (!imageData || !imageData.data) {
    throw new Error('No image data returned from Gemini API');
  }

  // data:image/png;base64,... の形式で返す
  return `data:${imageData.mimeType};base64,${imageData.data}`;
}
