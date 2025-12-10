import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ソウルメイト - あなただけの守護動物</title>
        <link href="/static/style.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
})
