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

function generateExampleValue(param: PythonParameter): any {
  const name = param.name.toLowerCase()
  const type = param.type?.toLowerCase()

  // Name-based heuristics (order matters: most specific first)
  const namePatterns: [RegExp, any][] = [
    [/url|link|href/, 'https://example.com'],
    [/email|mail/, 'user@example.com'],
    [/name|username/, 'World'],
    [/path|file/, '/path/to/file'],
    [/id/, '12345'],
    [/count|num|size/, 10],
    [/enabled|active|flag/, true],
  ]

  for (const [pattern, value] of namePatterns) {
    if (pattern.test(name)) return value
  }

  // Type-based defaults
  if (type) {
    if (type.startsWith('optional[')) {
      const innerType = type.match(/optional\[(.+)\]/)?.[1]
      if (innerType) return generateExampleValue({ ...param, type: innerType })
    }
    const typeDefaults: Record<string, any> = {
      str: 'example', string: 'example',
      int: 0, integer: 0, float: 0.0,
      bool: true, boolean: true,
      dict: {}, list: [],
    }
    // Use 'in' operator to properly check for key existence (handles falsy values like 0)
    if (type in typeDefaults) return typeDefaults[type]
    if (type.startsWith('dict[')) return {}
    if (type.startsWith('list[')) return []
  }

  return 'example'
}

function parseDefaultValue(defaultValue: string): any {
  const t = defaultValue.trim()

  // String literals
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1)
  }

  // Lookup table for constants
  const constants: Record<string, any> = {
    True: true, False: false, None: null,
    '[]': [], '{}': {},
  }
  if (t in constants) return constants[t]

  // Numbers
  if (/^-?\d+$/.test(t)) return parseInt(t, 10)
  if (/^-?\d+\.\d+$/.test(t)) return parseFloat(t)

  return t
}
