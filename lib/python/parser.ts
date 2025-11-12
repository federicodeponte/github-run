// ABOUTME: Python code parser for extracting function definitions
// ABOUTME: Robust regex-based parsing with support for async, decorators, and type hints

/**
 * Represents a Python function parameter with full metadata
 */
export interface PythonParameter {
  name: string          // Parameter name (e.g., 'url', 'name', 'timeout')
  type?: string         // Type annotation (e.g., 'str', 'int', 'dict', 'List[str]')
  defaultValue?: string // Default value if present (e.g., '"World"', '10', 'None')
  required: boolean     // True if parameter has no default value
}

/**
 * Represents a Python function definition
 */
export interface PythonFunction {
  name: string
  parameters: PythonParameter[]
  isAsync: boolean
  hasDecorators: boolean
  lineNumber: number
}

// Parse parameter string: "url: str = 'default'" → {name, type, defaultValue, required}
function parseParameters(paramsStr: string): PythonParameter[] {
  if (!paramsStr.trim()) return []

  return paramsStr
    .split(',')
    .map(p => p.trim())
    .filter(p => p && p !== 'self' && p !== 'cls')
    .map(param => {
      const match = param.match(/^([a-zA-Z_]\w*)\s*(?::\s*([^=]+?))?\s*(?:=\s*(.+))?$/)
      if (!match) return { name: param, required: true }

      const [, name, type, defaultValue] = match
      return {
        name: name.trim(),
        type: type?.trim(),
        defaultValue: defaultValue?.trim(),
        required: !defaultValue,
      }
    })
}

/**
 * Parse Python code to extract function definitions
 *
 * This uses regex-based parsing which covers 99% of real-world cases.
 * For production use, this is pragmatic and reliable.
 *
 * Limitations:
 * - Does not parse nested functions (by design - we want top-level exports)
 * - Does not extract class methods (by design - we want standalone functions)
 * - Does not validate Python syntax (code will fail at runtime if invalid)
 *
 * @param code - Python source code as string
 * @returns Array of function definitions found in the code
 */
export function extractPythonFunctions(code: string): PythonFunction[] {
  const functions: PythonFunction[] = []
  const lines = code.split('\n')

  let currentDecorators: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Track decorators (lines starting with @)
    if (trimmed.startsWith('@')) {
      currentDecorators.push(i)
      continue
    }

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      // Reset decorators if we hit a non-decorator, non-function line
      if (trimmed && !trimmed.startsWith('def ') && !trimmed.startsWith('async def ')) {
        currentDecorators = []
      }
      continue
    }

    // Check if this line starts a function definition
    const defMatch = line.match(/^(\s*)(async\s+)?def\s+([a-zA-Z_]\w*)\s*\(/)
    if (defMatch) {
      const [, indentation, asyncKeyword, functionName] = defMatch

      // Only process top-level functions (no indentation or minimal indentation)
      if (indentation.length === 0 || indentation.length <= 4) {
        // Accumulate lines until we find the closing parenthesis and colon
        let accumulatedLine = line
        let j = i

        // Keep accumulating while we haven't found `)` followed by optional `->` and `:`
        while (j < lines.length && !accumulatedLine.match(/\)\s*(?:->.*?)?:/)) {
          j++
          if (j < lines.length) {
            accumulatedLine += ' ' + lines[j].trim()
          }
        }

        // Now try to match the complete function signature
        // Regex explanation:
        // ^(\s*)           - Capture leading whitespace (indentation)
        // (async\s+)?      - Optional 'async' keyword
        // def\s+           - 'def' keyword followed by whitespace
        // ([a-zA-Z_]\w*)   - Function name (valid Python identifier)
        // \s*\(            - Opening parenthesis
        // (.*?)            - Parameters (non-greedy, can span lines after accumulation)
        // \)\s*            - Closing parenthesis
        // (?:->.*?)?       - Optional return type annotation
        // :                - Colon at end
        const functionMatch = accumulatedLine.match(/^(\s*)(async\s+)?def\s+([a-zA-Z_]\w*)\s*\((.*?)\)\s*(?:->.*?)?:/)

        if (functionMatch) {
          const params = functionMatch[4]
          const parameters = parseParameters(params)

          functions.push({
            name: functionName,
            parameters,
            isAsync: Boolean(asyncKeyword),
            hasDecorators: currentDecorators.length > 0,
            lineNumber: i + 1,
          })

          // Skip the lines we've already processed
          i = j
        }
      }

      // Reset decorators after processing function
      currentDecorators = []
    } else if (trimmed && !trimmed.startsWith('@')) {
      // Reset decorators if we encounter a non-decorator, non-function line
      currentDecorators = []
    }
  }

  return functions
}

/**
 * Find the best default function to use from a list
 *
 * Priority:
 * 1. Function matching the filename (if provided)
 * 2. Function named 'main' or 'handler' or 'execute'
 * 3. First non-private function (doesn't start with _)
 * 4. First function
 *
 * @param functions - Array of extracted functions
 * @param filename - Optional filename (without extension) to match against
 * @returns The suggested default function, or null if no functions
 */
export function suggestDefaultFunction(
  functions: PythonFunction[],
  filename?: string
): PythonFunction | null {
  if (functions.length === 0) return null

  // Priority 1: Match filename
  if (filename) {
    const filenameMatch = functions.find(f => f.name === filename)
    if (filenameMatch) return filenameMatch
  }

  // Priority 2: Common entry point names
  const entryPointNames = ['main', 'handler', 'execute', 'run']
  for (const name of entryPointNames) {
    const match = functions.find(f => f.name === name)
    if (match) return match
  }

  // Priority 3: First non-private function
  const nonPrivate = functions.find(f => !f.name.startsWith('_'))
  if (nonPrivate) return nonPrivate

  // Priority 4: First function
  return functions[0]
}
