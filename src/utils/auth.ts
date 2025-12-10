// 認証ユーティリティ関数

// パスワードハッシュ化（Web Crypto API使用）
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// パスワード検証
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// JWT生成（簡易版 - 署名付き）
export async function generateToken(userId: string, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30日間有効
  }

  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header))
  const payloadB64 = btoa(JSON.stringify(payload))
  const data = `${headerB64}.${payloadB64}`

  // HMAC-SHA256で署名
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))

  return `${data}.${signatureB64}`
}

// JWT検証
export async function verifyToken(token: string, secret: string): Promise<{ userId: string } | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !signatureB64) {
      return null
    }

    // 署名検証
    const encoder = new TextEncoder()
    const data = `${headerB64}.${payloadB64}`
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const signatureArray = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0))
    const isValid = await crypto.subtle.verify('HMAC', key, signatureArray, encoder.encode(data))

    if (!isValid) {
      return null
    }

    // ペイロード検証
    const payload = JSON.parse(atob(payloadB64))
    
    // 有効期限チェック
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return { userId: payload.userId }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// メールアドレスバリデーション
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// パスワードバリデーション（8文字以上）
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'パスワードは8文字以上である必要があります' }
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: 'パスワードには英字を含める必要があります' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'パスワードには数字を含める必要があります' }
  }
  return { valid: true }
}

// ユーザー名バリデーション
export function validateUsername(username: string): { valid: boolean; message?: string } {
  if (username.length < 2) {
    return { valid: false, message: 'ユーザー名は2文字以上である必要があります' }
  }
  if (username.length > 20) {
    return { valid: false, message: 'ユーザー名は20文字以内である必要があります' }
  }
  return { valid: true }
}
