export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: number
          master_pin_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          master_pin_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          master_pin_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_public_state: {
        Row: {
          current_location_id: string | null
          current_location_name: string | null
          day: number
          id: number
          objective: string
          share_location: boolean
          time: string
          updated_at: string
        }
        Insert: {
          current_location_id?: string | null
          current_location_name?: string | null
          day?: number
          id?: number
          objective?: string
          share_location?: boolean
          time?: string
          updated_at?: string
        }
        Update: {
          current_location_id?: string | null
          current_location_name?: string | null
          day?: number
          id?: number
          objective?: string
          share_location?: boolean
          time?: string
          updated_at?: string
        }
        Relationships: []
      }
      character_sheets: {
        Row: {
          data: Json
          player_id: string
          updated_at: string
          version: number
        }
        Insert: {
          data?: Json
          player_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          data?: Json
          player_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_sheets_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clue_deliveries: {
        Row: {
          active: boolean
          clue_id: string
          created_at: string
          description: string
          document_title: string | null
          id: string
          player_id: string
          private_message: string
          title: string
        }
        Insert: {
          active?: boolean
          clue_id: string
          created_at?: string
          description?: string
          document_title?: string | null
          id?: string
          player_id: string
          private_message?: string
          title: string
        }
        Update: {
          active?: boolean
          clue_id?: string
          created_at?: string
          description?: string
          document_title?: string | null
          id?: string
          player_id?: string
          private_message?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "clue_deliveries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_deliveries: {
        Row: {
          active: boolean
          created_at: string
          description: string
          document_id: string
          id: string
          player_id: string
          private_message: string
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          document_id: string
          id?: string
          player_id: string
          private_message?: string
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          document_id?: string
          id?: string
          player_id?: string
          private_message?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_deliveries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      map_regions: {
        Row: {
          floor: string
          height: number
          id: string
          label: string
          location_id: string
          updated_at: string
          width: number
          x: number
          y: number
        }
        Insert: {
          floor: string
          height?: number
          id?: string
          label?: string
          location_id: string
          updated_at?: string
          width?: number
          x?: number
          y?: number
        }
        Update: {
          floor?: string
          height?: number
          id?: string
          label?: string
          location_id?: string
          updated_at?: string
          width?: number
          x?: number
          y?: number
        }
        Relationships: []
      }
      map_reveals: {
        Row: {
          floor: string
          id: string
          location_id: string
          revealed: boolean
          target_player_id: string | null
          updated_at: string
        }
        Insert: {
          floor: string
          id?: string
          location_id: string
          revealed?: boolean
          target_player_id?: string | null
          updated_at?: string
        }
        Update: {
          floor?: string
          id?: string
          location_id?: string
          revealed?: boolean
          target_player_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_reveals_target_player_id_fkey"
            columns: ["target_player_id"]
            isOneToOne: false
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      master_sessions: {
        Row: {
          created_at: string
          expires_at: string
          last_seen: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          last_seen?: string
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          last_seen?: string
          token?: string
        }
        Relationships: []
      }
      media_broadcasts: {
        Row: {
          active: boolean
          caption: string
          created_at: string
          id: string
          image_data: string
          target_player_id: string | null
          title: string
        }
        Insert: {
          active?: boolean
          caption?: string
          created_at?: string
          id?: string
          image_data: string
          target_player_id?: string | null
          title?: string
        }
        Update: {
          active?: boolean
          caption?: string
          created_at?: string
          id?: string
          image_data?: string
          target_player_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_broadcasts_target_player_id_fkey"
            columns: ["target_player_id"]
            isOneToOne: false
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          kind: string
          player_id: string
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          player_id: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          player_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          player_id: string
          share_with_master: boolean
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          player_id: string
          share_with_master?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          player_id?: string
          share_with_master?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_notes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          can_edit_sheet: boolean
          character_name: string
          created_at: string
          id: string
          last_seen: string | null
          master_note: string
          pin_hash: string
          player_name: string
          role_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          can_edit_sheet?: boolean
          character_name?: string
          created_at?: string
          id?: string
          last_seen?: string | null
          master_note?: string
          pin_hash: string
          player_name: string
          role_type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          can_edit_sheet?: boolean
          character_name?: string
          created_at?: string
          id?: string
          last_seen?: string | null
          master_note?: string
          pin_hash?: string
          player_name?: string
          role_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_sessions: {
        Row: {
          created_at: string
          expires_at: string
          last_seen: string
          player_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          last_seen?: string
          player_id: string
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          last_seen?: string
          player_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_sessions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roll_log: {
        Row: {
          created_at: string
          formula: string
          id: string
          label: string
          payload: Json
          player_id: string
          total: number | null
          visibility: string
        }
        Insert: {
          created_at?: string
          formula?: string
          id?: string
          label: string
          payload?: Json
          player_id: string
          total?: number | null
          visibility?: string
        }
        Update: {
          created_at?: string
          formula?: string
          id?: string
          label?: string
          payload?: Json
          player_id?: string
          total?: number | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "roll_log_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_assets: {
        Row: {
          asset_key: string
          kind: string
          public_url: string
          updated_at: string
        }
        Insert: {
          asset_key: string
          kind: string
          public_url?: string
          updated_at?: string
        }
        Update: {
          asset_key?: string
          kind?: string
          public_url?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      logout_session: {
        Args: { p_role: string; p_token: string }
        Returns: Json
      }
      master_clear_all_media: { Args: { p_token: string }; Returns: Json }
      master_clear_media: {
        Args: { p_media_id: string; p_token: string }
        Returns: Json
      }
      master_dashboard: { Args: { p_token: string }; Returns: Json }
      master_delete_map_region: {
        Args: { p_floor: string; p_location_id: string; p_token: string }
        Returns: Json
      }
      master_delete_player: {
        Args: { p_player_id: string; p_token: string }
        Returns: Json
      }
      master_deliver_clue: {
        Args: { p_payload: Json; p_targets: string[]; p_token: string }
        Returns: Json
      }
      master_deliver_document: {
        Args: { p_payload: Json; p_targets: string[]; p_token: string }
        Returns: Json
      }
      master_get_player_detail: {
        Args: { p_player_id: string; p_token: string }
        Returns: Json
      }
      master_list_media: { Args: { p_token: string }; Returns: Json }
      master_login: { Args: { p_pin: string }; Returns: Json }
      master_revoke_delivery: {
        Args: { p_delivery_id: string; p_kind: string; p_token: string }
        Returns: Json
      }
      master_save_player_sheet: {
        Args: { p_data: Json; p_player_id: string; p_token: string }
        Returns: Json
      }
      master_send_media: {
        Args: {
          p_caption: string
          p_image_data: string
          p_targets: string[]
          p_title: string
          p_token: string
        }
        Returns: Json
      }
      master_send_notification: {
        Args: {
          p_body: string
          p_kind: string
          p_targets: string[]
          p_title: string
          p_token: string
        }
        Returns: Json
      }
      master_set_map_region: {
        Args: { p_payload: Json; p_token: string }
        Returns: Json
      }
      master_set_map_reveal: {
        Args: {
          p_floor: string
          p_location_id: string
          p_revealed: boolean
          p_targets?: string[]
          p_token: string
        }
        Returns: Json
      }
      master_set_shared_asset: {
        Args: {
          p_asset_key: string
          p_kind: string
          p_public_url: string
          p_token: string
        }
        Returns: Json
      }
      master_sync_public_state: {
        Args: { p_payload: Json; p_token: string }
        Returns: Json
      }
      master_upsert_player: {
        Args: { p_payload: Json; p_token: string }
        Returns: Json
      }
      player_bootstrap: { Args: { p_token: string }; Returns: Json }
      player_delete_note: {
        Args: { p_note_id: string; p_token: string }
        Returns: Json
      }
      player_log_roll: {
        Args: { p_payload: Json; p_token: string }
        Returns: Json
      }
      player_login: { Args: { p_pin: string }; Returns: Json }
      player_mark_notification: {
        Args: { p_notification_id: string; p_token: string }
        Returns: Json
      }
      player_media_feed: {
        Args: { p_known_ids?: string[]; p_token: string }
        Returns: Json
      }
      player_save_note: {
        Args: { p_payload: Json; p_token: string }
        Returns: Json
      }
      player_save_sheet: {
        Args: { p_data: Json; p_token: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
