import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nqxhzzoapruyzwssynvyqp.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xeGh6b2FwcnV5endzeW52eXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NzAwNDAsImV4cCI6MjA2NTM0NjA0MH0.gXJL3gcTIAQ93Bbh7f9tWmReXbeIUCSfYFMc_PQJ_sU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          name: string
          created_at: string
          created_by: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          created_by: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          created_by?: string
          is_active?: boolean
        }
      }
      room_participants: {
        Row: {
          id: string
          room_id: string
          user_id: string
          joined_at: string
          is_muted: boolean
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          joined_at?: string
          is_muted?: boolean
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          joined_at?: string
          is_muted?: boolean
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 