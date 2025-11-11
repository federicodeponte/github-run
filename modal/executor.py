"""
GitHub Run MVP - Modal.com Executor

Simple Python function executor using Modal.com
"""

import modal

app = modal.App("github-run-mvp")

# Base image with FastAPI and common packages
# Includes popular libraries for web scraping, data science, and API integrations
image = modal.Image.debian_slim().pip_install(
    "fastapi[standard]",
    "requests",
    "pydantic",
    "beautifulsoup4",
    "lxml",
    "openai",
    "fpdf2",
    "pandas",
    "numpy",
    "pillow",
)

# In-memory storage for deployed functions (MVP - functions persist during container lifetime)
# For production, use Modal Volumes or external database
deployed_functions = {}


@app.function(image=image)
@modal.asgi_app()
def web():
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import json

    web_app = FastAPI(title="GitHub Run MVP")

    # Configure CORS to allow requests from Vercel
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins for MVP
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class DeployRequest(BaseModel):
        code: str
        owner: str
        repo: str
        function_name: str
        env_vars: dict = {}  # Optional environment variables

    class ExecuteRequest(BaseModel):
        pass  # Dynamic arguments

    @web_app.post("/deploy")
    async def deploy(request: DeployRequest):
        """Deploy a Python function"""
        try:
            # Create namespaced key: owner/repo/function_name
            function_key = f"{request.owner}/{request.repo}/{request.function_name}"

            # Store the function code and env vars
            deployed_functions[function_key] = {
                "code": request.code,
                "env_vars": request.env_vars
            }

            # Generate namespaced endpoint URL
            endpoint = f"https://scaile--github-run-mvp-web.modal.run/execute/{request.owner}/{request.repo}/{request.function_name}"

            import time
            deployment_id = f"deploy_{int(time.time())}"

            return {
                "success": True,
                "endpoint": endpoint,
                "deployment_id": deployment_id
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @web_app.post("/execute/{owner}/{repo}/{function_name}")
    async def execute(owner: str, repo: str, function_name: str, request_data: dict):
        """Execute a deployed function"""
        try:
            import os

            # Create namespaced key
            function_key = f"{owner}/{repo}/{function_name}"

            # Get the function data
            function_data = deployed_functions.get(function_key)

            if not function_data:
                raise HTTPException(
                    status_code=404,
                    detail=f"Function '{function_key}' not found. Please deploy it first."
                )

            # Handle backward compatibility (old deployments only stored code as string)
            if isinstance(function_data, str):
                code = function_data
                env_vars = {}
            else:
                code = function_data["code"]
                env_vars = function_data.get("env_vars", {})

            # Set environment variables
            original_env = {}
            for key, value in env_vars.items():
                original_env[key] = os.environ.get(key)
                os.environ[key] = str(value)

            try:
                # Create execution namespace
                namespace = {}

                # Execute the code
                exec(code, namespace)

                # Get the function
                if function_name not in namespace:
                    # List available functions for better error message
                    available_functions = [
                        name for name in namespace.keys()
                        if callable(namespace[name]) and not name.startswith('_')
                    ]

                    if available_functions:
                        available_list = ', '.join(available_functions)
                        raise HTTPException(
                            status_code=400,
                            detail=f"Function '{function_name}' not found. Available functions: {available_list}"
                        )
                    else:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Function '{function_name}' not found. No callable functions detected in code."
                        )

                user_function = namespace[function_name]

                # Execute with provided arguments
                result = user_function(**request_data)

                return {
                    "success": True,
                    "result": result
                }
            finally:
                # Restore original environment variables
                for key, original_value in original_env.items():
                    if original_value is None:
                        os.environ.pop(key, None)
                    else:
                        os.environ[key] = original_value

        except TypeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid arguments: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")

    @web_app.get("/health")
    async def health():
        """Health check"""
        try:
            function_list = list(deployed_functions.keys())
        except:
            function_list = []
        return {
            "status": "healthy",
            "deployed_functions": function_list
        }

    return web_app
