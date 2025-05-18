export const assertExists: <T>(
  value: T,
  name?: string
) => asserts value is NonNullable<T> = (value, name = 'Value') => {
  if (value === null || value === undefined) {
    throw new Error(`assertExists(${name}) failed. "${name}" is ${String(value)}`)
  }
}
