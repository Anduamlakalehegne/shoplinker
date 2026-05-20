/**
 * Supabase generated database types for the `public` schema.
 *
 * Regenerate when the schema changes:
 *   npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/types/database.types.ts
 *   (or `--local` if using Supabase CLI linked to this repo)
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrderStatusDb = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          image_url: string;
          category: string;
          stock_qty: number;
          rating: number | null;
          rating_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          price: number;
          image_url: string;
          category: string;
          stock_qty?: number;
          rating?: number | null;
          rating_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          price?: number;
          image_url?: string;
          category?: string;
          stock_qty?: number;
          rating?: number | null;
          rating_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          total_amount: number;
          status: OrderStatusDb;
          delivery_address: string;
          phone: string;
          payment_ref: string | null;
          order_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_amount: number;
          status?: OrderStatusDb;
          delivery_address: string;
          phone: string;
          payment_ref?: string | null;
          order_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_amount?: number;
          status?: OrderStatusDb;
          delivery_address?: string;
          phone?: string;
          payment_ref?: string | null;
          order_notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_distinct_categories: {
        Args: Record<string, never>;
        Returns: { category: string }[];
      };
      place_order: {
        Args: {
          p_total_amount: number;
          p_delivery_address: string;
          p_phone: string;
          p_order_notes: string | null;
          p_items: { product_id: string; quantity: number; unit_price: number }[];
        };
        Returns: string; // returns the new order UUID
      };
      get_order_stats: {
        Args: {
          p_user_id: string;
        };
        Returns: { status: string; count: number; total_spent: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
