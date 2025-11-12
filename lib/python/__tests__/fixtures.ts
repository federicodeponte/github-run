// ABOUTME: Test fixtures for Python parser and example generator tests
// ABOUTME: Contains sample Python code snippets for testing function extraction

export const pythonFixtures = {
  // Basic function with no parameters
  noParams: `
def main():
    """Simple function with no parameters"""
    return {"status": "ok"}
`,

  // Function with simple parameters
  simpleParams: `
def greet(name: str, age: int = 25):
    """Greet a person"""
    return f"Hello {name}, you are {age} years old"
`,

  // Function with complex type hints
  complexTypes: `
def process_data(
    url: str,
    headers: dict = {},
    timeout: int = 30,
    retry: bool = True
):
    """Process data from URL"""
    return {"url": url, "success": True}
`,

  // Async function
  asyncFunction: `
async def fetch_data(endpoint: str):
    """Async function to fetch data"""
    return {"data": "fetched"}
`,

  // Function with decorators
  decoratedFunction: `
@app.route('/api')
@require_auth
def api_handler(request: dict):
    """Decorated API handler"""
    return {"response": "data"}
`,

  // Multiple functions
  multipleFunctions: `
def first_function(x: int):
    """First function"""
    return x * 2

def second_function(y: str = "default"):
    """Second function"""
    return y.upper()

def third_function():
    """Third function"""
    return True
`,

  // Function with List and Dict types
  advancedTypes: `
def analyze(
    items: list,
    config: dict,
    flags: list = [],
    metadata: dict = {}
):
    """Analyze items with config"""
    return {"count": len(items)}
`,

  // Function with underscore in name
  underscoredName: `
def _private_helper(data: str):
    """Private helper function"""
    return data.strip()

def public_function(input: str):
    """Public function"""
    return _private_helper(input)
`,

  // Function with multiline parameters (edge case)
  multilineParams: `
def complex_function(
    param1: str,
    param2: int,
    param3: bool = False,
    param4: dict = {},
):
    """Function with multiline params"""
    return True
`,

  // SEO health checker example (real-world)
  seoHealthChecker: `
def analyze_url(url: str):
    """Analyze SEO health of a URL"""
    return {
        "url": url,
        "score": 85,
        "grade": "B",
        "issues": []
    }
`,

  // Function with no type hints
  noTypeHints: `
def legacy_function(a, b, c=10):
    """Old function without types"""
    return a + b + c
`,

  // Class methods (should be ignored)
  classMethods: `
class MyClass:
    def method_one(self, x: int):
        """Class method - should be ignored"""
        return x

    @staticmethod
    def static_method(y: str):
        """Static method - should be ignored"""
        return y
`,

  // Nested function (should be ignored based on indentation)
  nestedFunction: `
def outer():
    """Outer function"""
    def inner():
        """Nested function - should be ignored"""
        return True
    return inner()
`,

  // Function with return type annotation
  returnTypeAnnotation: `
def get_user(user_id: int) -> dict:
    """Get user by ID"""
    return {"id": user_id, "name": "John"}
`,

  // Real-world ML inference example
  mlInference: `
def predict(
    image_url: str,
    model: str = "default",
    threshold: float = 0.5
):
    """Run ML inference on image"""
    return {
        "predictions": [],
        "confidence": threshold
    }
`,
}

// Expected parsing results for validation
export const expectedResults = {
  noParams: {
    name: 'main',
    parameters: [],
    isAsync: false,
    hasDecorators: false,
  },

  simpleParams: {
    name: 'greet',
    parameters: [
      { name: 'name', type: 'str', required: true },
      { name: 'age', type: 'int', defaultValue: '25', required: false },
    ],
    isAsync: false,
    hasDecorators: false,
  },

  complexTypes: {
    name: 'process_data',
    parameters: [
      { name: 'url', type: 'str', required: true },
      { name: 'headers', type: 'dict', defaultValue: '{}', required: false },
      { name: 'timeout', type: 'int', defaultValue: '30', required: false },
      { name: 'retry', type: 'bool', defaultValue: 'True', required: false },
    ],
    isAsync: false,
    hasDecorators: false,
  },

  asyncFunction: {
    name: 'fetch_data',
    parameters: [
      { name: 'endpoint', type: 'str', required: true },
    ],
    isAsync: true,
    hasDecorators: false,
  },

  decoratedFunction: {
    name: 'api_handler',
    parameters: [
      { name: 'request', type: 'dict', required: true },
    ],
    isAsync: false,
    hasDecorators: true,
  },
}
