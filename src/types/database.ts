export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
      }
      inventory: {
        Row: {
          id: string
          name: string
          origin: string | null
          price: number
          quantity_available: number
          quantity_sold: number
          image_url: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          origin?: string | null
          price: number
          quantity_available?: number
          quantity_sold?: number
          image_url: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          origin?: string | null
          price?: number
          quantity_available?: number
          quantity_sold?: number
          image_url?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          action: string
          details: Json | null
          actor_id: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          action: string
          details?: Json | null
          actor_id?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          action?: string
          details?: Json | null
          actor_id?: string | null
          timestamp?: string
        }
      }
      idempotency_keys: {
        Row: {
          key: string
          request_hash: string
          response_status: number
          response_body: Json | null
          created_at: string
          expires_at?: string
          last_updated_at?: string
        }
        Insert: {
          key: string
          request_hash: string
          response_status: number
          response_body?: Json | null
          created_at?: string
          last_updated_at?: string
        }
        Update: {
          key?: string
          request_hash?: string
          response_status?: number
          response_body?: Json | null
          last_updated_at?: string
        }
      }
      rate_limits: {
        Row: {
          key: string
          count: number
          expires_at: string
        }
        Insert: {
          key: string
          count?: number
          expires_at: string
        }
        Update: {
          key?: string
          count?: number
          expires_at?: string
        }
      }

    }
    Functions: {
      decrement_stock_atomic: {
        Args: {
          p_item_id: string
          p_quantity: number
          p_actor_id: string
        }
        Returns: Database['public']['Tables']['inventory']['Row']
      }
      reset_inventory_atomic: {
        Args: {
          p_actor_id: string
          p_ip_address: string
        }
        Returns: void
      }
      claim_stale_idempotency_key: {
        Args: {
          p_key: string
        }
        Returns: Database['public']['Tables']['idempotency_keys']['Row'][]
      }
      decrement_stock_with_idempotency: {
        Args: {
          p_item_id: string
          p_quantity: number
          p_actor_id: string
          p_idempotency_key: string
        }
        Returns: Json
      }
    }
    Views: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface InventoryItem {
  id: string;
  name: string;
  origin: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  image_url: string;
  created_at: string;
  updated_at: string | null;
}

export interface Admin {
  id: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  actor_id: string;
  timestamp: string;
}
