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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      competitions: {
        Row: {
          code: string | null
          current_season: Json | null
          emblem: string | null
          id: number
          last_updated: string
          name: string | null
          type: string | null
        }
        Insert: {
          code?: string | null
          current_season?: Json | null
          emblem?: string | null
          id: number
          last_updated?: string
          name?: string | null
          type?: string | null
        }
        Update: {
          code?: string | null
          current_season?: Json | null
          emblem?: string | null
          id?: number
          last_updated?: string
          name?: string | null
          type?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: number | null
          home_score: number | null
          home_team_id: number | null
          id: number
          last_updated: string
          matchday: number | null
          stage: string | null
          status: string | null
          utc_date: string | null
          winner: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: number | null
          home_score?: number | null
          home_team_id?: number | null
          id: number
          last_updated?: string
          matchday?: number | null
          stage?: string | null
          status?: string | null
          utc_date?: string | null
          winner?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: number | null
          home_score?: number | null
          home_team_id?: number | null
          id?: number
          last_updated?: string
          matchday?: number | null
          stage?: string | null
          status?: string | null
          utc_date?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "team_fan_counts"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "team_fan_counts"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          date_of_birth: string | null
          id: number
          last_updated: string
          name: string | null
          nationality: string | null
          position: string | null
          team_id: number | null
        }
        Insert: {
          date_of_birth?: string | null
          id: number
          last_updated?: string
          name?: string | null
          nationality?: string | null
          position?: string | null
          team_id?: number | null
        }
        Update: {
          date_of_birth?: string | null
          id?: number
          last_updated?: string
          name?: string | null
          nationality?: string | null
          position?: string | null
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_fan_counts"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          display_name: string
          email: string
          favorite_team_id: number | null
          id: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          display_name: string
          email: string
          favorite_team_id?: number | null
          id: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          display_name?: string
          email?: string
          favorite_team_id?: number | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_favorite_team_fk"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "team_fan_counts"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "profiles_favorite_team_fk"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scorers: {
        Row: {
          assists: number | null
          goals: number | null
          last_updated: string
          played_matches: number | null
          player_id: number
          team_id: number | null
        }
        Insert: {
          assists?: number | null
          goals?: number | null
          last_updated?: string
          played_matches?: number | null
          player_id: number
          team_id?: number | null
        }
        Update: {
          assists?: number | null
          goals?: number | null
          last_updated?: string
          played_matches?: number | null
          player_id?: number
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scorers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_fan_counts"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "scorers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      standings: {
        Row: {
          draw: number | null
          goal_difference: number | null
          goals_against: number | null
          goals_for: number | null
          group_name: string | null
          id: number
          last_updated: string
          lost: number | null
          played_games: number | null
          points: number | null
          position: number | null
          team_id: number | null
          won: number | null
        }
        Insert: {
          draw?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          group_name?: string | null
          id?: number
          last_updated?: string
          lost?: number | null
          played_games?: number | null
          points?: number | null
          position?: number | null
          team_id?: number | null
          won?: number | null
        }
        Update: {
          draw?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          group_name?: string | null
          id?: number
          last_updated?: string
          lost?: number | null
          played_games?: number | null
          points?: number | null
          position?: number | null
          team_id?: number | null
          won?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_fan_counts"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          area_name: string | null
          coach_name: string | null
          crest: string | null
          id: number
          last_updated: string
          name: string | null
          short_name: string | null
          tla: string | null
        }
        Insert: {
          area_name?: string | null
          coach_name?: string | null
          crest?: string | null
          id: number
          last_updated?: string
          name?: string | null
          short_name?: string | null
          tla?: string | null
        }
        Update: {
          area_name?: string | null
          coach_name?: string | null
          crest?: string | null
          id?: number
          last_updated?: string
          name?: string | null
          short_name?: string | null
          tla?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          country: string | null
          created_at: string | null
          display_name: string | null
          favorite_team_id: number | null
          id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_team_id?: number | null
          id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_team_id?: number | null
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_favorite_team_fk"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "team_fan_counts"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "profiles_favorite_team_fk"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_fan_counts: {
        Row: {
          short_name: string | null
          supporters: number | null
          team_crest: string | null
          team_id: number | null
          team_name: string | null
          tla: string | null
        }
        Relationships: []
      }
    }
    Functions: {
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
