/**
 * API自動テスト
 * すべての主要なAPIエンドポイントをテストします
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

describe('API Endpoints Health Check', () => {
  
  it('GET / - ルートページが正常にリダイレクトする', async () => {
    const response = await fetch(`${BASE_URL}/`, {
      redirect: 'manual'
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/login');
  });

  it('GET /login - ログインページが表示される', async () => {
    const response = await fetch(`${BASE_URL}/login`);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('ログイン');
  });

  it('GET /chat - 未認証時にリダイレクトされる', async () => {
    const response = await fetch(`${BASE_URL}/chat`, {
      redirect: 'manual'
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/login');
  });

  it('GET /api/auth/me - 未認証時に401エラー', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/me`);
    expect(response.status).toBe(401);
  });

  it('POST /api/auth/register - 必須フィールドなしで400エラー', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    expect(response.status).toBe(400);
  });

  it('POST /api/auth/login - 必須フィールドなしで400エラー', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    expect(response.status).toBe(400);
  });

  it('POST /api/generate - 未認証時に401エラー', async () => {
    const response = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    expect(response.status).toBe(401);
  });

  it('POST /api/chat/send - 未認証時に401エラー', async () => {
    const response = await fetch(`${BASE_URL}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test' })
    });
    expect(response.status).toBe(401);
  });
});

describe('Static Files', () => {
  
  it('静的ファイルが正しく配信される - chat.js', async () => {
    const response = await fetch(`${BASE_URL}/static/chat.js`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('javascript');
  });

  it('静的ファイルが正しく配信される - style.css', async () => {
    const response = await fetch(`${BASE_URL}/static/style.css`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('css');
  });
});

describe('Admin Endpoints', () => {
  
  it('GET /admin - 未認証時にリダイレクト', async () => {
    const response = await fetch(`${BASE_URL}/admin`, {
      redirect: 'manual'
    });
    expect(response.status).toBe(302);
  });

  it('GET /api/admin/stats - 未認証時に401エラー', async () => {
    const response = await fetch(`${BASE_URL}/api/admin/stats`);
    expect(response.status).toBe(401);
  });
});
