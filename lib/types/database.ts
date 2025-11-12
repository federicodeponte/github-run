// ABOUTME: TypeScript types for Supabase database schema
// ABOUTME: Auto-generated types to be updated via `supabase gen types typescript`

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      github_repos: {
        Row: {
          id: string
          user_id: string
          owner: string
          name: string
          full_name: string
          webhook_url: string | null
          webhook_secret: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          owner: string
          name: string
          full_name: string
          webhook_url?: string | null
          webhook_secret?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          owner?: string
          name?: string
          full_name?: string
          webhook_url?: string | null
          webhook_secret?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      functions: {
        Row: {
          id: string
          repo_id: string
          path: string
          name: string
          endpoint: string
          runtime: 'python' | 'nodejs' | 'deno'
          deployment_id: string | null
          status: 'active' | 'inactive' | 'failed'
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          repo_id: string
          path: string
          name: string
          endpoint: string
          runtime: 'python' | 'nodejs' | 'deno'
          deployment_id?: string | null
          status?: 'active' | 'inactive' | 'failed'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          repo_id?: string
          path?: string
          name?: string
          endpoint?: string
          runtime?: 'python' | 'nodejs' | 'deno'
          deployment_id?: string | null
          status?: 'active' | 'inactive' | 'failed'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      deployments: {
        Row: {
          id: string
          function_id: string
          status: 'pending' | 'building' | 'live' | 'failed'
          logs: string | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          function_id: string
          status?: 'pending' | 'building' | 'live' | 'failed'
          logs?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          function_id?: string
          status?: 'pending' | 'building' | 'live' | 'failed'
          logs?: string | null
          started_at?: string
          completed_at?: string | null
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          key_hash: string
          name: string
          scopes: string[]
          rate_limit: number
          created_at: string
          last_used_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          key_hash: string
          name: string
          scopes?: string[]
          rate_limit?: number
          created_at?: string
          last_used_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          key_hash?: string
          name?: string
          scopes?: string[]
          rate_limit?: number
          created_at?: string
          last_used_at?: string | null
        }
      }
      deployment_history: {
        Row: {
          id: string
          created_at: string
          github_url: string
          file_path: string
          function_name: string
          endpoint: string
          deployment_id: string
          status: 'success' | 'error'
          error_message: string | null
          test_success: boolean | null
          test_response: Json | null
          test_error: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          github_url: string
          file_path: string
          function_name: string
          endpoint: string
          deployment_id: string
          status: 'success' | 'error'
          error_message?: string | null
          test_success?: boolean | null
          test_response?: Json | null
          test_error?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          github_url?: string
          file_path?: string
          function_name?: string
          endpoint?: string
          deployment_id?: string
          status?: 'success' | 'error'
          error_message?: string | null
          test_success?: boolean | null
          test_response?: Json | null
          test_error?: string | null
        }
      }
    }
  }
}
