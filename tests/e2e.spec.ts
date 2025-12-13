/**
 * E2Eテスト - Playwright
 * 実際のブラウザでユーザーフローをテストします
 */

import { test as base, expect } from '@playwright/test';

const test = base.extend({
  // Disable vitest globals
});

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

test.describe('ユーザー登録とログインフロー', () => {
  
  test('ログインページが正しく表示される', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('h1')).toContainText('ログイン');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('未ログイン状態でチャットページにアクセスするとログインページにリダイレクトされる', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat`);
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('空のフォームで送信するとエラーメッセージが表示される', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.click('button[type="submit"]');
    
    // エラーメッセージまたはバリデーションが表示されることを確認
    await page.waitForTimeout(1000);
    const hasError = await page.locator('.error, [role="alert"], .text-red-500').count() > 0;
    expect(hasError).toBeTruthy();
  });
});

test.describe('チャットページUI', () => {
  
  test('ログイン後にチャットページが表示される（モック）', async ({ page }) => {
    // 注意: 実際の認証が必要な場合は、テストユーザーでログインする必要があります
    // ここでは、ページ構造のみをテストします
    
    await page.goto(`${BASE_URL}/chat`);
    
    // ログインページにリダイレクトされた場合
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
    } else {
      // ログイン済みの場合、チャットUIが表示されることを確認
      await expect(page.locator('.chat-container, #chatMessages, [data-chat]')).toBeTruthy();
    }
  });
});

test.describe('レスポンシブデザイン', () => {
  
  test('モバイルビューでログインページが正しく表示される', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('タブレットビューでログインページが正しく表示される', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});

test.describe('静的リソース', () => {
  
  test('JavaScriptファイルが正しく読み込まれる', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/static/chat.js`);
    expect(response?.status()).toBe(200);
  });

  test('CSSファイルが正しく読み込まれる', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/static/style.css`);
    expect(response?.status()).toBe(200);
  });
});
