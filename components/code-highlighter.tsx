'use client'

import { useTheme } from 'next-themes'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import oneDark from 'react-syntax-highlighter/dist/cjs/styles/prism/one-dark'
import oneLight from 'react-syntax-highlighter/dist/cjs/styles/prism/one-light'

interface CodeHighlighterProps {
  code: string
  language?: string
}

export function CodeHighlighter({ code, language = 'typescript' }: CodeHighlighterProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <SyntaxHighlighter
      language={language}
      style={isDark ? oneDark : oneLight}
      wrapLongLines
      customStyle={{
        margin: 0,
        height: '100%',
        fontSize: '0.875rem',
      }}
    >
      {code}
    </SyntaxHighlighter>
  )
}
