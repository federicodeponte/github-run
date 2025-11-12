import { describe, it, expect } from 'vitest'
import { extractPythonFunctions, suggestDefaultFunction } from '../parser'
import { pythonFixtures, expectedResults } from './fixtures'

describe('extractPythonFunctions', () => {
  describe('Basic function extraction', () => {
    it('should extract function with no parameters', () => {
      const functions = extractPythonFunctions(pythonFixtures.noParams)

      expect(functions).toHaveLength(1)
      expect(functions[0]).toMatchObject(expectedResults.noParams)
    })

    it('should extract function with simple parameters', () => {
      const functions = extractPythonFunctions(pythonFixtures.simpleParams)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('greet')
      expect(functions[0].parameters).toHaveLength(2)
      expect(functions[0].parameters[0]).toMatchObject({
        name: 'name',
        type: 'str',
        required: true,
      })
      expect(functions[0].parameters[1]).toMatchObject({
        name: 'age',
        type: 'int',
        defaultValue: '25',
        required: false,
      })
    })

    it('should extract function with complex type hints (multiline)', () => {
      const functions = extractPythonFunctions(pythonFixtures.complexTypes)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('process_data')
      expect(functions[0].parameters).toHaveLength(4)
      expect(functions[0].parameters[0]).toMatchObject({
        name: 'url',
        type: 'str',
        required: true,
      })
      expect(functions[0].parameters[3].defaultValue).toBe('True')
    })

    it('should extract function with advanced types (list, dict, multiline)', () => {
      const functions = extractPythonFunctions(pythonFixtures.advancedTypes)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('analyze')
      expect(functions[0].parameters).toHaveLength(4)
      expect(functions[0].parameters[0].type).toBe('list')
      expect(functions[0].parameters[1].type).toBe('dict')
    })
  })

  describe('Async functions', () => {
    it('should detect async functions', () => {
      const functions = extractPythonFunctions(pythonFixtures.asyncFunction)

      expect(functions).toHaveLength(1)
      expect(functions[0].isAsync).toBe(true)
      expect(functions[0].name).toBe('fetch_data')
    })
  })

  describe('Decorated functions', () => {
    it('should detect decorators', () => {
      const functions = extractPythonFunctions(pythonFixtures.decoratedFunction)

      expect(functions).toHaveLength(1)
      expect(functions[0].hasDecorators).toBe(true)
      expect(functions[0].name).toBe('api_handler')
    })
  })

  describe('Multiple functions', () => {
    it('should extract all top-level functions', () => {
      const functions = extractPythonFunctions(pythonFixtures.multipleFunctions)

      expect(functions).toHaveLength(3)
      expect(functions[0].name).toBe('first_function')
      expect(functions[1].name).toBe('second_function')
      expect(functions[2].name).toBe('third_function')
    })
  })

  describe('Parameter parsing', () => {
    it('should correctly identify required vs optional parameters', () => {
      const functions = extractPythonFunctions(pythonFixtures.simpleParams)
      const params = functions[0].parameters

      expect(params[0].required).toBe(true)  // name (no default)
      expect(params[1].required).toBe(false) // age (has default)
    })

    it('should parse default values correctly', () => {
      const code = `def func(a: str, b: dict = {}, c: int = 30, d: bool = True): return True`
      const functions = extractPythonFunctions(code)
      const params = functions[0].parameters

      expect(params[1].defaultValue).toBe('{}')
      expect(params[2].defaultValue).toBe('30')
      expect(params[3].defaultValue).toBe('True')
    })

    it('should filter out self and cls parameters', () => {
      const code = `
def method(self, x: int):
    return x

def classmethod_example(cls, y: str):
    return y
      `
      const functions = extractPythonFunctions(code)

      expect(functions[0].parameters).toHaveLength(1)
      expect(functions[0].parameters[0].name).toBe('x')
      expect(functions[1].parameters).toHaveLength(1)
      expect(functions[1].parameters[0].name).toBe('y')
    })
  })

  describe('Edge cases', () => {
    it('should handle functions with no type hints', () => {
      const functions = extractPythonFunctions(pythonFixtures.noTypeHints)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('legacy_function')
      expect(functions[0].parameters).toHaveLength(3)
      expect(functions[0].parameters[0].type).toBeUndefined()
      expect(functions[0].parameters[2].defaultValue).toBe('10')
    })

    it('should handle multiline parameters', () => {
      const functions = extractPythonFunctions(pythonFixtures.multilineParams)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('complex_function')
      expect(functions[0].parameters).toHaveLength(4)
      expect(functions[0].parameters[0].name).toBe('param1')
      expect(functions[0].parameters[2].defaultValue).toBe('False')
    })

    it('should handle return type annotations', () => {
      const functions = extractPythonFunctions(pythonFixtures.returnTypeAnnotation)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('get_user')
      expect(functions[0].parameters).toHaveLength(1)
    })

    it('should extract nested functions with <= 4 spaces indentation', () => {
      const functions = extractPythonFunctions(pythonFixtures.nestedFunction)

      // NOTE: Parser extracts functions with <= 4 spaces indentation
      // So nested functions (typically 4 spaces) ARE extracted
      expect(functions).toHaveLength(2)
      expect(functions[0].name).toBe('outer')
      expect(functions[1].name).toBe('inner')
    })

    it('should extract class methods (with <= 4 spaces indentation)', () => {
      const functions = extractPythonFunctions(pythonFixtures.classMethods)

      // NOTE: Parser extracts functions with <= 4 spaces indentation
      // Class methods (typically 4 spaces) ARE extracted
      expect(functions).toHaveLength(2)
      expect(functions[0].name).toBe('method_one')
      expect(functions[1].name).toBe('static_method')
    })

    it('should include private functions (starting with _)', () => {
      const functions = extractPythonFunctions(pythonFixtures.underscoredName)

      expect(functions).toHaveLength(2)
      expect(functions[0].name).toBe('_private_helper')
      expect(functions[1].name).toBe('public_function')
    })

    it('should handle empty code', () => {
      const functions = extractPythonFunctions('')
      expect(functions).toHaveLength(0)
    })

    it('should handle code with only comments', () => {
      const code = `
# This is a comment
# Another comment
      `
      const functions = extractPythonFunctions(code)
      expect(functions).toHaveLength(0)
    })
  })

  describe('Real-world examples', () => {
    it('should parse SEO health checker function', () => {
      const functions = extractPythonFunctions(pythonFixtures.seoHealthChecker)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('analyze_url')
      expect(functions[0].parameters).toHaveLength(1)
      expect(functions[0].parameters[0]).toMatchObject({
        name: 'url',
        type: 'str',
        required: true,
      })
    })

    it('should parse multiline ML inference function', () => {
      const functions = extractPythonFunctions(pythonFixtures.mlInference)

      expect(functions).toHaveLength(1)
      expect(functions[0].name).toBe('predict')
      expect(functions[0].parameters).toHaveLength(3)
      expect(functions[0].parameters[0].name).toBe('image_url')
      expect(functions[0].parameters[1].defaultValue).toBe('"default"')
      expect(functions[0].parameters[2].type).toBe('float')
    })
  })

  describe('Line numbers', () => {
    it('should track line numbers correctly', () => {
      const functions = extractPythonFunctions(pythonFixtures.multipleFunctions)

      // Each function should have a lineNumber property
      functions.forEach(func => {
        expect(func.lineNumber).toBeGreaterThan(0)
      })

      // Line numbers should be in ascending order
      for (let i = 1; i < functions.length; i++) {
        expect(functions[i].lineNumber).toBeGreaterThan(functions[i - 1].lineNumber)
      }
    })
  })
})

describe('suggestDefaultFunction', () => {
  it('should return null for empty array', () => {
    const result = suggestDefaultFunction([])
    expect(result).toBeNull()
  })

  it('should suggest function matching filename', () => {
    const functions = extractPythonFunctions(pythonFixtures.multipleFunctions)
    const result = suggestDefaultFunction(functions, 'first_function')

    expect(result).not.toBeNull()
    expect(result?.name).toBe('first_function')
  })

  it('should suggest "main" function if exists', () => {
    const code = `
def helper():
    return 1

def main():
    return 2

def another():
    return 3
    `
    const functions = extractPythonFunctions(code)
    const result = suggestDefaultFunction(functions)

    expect(result?.name).toBe('main')
  })

  it('should suggest "handler" if no main', () => {
    const code = `
def helper():
    return 1

def handler():
    return 2
    `
    const functions = extractPythonFunctions(code)
    const result = suggestDefaultFunction(functions)

    expect(result?.name).toBe('handler')
  })

  it('should suggest "execute" if no main or handler', () => {
    const code = `
def helper():
    return 1

def execute():
    return 2
    `
    const functions = extractPythonFunctions(code)
    const result = suggestDefaultFunction(functions)

    expect(result?.name).toBe('execute')
  })

  it('should suggest first non-private function', () => {
    const functions = extractPythonFunctions(pythonFixtures.underscoredName)
    const result = suggestDefaultFunction(functions)

    // Should skip _private_helper and suggest public_function
    expect(result?.name).toBe('public_function')
  })

  it('should suggest first function if all are private', () => {
    const code = `
def _private_one():
    return 1

def _private_two():
    return 2
    `
    const functions = extractPythonFunctions(code)
    const result = suggestDefaultFunction(functions)

    expect(result?.name).toBe('_private_one')
  })

  it('should prioritize filename match over main', () => {
    const code = `
def main():
    return 1

def custom_name():
    return 2
    `
    const functions = extractPythonFunctions(code)
    const result = suggestDefaultFunction(functions, 'custom_name')

    expect(result?.name).toBe('custom_name')
  })
})
