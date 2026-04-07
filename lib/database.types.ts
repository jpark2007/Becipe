export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      recipes: {
        Row: {
          id: string;
          created_by: string;
          title: string;
          description: string | null;
          source_url: string | null;
          source_name: string | null;
          source_credit: string | null;
          source_type: 'manual' | 'url' | 'tiktok' | 'instagram' | 'facebook' | 'x' | 'youtube';
          ingredients: Ingredient[];
          steps: Step[];
          tips: Tip[];
          cover_image_url: string | null;
          video_url: string | null;
          prep_time_min: number | null;
          cook_time_min: number | null;
          servings: number | null;
          difficulty: 'easy' | 'medium' | 'hard' | null;
          cuisine: string | null;
          tags: string[];
          is_public: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['recipes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['recipes']['Insert']>;
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['follows']['Row'], 'created_at'>;
        Update: never;
      };
      recipe_tries: {
        Row: {
          id: string;
          user_id: string;
          recipe_id: string;
          rating: number;
          note: string | null;
          photo_url: string | null;
          tried_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['recipe_tries']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['recipe_tries']['Insert']>;
      };
      feed_items: {
        Row: {
          id: string;
          actor_id: string;
          verb: 'tried' | 'saved' | 'created';
          recipe_id: string;
          try_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['feed_items']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      comments: {
        Row: {
          id: string;
          try_id: string;
          user_id: string;
          body: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
      };
      saved_recipes: {
        Row: {
          user_id: string;
          recipe_id: string;
          saved_at: string;
        };
        Insert: Omit<Database['public']['Tables']['saved_recipes']['Row'], 'saved_at'>;
        Update: never;
      };
      recipe_ingredients_flat: {
        Row: {
          recipe_id: string;
          ingredient_name: string;
        };
        Insert: Database['public']['Tables']['recipe_ingredients_flat']['Row'];
        Update: never;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

export interface Ingredient {
  amount: string;
  unit: string;
  name: string;
}

export interface Step {
  order: number;
  instruction: string;
}

export interface Tip {
  text: string;
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type RecipeTry = Database['public']['Tables']['recipe_tries']['Row'];
export type FeedItem = Database['public']['Tables']['feed_items']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
