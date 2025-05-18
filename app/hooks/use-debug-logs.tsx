'use client'

import { useEffect, useState } from 'react'

export function useDebugLogs() {
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  useEffect(() => {
    const originalConsoleLog = console.log
    const originalConsoleError = console.error

    console.log = (...args) => {
      originalConsoleLog(...args)
      if (typeof args[0] === 'string' && args[0].includes('[DEBUG]')) {
        setDebugLogs(prev => [...prev, args.join(' ')])
      }
    }

    console.error = (...args) => {
      originalConsoleError(...args)
      if (typeof args[0] === 'string' && args[0].includes('[DEBUG]')) {
        setDebugLogs(prev => [...prev, `ERROR: ${args.join(' ')}`])
      }
    }

    return () => {
      console.log = originalConsoleLog
      console.error = originalConsoleError
    }
  }, [])

  const clearLogs = () => {
    setDebugLogs([])
  }

  return { debugLogs, clearLogs }
}
