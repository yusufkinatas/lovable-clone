'use client'
import { useProjectContext } from '../context/project-context'

export function DebugLogs() {
  const { debugLogs: logs } = useProjectContext()

  return (
    <div className="h-full overflow-auto bg-zinc-50 p-2 font-mono text-green-400 text-xs dark:bg-zinc-900">
      {logs.length > 0 ? (
        logs.map((log, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <div key={index} className={log.includes('ERROR') ? 'text-red-400' : ''}>
            {log}
          </div>
        ))
      ) : (
        <div className="text-gray-500">
          No logs yet. Generate an app to see debug information.
        </div>
      )}
    </div>
  )
}
