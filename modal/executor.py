"""
GitHub Run MVP - Modal.com Executor

Simple Python function executor using Modal.com
"""

import modal

app = modal.App("github-run-mvp")

# Base image with FastAPI and common packages
image = modal.Image.debian_slim().pip_install(
    "fastapi[standard]",
    "requests",
    "pydantic"
)

# In-memory storage for deployed functions (MVP - functions persist during container lifetime)
# For production, use Modal Volumes or external database
deployed_functions = {}


@app.function(image=image)
@modal.asgi_app()
def web():
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel
    import json

    web_app = FastAPI(title="GitHub Run MVP")

    class DeployRequest(BaseModel):
        code: str
        owner: str
        repo: str
        function_name: str

    class ExecuteRequest(BaseModel):
        pass  # Dynamic arguments

    @web_app.post("/deploy")
    async def deploy(request: DeployRequest):
        """Deploy a Python function"""
        try:
            # Create namespaced key: owner/repo/function_name
            function_key = f"{request.owner}/{request.repo}/{request.function_name}"

            # Store the function code
            deployed_functions[function_key] = request.code

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
            # Create namespaced key
            function_key = f"{owner}/{repo}/{function_name}"

            # Get the function code
            code = deployed_functions.get(function_key)

            if not code:
                raise HTTPException(
                    status_code=404,
                    detail=f"Function '{function_key}' not found. Please deploy it first."
                )

            # Create execution namespace
            namespace = {}

            # Execute the code
            exec(code, namespace)

            # Get the function
            if function_name not in namespace:
                raise HTTPException(
                    status_code=400,
                    detail=f"Function '{function_name}' not defined in code"
                )

            user_function = namespace[function_name]

            # Execute with provided arguments
            result = user_function(**request_data)

            return {
                "success": True,
                "result": result
            }

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
