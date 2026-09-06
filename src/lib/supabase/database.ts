export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          display_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      scans: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          captured_at: string;
          status: "processing" | "complete" | "failed";
          quality: Json;
          summary: Json;
          pose_results: Json;
          view_image_paths: Json;
          measurements: Json;
          body_findings: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          captured_at: string;
          status?: "processing" | "complete" | "failed";
          quality?: Json;
          summary?: Json;
          pose_results?: Json;
          view_image_paths?: Json;
          measurements?: Json;
          body_findings?: Json;
        };
        Update: {
          status?: "processing" | "complete" | "failed";
          quality?: Json;
          summary?: Json;
          pose_results?: Json;
          view_image_paths?: Json;
          measurements?: Json;
          body_findings?: Json;
        };
        Relationships: [];
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          check_in_date: string;
          discomfort: number;
          posture_control: number;
          energy: number;
          red_flags: boolean;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          check_in_date: string;
          discomfort: number;
          posture_control: number;
          energy: number;
          red_flags?: boolean;
          notes?: string;
          created_at?: string;
        };
        Update: {
          discomfort?: number;
          posture_control?: number;
          energy?: number;
          red_flags?: boolean;
          notes?: string;
        };
        Relationships: [];
      };
      workout_completions: {
        Row: {
          id: string;
          user_id: string;
          completion_date: string;
          item_name: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          completion_date: string;
          item_name: string;
          completed_at?: string;
        };
        Update: {
          completion_date?: string;
          item_name?: string;
          completed_at?: string;
        };
        Relationships: [];
      };
      weekly_reviews: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          summary: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          summary?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          summary?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: string;
          price_id: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          price_id?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          price_id?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          event_type: string;
          status: "processing" | "processed" | "failed";
          processing_started_at: string;
          processed_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          event_type: string;
          status?: "processing" | "processed" | "failed";
          processing_started_at?: string;
          processed_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          event_type?: string;
          status?: "processing" | "processed" | "failed";
          processing_started_at?: string;
          processed_at?: string | null;
          last_error?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
