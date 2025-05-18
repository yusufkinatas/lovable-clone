import * as ts from 'typescript'

/**
 * A custom error class for TypeScript validation failures
 */
export class TypeScriptValidationError extends Error {
  diagnostics: readonly ts.Diagnostic[]

  constructor(message: string, diagnostics: readonly ts.Diagnostic[]) {
    super(message)
    this.name = 'TypeScriptValidationError'
    this.diagnostics = diagnostics
  }
}

/**
 * Validates TypeScript code for syntax errors using the TypeScript Compiler API
 * @param code The TypeScript code to validate
 * @returns A boolean indicating if the code is valid
 * @throws TypeScriptValidationError if the code is invalid
 */
export function validateTypeScriptCode(code: string): boolean {
  // Create a virtual filename for the in-memory file
  const filename = 'temp.tsx'

  // Create compiler options
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.React,
    noEmit: true,
    esModuleInterop: true,
    strict: true,
  }

  // Create a virtual source file
  const sourceFile = ts.createSourceFile(filename, code, ts.ScriptTarget.ES2022, true)

  // Create a custom compiler host to handle the in-memory source file
  const compilerHost: ts.CompilerHost = {
    getSourceFile: name => (name === filename ? sourceFile : undefined),
    getDefaultLibFileName: () => 'lib.d.ts',
    writeFile: () => {},
    getCurrentDirectory: () => '/',
    getCanonicalFileName: fileName => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    fileExists: fileName => fileName === filename,
    readFile: () => '',
  }

  // Create a program with the source file
  const program = ts.createProgram([filename], compilerOptions, compilerHost)

  // Get syntax diagnostics
  const syntaxDiagnostics = program.getSyntacticDiagnostics(sourceFile)

  // If there are syntax errors, throw a validation error
  if (syntaxDiagnostics.length > 0) {
    // Format diagnostic messages
    const formattedDiagnostics = syntaxDiagnostics.map(diagnostic => {
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      if (diagnostic.file && diagnostic.start !== undefined) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
          diagnostic.start
        )
        message = `Line ${line + 1}, Col ${character + 1}: ${message}`
      }
      return message
    })

    const errorMessage = `TypeScript code validation failed with ${syntaxDiagnostics.length} syntax errors:\n${formattedDiagnostics.join('\n')}`

    throw new TypeScriptValidationError(errorMessage, syntaxDiagnostics)
  }

  return true
}
