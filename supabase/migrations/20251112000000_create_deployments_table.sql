-- Simple deployments table for MVP - tracks all function deployments
-- This is a standalone table (no foreign keys) for simplicity before auth is implemented
CREATE TABLE IF NOT EXISTS deployment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- GitHub repository information
  github_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  function_name TEXT NOT NULL,

  -- Deployment information
  endpoint TEXT NOT NULL,
  deployment_id TEXT NOT NULL,

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,

  -- Test result from automated testing
  test_success BOOLEAN,
  test_response JSONB,
  test_error TEXT
);

-- Create indexes for common queries
CREATE INDEX idx_deployment_history_created_at ON deployment_history(created_at DESC);
CREATE INDEX idx_deployment_history_status ON deployment_history(status);
CREATE INDEX idx_deployment_history_github_url ON deployment_history(github_url);
CREATE INDEX idx_deployment_history_function_name ON deployment_history(function_name);

-- Add comment for documentation
COMMENT ON TABLE deployment_history IS 'Tracks all Python function deployments from GitHub to Modal (MVP version without auth)';
