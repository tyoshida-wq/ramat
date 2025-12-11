// 待ち受け画像生成サービス

const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview';

/**
 * 待ち受け画像を生成（参考画像を使用）
 * @param referenceImageBase64 - 参考画像（base64形式）
 * @param prompt - 追加プロンプト
 * @param aspectRatio - アスペクト比（"9:16" or "16:9"）
 * @param apiKey - Gemini API Key
 * @returns 生成された画像（base64形式）
 */
export async function generateWallpaper(
  referenceImageBase64: string,
  prompt: string,
  aspectRatio: "9:16" | "16:9",
  apiKey: string
): Promise<string> {
  console.log(`Generating wallpaper with aspect ratio: ${aspectRatio}`);
  
  // base64形式からdata URLのプレフィックスを除去
  const base64Data = referenceImageBase64.replace(/^data:image\/\w+;base64,/, '');
  
  // アスペクト比に応じたプロンプト
  const aspectPrompt = aspectRatio === "9:16" 
    ? "スマートフォン用の縦長構図（9:16）で、キャラクターを中央に美しく配置してください。背景は広大で幻想的な風景にしてください。"
    : "PC用の横長構図（16:9）で、キャラクターと広大な背景を美しく配置してください。背景は壮大で幻想的な風景にしてください。";
  
  const fullPrompt = `キャラクターとテイストを変えずに、キャラクターのポーズや背景を変化させて、美しい高解像度の待ち受け画像を生成してください。

${aspectPrompt}

追加要件:
${prompt}

重要:
- キャラクターの雰囲気、色調、スタイルは参考画像と同じにしてください
- ポーズや表情は自然に変化させてください
- 背景は幻想的で美しい風景を追加してください
- 4K高解像度で生成してください`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            text: fullPrompt
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        responseModalities: ['image']
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini Wallpaper API error:', response.status, error);
    throw new Error(`Gemini Wallpaper API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('Wallpaper API response structure:', JSON.stringify(data).substring(0, 200));
  
  // 画像データを取得（base64）
  const imageData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  
  if (!imageData || !imageData.data) {
    console.error('No image data found. Response:', JSON.stringify(data, null, 2));
    throw new Error(`No image data returned from Gemini API. Response: ${JSON.stringify(data).substring(0, 500)}`);
  }

  console.log('Wallpaper generated. MimeType:', imageData.mimeType, 'Data length:', imageData.data.length);
  
  // data:image/png;base64,... の形式で返す
  return `data:${imageData.mimeType};base64,${imageData.data}`;
}

/**
 * R2バケットに画像をアップロード
 * @param bucket - R2 Bucket
 * @param key - ファイルキー
 * @param dataUrl - 画像データ（data URL形式）
 * @returns 公開URL
 */
export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  dataUrl: string
): Promise<string> {
  console.log(`Uploading to R2: ${key}`);
  
  // data:image/png;base64,xxx から base64部分を抽出
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  
  // Base64をバイナリに変換
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // R2にアップロード
  await bucket.put(key, bytes, {
    httpMetadata: {
      contentType: 'image/png'
    }
  });
  
  console.log(`Uploaded successfully: ${key}`);
  
  // 公開URLを返す
  // Note: R2のカスタムドメイン設定が必要
  // 暫定的にはバケット名をベースにしたURLを返す
  return `https://ramat-wallpapers.r2.dev/${key}`;
}
