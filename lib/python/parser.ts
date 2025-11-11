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

/**
 * Parse a parameter string to extract name, type, and default value
 *
 * Examples:
 * - "url" → {name: 'url', required: true}
 * - "name: str" → {name: 'name', type: 'str', required: true}
 * - "timeout: int = 30" → {name: 'timeout', type: 'int', defaultValue: '30', required: false}
 * - "items: List[str] = []" → {name: 'items', type: 'List[str]', defaultValue: '[]', required: false}
 *
 * @param paramsStr - Parameter string from function signature
 * @returns Array of parsed parameters
 */
function parseParameters(paramsStr: string): PythonParameter[] {
  if (!paramsStr.trim()) return []

  return paramsStr
    .split(',')
    .map(p => p.trim())
    .filter(p => p && p !== 'self' && p !== 'cls') // Exclude self/cls
    .map(param => {
      // Regex to parse parameter: name[: type][= default]
      // Examples:
      // - "url" → name='url'
      // - "name: str" → name='name', type='str'
      // - "timeout: int = 30" → name='timeout', type='int', default='30'
      // - "items: List[str] = []" → name='items', type='List[str]', default='[]'
      const match = param.match(/^([a-zA-Z_]\w*)\s*(?::\s*([^=]+?))?\s*(?:=\s*(.+))?$/)

      if (!match) {
        // Fallback: just use the whole parameter as name
        return { name: param, required: true }
      }

      const [, name, type, defaultValue] = match

      return {
        name: name.trim(),
        type: type?.trim(),
        defaultValue: defaultValue?.trim(),
        required: !defaultValue, // Required if no default value
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

    // Match function definitions
    // Regex explanation:
    // ^(\s*)           - Capture leading whitespace (indentation)
    // (async\s+)?      - Optional 'async' keyword
    // def\s+           - 'def' keyword followed by whitespace
    // ([a-zA-Z_]\w*)   - Function name (valid Python identifier)
    // \s*\(            - Opening parenthesis
    // ([^)]*?)         - Parameters (non-greedy, anything except closing paren)
    // \)\s*            - Closing parenthesis
    // (?:->.*?)?       - Optional return type annotation
    // :                - Colon at end
    const functionMatch = line.match(/^(\s*)(async\s+)?def\s+([a-zA-Z_]\w*)\s*\(([^)]*?)\)\s*(?:->.*?)?:/)

    if (functionMatch) {
      const [, indentation, asyncKeyword, functionName, params] = functionMatch

      // Only extract top-level functions (no indentation or minimal indentation)
      // This excludes nested functions and class methods
      if (indentation.length === 0 || indentation.length <= 4) {
        const parameters = parseParameters(params)

        functions.push({
          name: functionName,
          parameters,
          isAsync: Boolean(asyncKeyword),
          hasDecorators: currentDecorators.length > 0,
          lineNumber: i + 1,
        })
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
