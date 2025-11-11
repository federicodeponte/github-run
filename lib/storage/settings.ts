// ABOUTME: Client-side settings storage with encryption
// ABOUTME: Manages GitHub PAT and other user preferences securely

const SETTINGS_KEY = 'github-run-settings'

export interface Settings {
  githubToken?: string
}

/**
 * Simple encryption for browser storage (base64 for MVP)
 * In production, consider using Web Crypto API
 */
function encode(value: string): string {
  return btoa(value)
}

function decode(value: string): string {
  try {
    return atob(value)
  } catch {
    return ''
  }
}

/**
 * Get settings from localStorage
 */
export function getSettings(): Settings {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (!stored) {
      return {}
    }

    const decoded = decode(stored)
    return JSON.parse(decoded) as Settings
  } catch {
    return {}
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const encoded = encode(JSON.stringify(settings))
    localStorage.setItem(SETTINGS_KEY, encoded)
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

/**
 * Get GitHub token
 */
export function getGitHubToken(): string | undefined {
  return getSettings().githubToken
}

/**
 * Save GitHub token
 */
export function saveGitHubToken(token: string | undefined): void {
  const settings = getSettings()
  settings.githubToken = token
  saveSettings(settings)
}

/**
 * Clear all settings
 */
export function clearSettings(): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(SETTINGS_KEY)
}

/**
 * Validate GitHub PAT format
 * @param token - GitHub Personal Access Token
 * @returns true if format is valid
 */
export function isValidGitHubToken(token: string): boolean {
  // GitHub classic PATs start with ghp_
  // GitHub fine-grained PATs start with github_pat_
  // Old tokens are 40 characters hex
  const patterns = [
    /^ghp_[a-zA-Z0-9]{36}$/,
    /^github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}$/,
    /^[a-f0-9]{40}$/,
  ]

  return patterns.some(pattern => pattern.test(token))
}
