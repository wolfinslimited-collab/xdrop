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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      agent_manifests: {
        Row: {
          agent_id: string
          created_at: string
          guardrails: Json
          id: string
          tool_permissions: Json
          triggers: Json
          updated_at: string
          version: string
          workflow_steps: Json
        }
        Insert: {
          agent_id: string
          created_at?: string
          guardrails?: Json
          id?: string
          tool_permissions?: Json
          triggers?: Json
          updated_at?: string
          version?: string
          workflow_steps?: Json
        }
        Update: {
          agent_id?: string
          created_at?: string
          guardrails?: Json
          id?: string
          tool_permissions?: Json
          triggers?: Json
          updated_at?: string
          version?: string
          workflow_steps?: Json
        }
        Relationships: [
          {
            foreignKeyName: "agent_manifests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_nfts: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          image_url: string | null
          metadata_uri: string | null
          mint_address: string | null
          mint_tx_hash: string | null
          minted_at: string | null
          serial_number: number
          status: string
          token_name: string
          token_symbol: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          metadata_uri?: string | null
          mint_address?: string | null
          mint_tx_hash?: string | null
          minted_at?: string | null
          serial_number: number
          status?: string
          token_name: string
          token_symbol?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          metadata_uri?: string | null
          mint_address?: string | null
          mint_tx_hash?: string | null
          minted_at?: string | null
          serial_number?: number
          status?: string
          token_name?: string
          token_symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_nfts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_purchases: {
        Row: {
          agent_id: string
          expires_at: string | null
          id: string
          price_paid: number
          purchased_at: string
          subscription_status: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          expires_at?: string | null
          id?: string
          price_paid: number
          purchased_at?: string
          subscription_status?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          expires_at?: string | null
          id?: string
          price_paid?: number
          purchased_at?: string
          subscription_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_purchases_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_ratings: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          rating: number
          review: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_ratings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          agent_id: string
          completed_at: string | null
          created_at: string
          earnings: number | null
          id: string
          inputs: Json | null
          metrics: Json | null
          outputs: Json | null
          started_at: string | null
          status: string
          user_id: string
          verification_tier: number | null
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          created_at?: string
          earnings?: number | null
          id?: string
          inputs?: Json | null
          metrics?: Json | null
          outputs?: Json | null
          started_at?: string | null
          status?: string
          user_id: string
          verification_tier?: number | null
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          created_at?: string
          earnings?: number | null
          id?: string
          inputs?: Json | null
          metrics?: Json | null
          outputs?: Json | null
          started_at?: string | null
          status?: string
          user_id?: string
          verification_tier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_trials: {
        Row: {
          agent_id: string | null
          created_at: string
          expires_at: string
          id: string
          started_at: string
          status: string
          template_id: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          started_at?: string
          status?: string
          template_id: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          started_at?: string
          status?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_trials_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_wallets: {
        Row: {
          agent_name: string
          created_at: string
          id: string
          network: string
          sol_address: string
          sol_balance: number
          updated_at: string
          usdc_address: string
          usdc_balance: number
          user_id: string
        }
        Insert: {
          agent_name: string
          created_at?: string
          id?: string
          network?: string
          sol_address: string
          sol_balance?: number
          updated_at?: string
          usdc_address: string
          usdc_balance?: number
          user_id: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          id?: string
          network?: string
          sol_address?: string
          sol_balance?: number
          updated_at?: string
          usdc_address?: string
          usdc_balance?: number
          user_id?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          avatar: string | null
          category_id: string | null
          created_at: string
          creator_id: string
          description: string
          id: string
          is_trial: boolean
          monthly_return_max: number | null
          monthly_return_min: number | null
          name: string
          price: number
          purchased_at: string | null
          reliability_score: number | null
          required_integrations: string[] | null
          short_description: string | null
          status: string
          subscription_price: number | null
          template_id: string | null
          total_earnings: number | null
          total_runs: number | null
          trial_earnings_locked: number | null
          updated_at: string
          usdc_earnings: number | null
        }
        Insert: {
          avatar?: string | null
          category_id?: string | null
          created_at?: string
          creator_id: string
          description: string
          id?: string
          is_trial?: boolean
          monthly_return_max?: number | null
          monthly_return_min?: number | null
          name: string
          price?: number
          purchased_at?: string | null
          reliability_score?: number | null
          required_integrations?: string[] | null
          short_description?: string | null
          status?: string
          subscription_price?: number | null
          template_id?: string | null
          total_earnings?: number | null
          total_runs?: number | null
          trial_earnings_locked?: number | null
          updated_at?: string
          usdc_earnings?: number | null
        }
        Update: {
          avatar?: string | null
          category_id?: string | null
          created_at?: string
          creator_id?: string
          description?: string
          id?: string
          is_trial?: boolean
          monthly_return_max?: number | null
          monthly_return_min?: number | null
          name?: string
          price?: number
          purchased_at?: string | null
          reliability_score?: number | null
          required_integrations?: string[] | null
          short_description?: string | null
          status?: string
          subscription_price?: number | null
          template_id?: string | null
          total_earnings?: number | null
          total_runs?: number | null
          trial_earnings_locked?: number | null
          updated_at?: string
          usdc_earnings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "agent_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_sessions: {
        Row: {
          config: Json
          created_at: string
          id: string
          messages: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          messages?: Json
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          messages?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      game_battle_logs: {
        Row: {
          attacker_id: string | null
          created_at: string
          damage: number
          defender_id: string | null
          id: string
          message: string
          room_id: string
          round: number
        }
        Insert: {
          attacker_id?: string | null
          created_at?: string
          damage?: number
          defender_id?: string | null
          id?: string
          message: string
          room_id: string
          round: number
        }
        Update: {
          attacker_id?: string | null
          created_at?: string
          damage?: number
          defender_id?: string | null
          id?: string
          message?: string
          room_id?: string
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_battle_logs_attacker_id_fkey"
            columns: ["attacker_id"]
            isOneToOne: false
            referencedRelation: "game_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_battle_logs_defender_id_fkey"
            columns: ["defender_id"]
            isOneToOne: false
            referencedRelation: "game_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_battle_logs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_bets: {
        Row: {
          agent_id: string
          amount: number
          created_at: string
          id: string
          payout: number | null
          room_id: string
          status: string
          user_id: string
        }
        Insert: {
          agent_id: string
          amount: number
          created_at?: string
          id?: string
          payout?: number | null
          room_id: string
          status?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          amount?: number
          created_at?: string
          id?: string
          payout?: number | null
          room_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_bets_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_bets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_participants: {
        Row: {
          agent_id: string
          attack_power: number
          defense: number
          health: number
          id: string
          joined_at: string
          room_id: string
          score: number
          status: string
          user_id: string
        }
        Insert: {
          agent_id: string
          attack_power?: number
          defense?: number
          health?: number
          id?: string
          joined_at?: string
          room_id: string
          score?: number
          status?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          attack_power?: number
          defense?: number
          health?: number
          id?: string
          joined_at?: string
          room_id?: string
          score?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          id: string
          max_participants: number
          name: string
          round_number: number
          started_at: string | null
          status: string
          total_rounds: number
          winner_agent_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          max_participants?: number
          name: string
          round_number?: number
          started_at?: string | null
          status?: string
          total_rounds?: number
          winner_agent_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          max_participants?: number
          name?: string
          round_number?: number
          started_at?: string | null
          status?: string
          total_rounds?: number
          winner_agent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_rooms_winner_agent_id_fkey"
            columns: ["winner_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          credits: number
          display_name: string | null
          id: string
          is_creator: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          credits?: number
          display_name?: string | null
          id: string
          is_creator?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          credits?: number
          display_name?: string | null
          id?: string
          is_creator?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      run_cards: {
        Row: {
          agent_id: string
          agent_run_id: string
          created_at: string
          earnings_shown: number | null
          id: string
          is_public: boolean | null
          likes: number | null
          replies: number | null
          reposts: number | null
          summary: string | null
          title: string
          user_id: string
          verification_tier: number | null
        }
        Insert: {
          agent_id: string
          agent_run_id: string
          created_at?: string
          earnings_shown?: number | null
          id?: string
          is_public?: boolean | null
          likes?: number | null
          replies?: number | null
          reposts?: number | null
          summary?: string | null
          title: string
          user_id: string
          verification_tier?: number | null
        }
        Update: {
          agent_id?: string
          agent_run_id?: string
          created_at?: string
          earnings_shown?: number | null
          id?: string
          is_public?: boolean | null
          likes?: number | null
          replies?: number | null
          reposts?: number | null
          summary?: string | null
          title?: string
          user_id?: string
          verification_tier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "run_cards_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_cards_agent_run_id_fkey"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      run_logs: {
        Row: {
          agent_run_id: string
          created_at: string
          id: string
          log_level: string | null
          message: string
          metadata: Json | null
        }
        Insert: {
          agent_run_id: string
          created_at?: string
          id?: string
          log_level?: string | null
          message: string
          metadata?: Json | null
        }
        Update: {
          agent_run_id?: string
          created_at?: string
          id?: string
          log_level?: string | null
          message?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "run_logs_agent_run_id_fkey"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      social_bots: {
        Row: {
          api_endpoint: string | null
          api_key: string | null
          avatar: string
          badge: string
          badge_color: string
          bio: string | null
          created_at: string
          followers: number
          following: number
          handle: string
          id: string
          name: string
          owner_id: string
          status: string
          updated_at: string
          verified: boolean
          voice_enabled: boolean
          voice_id: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: string | null
          avatar?: string
          badge?: string
          badge_color?: string
          bio?: string | null
          created_at?: string
          followers?: number
          following?: number
          handle: string
          id?: string
          name: string
          owner_id: string
          status?: string
          updated_at?: string
          verified?: boolean
          voice_enabled?: boolean
          voice_id?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string | null
          avatar?: string
          badge?: string
          badge_color?: string
          bio?: string | null
          created_at?: string
          followers?: number
          following?: number
          handle?: string
          id?: string
          name?: string
          owner_id?: string
          status?: string
          updated_at?: string
          verified?: boolean
          voice_enabled?: boolean
          voice_id?: string | null
        }
        Relationships: []
      }
      social_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "social_bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "social_bots"
            referencedColumns: ["id"]
          },
        ]
      }
      social_interactions: {
        Row: {
          bot_id: string
          created_at: string
          id: string
          post_id: string
          reply_post_id: string | null
          type: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          id?: string
          post_id: string
          reply_post_id?: string | null
          type: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          id?: string
          post_id?: string
          reply_post_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_interactions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "social_bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_interactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_interactions_reply_post_id_fkey"
            columns: ["reply_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          audio_url: string | null
          bot_id: string
          content: string
          created_at: string
          id: string
          likes: number
          parent_post_id: string | null
          replies: number
          reposts: number
        }
        Insert: {
          audio_url?: string | null
          bot_id: string
          content: string
          created_at?: string
          id?: string
          likes?: number
          parent_post_id?: string | null
          replies?: number
          reposts?: number
        }
        Update: {
          audio_url?: string | null
          bot_id?: string
          content?: string
          created_at?: string
          id?: string
          likes?: number
          parent_post_id?: string | null
          replies?: number
          reposts?: number
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "social_bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          address: string
          balance: number
          created_at: string
          currency: string
          id: string
          network: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          network?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          network?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_metadata?: Json
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      deduct_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      has_purchased_agent: { Args: { _agent_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_agent_creator: { Args: { _agent_id: string }; Returns: boolean }
      next_nft_serial: { Args: { p_agent_name: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
