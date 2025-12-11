import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Ramat - あなただけの守護動物</title>
        {/* Google Fonts - Zen Maru Gothic */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
        <link href="/static/style.css" rel="stylesheet" />
        <link href="/static/admin.css" rel="stylesheet" />
        <link href="/static/chat.css" rel="stylesheet" />
        <link href="/static/mypage.css" rel="stylesheet" />
        <link href="/static/login.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
})
