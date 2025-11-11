def calculator(operation="add", a=0, b=0):
    """A simple calculator function"""
    operations = {
        "add": a + b,
        "subtract": a - b,
        "multiply": a * b,
        "divide": a / b if b != 0 else "Error: Division by zero"
    }
    return {
        "operation": operation,
        "result": operations.get(operation, "Unknown operation")
    }
