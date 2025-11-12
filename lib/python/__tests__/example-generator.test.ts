import { describe, it, expect } from 'vitest'
import {
  generateExampleRequest,
  generateSignature,
  generateCurlExample,
} from '../example-generator'
import type { PythonFunction } from '../parser'

describe('generateExampleRequest', () => {
  describe('Name-based heuristics', () => {
    it('should generate URL for url-like parameter names', () => {
      const func: PythonFunction = {
        name: 'fetch',
        parameters: [{ name: 'url', type: 'str', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ url: 'https://example.com' })
    })

    it('should generate email for email-like parameter names', () => {
      const func: PythonFunction = {
        name: 'send_email',
        parameters: [{ name: 'email', type: 'str', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ email: 'user@example.com' })
    })

    it('should generate names for name-like parameters', () => {
      const func: PythonFunction = {
        name: 'greet',
        parameters: [{ name: 'name', type: 'str', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ name: 'World' })
    })

    it('should generate path for path-like parameters', () => {
      const func: PythonFunction = {
        name: 'read_file',
        parameters: [{ name: 'file_path', type: 'str', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ file_path: '/path/to/file' })
    })

    it('should generate IDs for id-like parameters', () => {
      const func: PythonFunction = {
        name: 'get_user',
        parameters: [{ name: 'user_id', type: 'int', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ user_id: '12345' })
    })

    it('should generate numbers for count-like parameters', () => {
      const func: PythonFunction = {
        name: 'process',
        parameters: [{ name: 'count', type: 'int', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ count: 10 })
    })

    it('should generate boolean for flag-like parameters', () => {
      const func: PythonFunction = {
        name: 'process',
        parameters: [{ name: 'enabled', type: 'bool', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ enabled: true })
    })
  })

  describe('Type-based defaults', () => {
    it('should generate string default for str type', () => {
      const func: PythonFunction = {
        name: 'process',
        parameters: [{ name: 'data', type: 'str', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ data: 'example' })
    })

    it('should generate 0 for int type', () => {
      const func: PythonFunction = {
        name: 'process',
        parameters: [{ name: 'value', type: 'int', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ value: 0 })
    })

    it('should generate true for bool type', () => {
      const func: PythonFunction = {
        name: 'process',
        parameters: [{ name: 'flag', type: 'bool', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ flag: true })
    })

    it('should generate empty dict for dict type', () => {
      const func: PythonFunction = {
        name: 'process',
        parameters: [{ name: 'config', type: 'dict', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ config: {} })
    })

    it('should generate empty list for list type', () => {
      const func: PythonFunction = {
        name: 'process',
        parameters: [{ name: 'items', type: 'list', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ items: [] })
    })

    it('should generate 0.0 for float type', () => {
      const func: PythonFunction = {
        name: 'process',
        parameters: [{ name: 'threshold', type: 'float', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ threshold: 0.0 })
    })
  })

  describe('Required vs optional parameters', () => {
    it('should include only required parameters by default', () => {
      const func: PythonFunction = {
        name: 'greet',
        parameters: [
          { name: 'name', type: 'str', required: true },
          { name: 'age', type: 'int', defaultValue: '25', required: false },
        ],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func, false)
      expect(result).toEqual({ name: 'World' })
    })

    it('should include optional parameters when requested', () => {
      const func: PythonFunction = {
        name: 'greet',
        parameters: [
          { name: 'name', type: 'str', required: true },
          { name: 'age', type: 'int', defaultValue: '25', required: false },
        ],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func, true)
      expect(result).toEqual({ name: 'World', age: 25 })
    })

    it('should handle functions with no parameters', () => {
      const func: PythonFunction = {
        name: 'main',
        parameters: [],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({})
    })
  })

  describe('Real-world examples', () => {
    it('should generate correct example for SEO analyzer', () => {
      const func: PythonFunction = {
        name: 'analyze_url',
        parameters: [{ name: 'url', type: 'str', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result).toEqual({ url: 'https://example.com' })
    })

    it('should generate correct example for ML predict function', () => {
      const func: PythonFunction = {
        name: 'predict',
        parameters: [
          { name: 'image_url', type: 'str', required: true },
          { name: 'model', type: 'str', defaultValue: '"default"', required: false },
          { name: 'threshold', type: 'float', defaultValue: '0.5', required: false },
        ],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func, false)
      expect(result).toEqual({ image_url: 'https://example.com' })

      const resultWithOptional = generateExampleRequest(func, true)
      expect(resultWithOptional).toEqual({
        image_url: 'https://example.com',
        model: 'default',
        threshold: 0.5,
      })
    })

    it('should handle user authentication function', () => {
      const func: PythonFunction = {
        name: 'authenticate',
        parameters: [
          { name: 'email', type: 'str', required: true },
          { name: 'password', type: 'str', required: true },
        ],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result.email).toBe('user@example.com')
      expect(result.password).toBe('example')
    })
  })

  describe('Edge cases', () => {
    it('should handle parameters with no type hints', () => {
      const func: PythonFunction = {
        name: 'legacy',
        parameters: [
          { name: 'data', required: true },
          { name: 'count', required: true },
        ],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      const result = generateExampleRequest(func)
      expect(result.data).toBe('example')
      expect(result.count).toBe(10)
    })

    it('should prioritize name-based heuristics over type-based', () => {
      const func: PythonFunction = {
        name: 'process',
        parameters: [{ name: 'url', type: 'dict', required: true }],
        isAsync: false,
        hasDecorators: false,
        lineNumber: 1,
      }

      // Name 'url' should win over type 'dict'
      const result = generateExampleRequest(func)
      expect(result).toEqual({ url: 'https://example.com' })
    })
  })
})

describe('generateSignature', () => {
  it('should generate signature with no parameters', () => {
    const func: PythonFunction = {
      name: 'main',
      parameters: [],
      isAsync: false,
      hasDecorators: false,
      lineNumber: 1,
    }

    const result = generateSignature(func)
    expect(result).toBe('main()')
  })

  it('should generate signature with simple parameters', () => {
    const func: PythonFunction = {
      name: 'greet',
      parameters: [
        { name: 'name', type: 'str', required: true },
        { name: 'age', type: 'int', defaultValue: '25', required: false },
      ],
      isAsync: false,
      hasDecorators: false,
      lineNumber: 1,
    }

    const result = generateSignature(func)
    expect(result).toBe('greet(name: str, age: int = 25)')
  })

  it('should handle async functions', () => {
    const func: PythonFunction = {
      name: 'fetch',
      parameters: [{ name: 'url', type: 'str', required: true }],
      isAsync: true,
      hasDecorators: false,
      lineNumber: 1,
    }

    const result = generateSignature(func)
    expect(result).toBe('async fetch(url: str)')
  })

  it('should handle parameters without type hints', () => {
    const func: PythonFunction = {
      name: 'legacy',
      parameters: [
        { name: 'a', required: true },
        { name: 'b', defaultValue: '10', required: false },
      ],
      isAsync: false,
      hasDecorators: false,
      lineNumber: 1,
    }

    const result = generateSignature(func)
    expect(result).toBe('legacy(a, b = 10)')
  })

  it('should handle complex default values', () => {
    const func: PythonFunction = {
      name: 'process',
      parameters: [
        { name: 'config', type: 'dict', defaultValue: '{}', required: false },
        { name: 'items', type: 'list', defaultValue: '[]', required: false },
      ],
      isAsync: false,
      hasDecorators: false,
      lineNumber: 1,
    }

    const result = generateSignature(func)
    expect(result).toBe('process(config: dict = {}, items: list = [])')
  })
})

describe('generateCurlExample', () => {
  it('should generate curl command with no parameters', () => {
    const func: PythonFunction = {
      name: 'main',
      parameters: [],
      isAsync: false,
      hasDecorators: false,
      lineNumber: 1,
    }

    const endpoint = 'https://api.example.com/main'
    const result = generateCurlExample(endpoint, func)

    expect(result).toContain('curl -X POST')
    expect(result).toContain(endpoint)
    expect(result).toContain('-H "Content-Type: application/json"')
    expect(result).toContain('-d \'{}\'')
  })

  it('should generate curl command with parameters', () => {
    const func: PythonFunction = {
      name: 'analyze_url',
      parameters: [{ name: 'url', type: 'str', required: true }],
      isAsync: false,
      hasDecorators: false,
      lineNumber: 1,
    }

    const endpoint = 'https://api.example.com/analyze'
    const result = generateCurlExample(endpoint, func)

    expect(result).toContain('curl -X POST')
    expect(result).toContain(endpoint)
    expect(result).toContain('"url": "https://example.com"')
  })

  it('should pretty-print JSON payload', () => {
    const func: PythonFunction = {
      name: 'process',
      parameters: [
        { name: 'url', type: 'str', required: true },
        { name: 'count', type: 'int', required: true },
      ],
      isAsync: false,
      hasDecorators: false,
      lineNumber: 1,
    }

    const endpoint = 'https://api.example.com/process'
    const result = generateCurlExample(endpoint, func)

    // Should have multi-line JSON
    expect(result.split('\n').length).toBeGreaterThan(3)
  })

  it('should handle complex payloads', () => {
    const func: PythonFunction = {
      name: 'authenticate',
      parameters: [
        { name: 'email', type: 'str', required: true },
        { name: 'password', type: 'str', required: true },
        { name: 'remember', type: 'bool', required: true },
      ],
      isAsync: false,
      hasDecorators: false,
      lineNumber: 1,
    }

    const endpoint = 'https://api.example.com/auth'
    const result = generateCurlExample(endpoint, func)

    expect(result).toContain('"email": "user@example.com"')
    expect(result).toContain('"password": "example"')
    expect(result).toContain('"remember": true')
  })
})
