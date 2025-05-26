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
      accounts: {
        Row: {
          id: string
          type: 'subscription' | 'purchase'
          name: string
          details: Json
          subscription_date: string
          expiry_date: string
          price: Json
          linked_packages: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'subscription' | 'purchase'
          name: string
          details?: Json
          subscription_date: string
          expiry_date: string
          price: Json
          linked_packages?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'subscription' | 'purchase'
          name?: string
          details?: Json
          subscription_date?: string
          expiry_date?: string
          price?: Json
          linked_packages?: number
          created_at?: string
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          account_id: string
          type: 'subscription' | 'purchase'
          name: string
          details: Json
          price: Json
          subscribed_customers: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          account_id: string
          type: 'subscription' | 'purchase'
          name: string
          details?: Json
          price: Json
          subscribed_customers?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          type?: 'subscription' | 'purchase'
          name?: string
          details?: Json
          price?: Json
          subscribed_customers?: number
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          customer_id: string
          package_id: string
          start_date: string
          end_date: string
          duration: number
          status: 'active' | 'expired' | 'sold'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          package_id: string
          start_date: string
          end_date: string
          duration: number
          status: 'active' | 'expired' | 'sold'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          package_id?: string
          start_date?: string
          end_date?: string
          duration?: number
          status?: 'active' | 'expired' | 'sold'
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          password: string
          role: 'admin' | 'user'
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          password: string
          role: 'admin' | 'user'
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password?: string
          role?: 'admin' | 'user'
          created_at?: string
          last_login?: string | null
        }
      }
    }
  }
}