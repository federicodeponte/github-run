// ABOUTME: Smart example payload generator for Python function testing
// ABOUTME: Uses type hints and parameter names to create realistic test data

import type { PythonFunction, PythonParameter } from './parser'

/**
 * Generate a realistic example request payload for a Python function
 *
 * Uses smart heuristics based on:
 * - Parameter names (e.g., 'url' → 'https://example.com')
 * - Type annotations (e.g., 'str' → 'example', 'int' → 0)
 * - Default values (can be included or omitted)
 *
 * @param func - Python function with parameter metadata
 * @param includeOptional - Whether to include optional parameters with defaults
 * @returns Example JSON payload object
 */
export function generateExampleRequest(
  func: PythonFunction,
  includeOptional = false
): Record<string, any> {
  const example: Record<string, any> = {}

  for (const param of func.parameters) {
    // Always include required parameters
    if (param.required) {
      example[param.name] = generateExampleValue(param)
    }
    // Optionally include parameters with defaults
    else if (includeOptional && param.defaultValue) {
      example[param.name] = parseDefaultValue(param.defaultValue)
    }
  }

  return example
}

/**
 * Generate a cURL command example for a function
 *
 * @param endpoint - API endpoint URL
 * @param func - Python function with parameter metadata
 * @returns Formatted cURL command string
 */
export function generateCurlExample(endpoint: string, func: PythonFunction): string {
  const payload = generateExampleRequest(func, false) // Only required params
  const jsonData = JSON.stringify(payload, null, 2)

  if (Object.keys(payload).length === 0) {
    // No parameters - send empty object
    return `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{}'`
  }

  // Format with proper indentation
  const formattedJson = jsonData.split('\n').join('\n  ')

  return `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '${formattedJson}'`
}

/**
 * Generate a human-readable function signature string
 *
 * Examples:
 * - analyze_url(url: str)
 * - hello(name: str = "World")
 * - process(items: list, max_count: int = 10)
 *
 * @param func - Python function with parameter metadata
 * @returns Formatted signature string
 */
export function generateSignature(func: PythonFunction): string {
  const params = func.parameters.map(param => {
    let sig = param.name
    if (param.type) {
      sig += `: ${param.type}`
    }
    if (param.defaultValue) {
      sig += ` = ${param.defaultValue}`
    }
    return sig
  })

  const asyncPrefix = func.isAsync ? 'async ' : ''
  return `${asyncPrefix}${func.name}(${params.join(', ')})`
}

/**
 * Generate an example value for a parameter based on type and name
 *
 * Uses heuristics:
 * 1. Parameter name patterns (url, name, email, etc.)
 * 2. Type annotations (str, int, bool, dict, list)
 * 3. Fallback to generic values
 *
 * @param param - Python parameter with metadata
 * @returns Example value appropriate for the parameter
 */
function generateExampleValue(param: PythonParameter): any {
  const name = param.name.toLowerCase()
  const type = param.type?.toLowerCase()

  // Heuristic 1: Special parameter names
  if (name.includes('url') || name.includes('link') || name.includes('href')) {
    return 'https://example.com'
  }
  if (name.includes('email') || name.includes('mail')) {
    return 'user@example.com'
  }
  if (name.includes('name') || name.includes('username')) {
    return 'World'
  }
  if (name.includes('path') || name.includes('file')) {
    return '/path/to/file'
  }
  if (name.includes('id')) {
    return '12345'
  }
  if (name.includes('count') || name.includes('num') || name.includes('size')) {
    return 10
  }
  if (name.includes('enabled') || name.includes('active') || name.includes('flag')) {
    return true
  }

  // Heuristic 2: Type annotations
  if (type) {
    // String types
    if (type === 'str' || type === 'string') {
      return 'example'
    }

    // Numeric types
    if (type === 'int' || type === 'integer') {
      return 0
    }
    if (type === 'float') {
      return 0.0
    }

    // Boolean
    if (type === 'bool' || type === 'boolean') {
      return true
    }

    // Collection types
    if (type === 'dict' || type.startsWith('dict[')) {
      return {}
    }
    if (type === 'list' || type.startsWith('list[')) {
      return []
    }
    if (type.startsWith('optional[')) {
      // Extract inner type: Optional[str] → str
      const innerMatch = type.match(/optional\[(.+)\]/)
      if (innerMatch) {
        return generateExampleValue({ ...param, type: innerMatch[1] })
      }
    }
  }

  // Heuristic 3: Fallback to generic string
  return 'example'
}

/**
 * Parse a default value string to its JavaScript equivalent
 *
 * Examples:
 * - '"World"' → 'World'
 * - '10' → 10
 * - 'True' → true
 * - 'None' → null
 * - '[]' → []
 *
 * @param defaultValue - Default value string from Python code
 * @returns Parsed JavaScript value
 */
function parseDefaultValue(defaultValue: string): any {
  const trimmed = defaultValue.trim()

  // String literals
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }

  // Python boolean/None
  if (trimmed === 'True') return true
  if (trimmed === 'False') return false
  if (trimmed === 'None') return null

  // Numbers
  if (/^-?\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10)
  }
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    return parseFloat(trimmed)
  }

  // Collections
  if (trimmed === '[]') return []
  if (trimmed === '{}') return {}

  // Fallback: return as string
  return trimmed
}
