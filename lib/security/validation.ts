// ABOUTME: Enhanced input validation utilities for security
// ABOUTME: Prevents injection attacks and validates user inputs

import { z } from 'zod'

/**
 * Validate GitHub repository URL
 * Only allows github.com URLs with proper format
 */
export const validateGitHubUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)

    // Only allow github.com
    if (parsed.hostname !== 'github.com') {
      return false
    }

    // Check for valid repo path format: /owner/repo
    const pathMatch = parsed.pathname.match(/^\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)\/?$/)
    if (!pathMatch) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Validate Python file path
 * Prevents directory traversal and ensures .py extension
 */
export const validatePythonFilePath = (filePath: string): boolean => {
  // Prevent directory traversal
  if (filePath.includes('..') || filePath.includes('//')) {
    return false
  }

  // Must end with .py
  if (!filePath.endsWith('.py')) {
    return false
  }

  // Must not start with slash (should be relative path)
  if (filePath.startsWith('/')) {
    return false
  }

  // Check for suspicious characters
  const suspiciousChars = /[<>:"|?*\0]/
  if (suspiciousChars.test(filePath)) {
    return false
  }

  // Must be reasonable length
  if (filePath.length > 500) {
    return false
  }

  return true
}

/**
 * Validate Python function name
 * Must follow Python naming conventions
 */
export const validateFunctionName = (name: string): boolean => {
  // Must start with letter or underscore
  // Can contain letters, numbers, underscores
  const pythonIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/

  if (!pythonIdentifier.test(name)) {
    return false
  }

  // Reasonable length limit
  if (name.length > 100) {
    return false
  }

  // Prevent Python keywords (basic check)
  const pythonKeywords = ['import', 'from', 'class', 'def', 'if', 'else', 'for', 'while', 'return', 'yield', 'lambda', 'with', 'as', 'try', 'except', 'finally', 'raise', 'assert', 'pass', 'break', 'continue', 'del', 'global', 'nonlocal']
  if (pythonKeywords.includes(name.toLowerCase())) {
    return false
  }

  return true
}

/**
 * Validate environment variable key
 * Must follow Unix env var naming conventions
 */
export const validateEnvKey = (key: string): boolean => {
  // Must be uppercase letters, numbers, and underscores
  // Must start with a letter or underscore
  const envVarPattern = /^[A-Z_][A-Z0-9_]*$/

  if (!envVarPattern.test(key)) {
    return false
  }

  // Reasonable length
  if (key.length > 100) {
    return false
  }

  return true
}

/**
 * Validate environment variable value
 * Checks for suspicious content and size limits
 */
export const validateEnvValue = (value: string): boolean => {
  // Size limit (10KB)
  if (value.length > 10000) {
    return false
  }

  // Prevent null bytes
  if (value.includes('\0')) {
    return false
  }

  return true
}

/**
 * Sanitize environment variables object
 * Returns only valid key-value pairs
 */
export const sanitizeEnvVars = (envVars: Record<string, string>): Record<string, string> => {
  const sanitized: Record<string, string> = {}

  for (const [key, value] of Object.entries(envVars)) {
    if (validateEnvKey(key) && validateEnvValue(value)) {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Validate request payload size
 */
export const MAX_PAYLOAD_SIZE = 1024 * 1024 // 1MB

export const validatePayloadSize = (data: unknown): boolean => {
  try {
    const jsonString = JSON.stringify(data)
    return jsonString.length <= MAX_PAYLOAD_SIZE
  } catch {
    // If data cannot be stringified, reject it
    return false
  }
}

/**
 * Enhanced GitHub URL schema with strict validation
 */
export const githubUrlSchema = z.string()
  .url('Invalid URL format')
  .refine(validateGitHubUrl, 'Must be a valid GitHub repository URL (github.com/owner/repo)')

/**
 * Enhanced file path schema
 */
export const filePathSchema = z.string()
  .min(1, 'File path is required')
  .refine(validatePythonFilePath, 'Invalid Python file path. Must be a .py file without directory traversal.')

/**
 * Enhanced function name schema
 */
export const functionNameSchema = z.string()
  .min(1, 'Function name is required')
  .refine(validateFunctionName, 'Invalid Python function name. Must follow Python naming conventions.')

/**
 * Enhanced environment variables schema
 */
export const envVarsSchema = z.record(z.string(), z.string())
  .refine(
    (vars) => Object.keys(vars).every(validateEnvKey),
    'Invalid environment variable key. Must be uppercase letters, numbers, and underscores.'
  )
  .refine(
    (vars) => Object.values(vars).every(validateEnvValue),
    'Invalid environment variable value. Value too large or contains invalid characters.'
  )
  .refine(
    (vars) => Object.keys(vars).length <= 50,
    'Too many environment variables. Maximum 50 allowed.'
  )
  .optional()
