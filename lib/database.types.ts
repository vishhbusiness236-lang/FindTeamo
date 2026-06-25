export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          experience_level: string | null;
          hours_per_week: number | null;
          looking_for: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          experience_level?: string | null;
          hours_per_week?: number | null;
          looking_for?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          experience_level?: string | null;
          hours_per_week?: number | null;
          looking_for?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      skills: {
        Row: {
          id: number;
          profile_id: string;
          skill_name: string;
          proficiency: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          profile_id: string;
          skill_name: string;
          proficiency: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          profile_id?: string;
          skill_name?: string;
          proficiency?: string;
          created_at?: string;
        };
      };
      interests: {
        Row: {
          id: number;
          profile_id: string;
          interest_name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          profile_id: string;
          interest_name: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          profile_id?: string;
          interest_name?: string;
          created_at?: string;
        };
      };
      goals: {
        Row: {
          id: number;
          profile_id: string;
          goal_name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          profile_id: string;
          goal_name: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          profile_id?: string;
          goal_name?: string;
          created_at?: string;
        };
      };
      connections: {
        Row: {
          id: number;
          from_user_id: string;
          to_user_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          from_user_id: string;
          to_user_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          from_user_id?: string;
          to_user_id?: string;
          status?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
