export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      app_users: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      backup_food_items: {
        Row: {
          calories: number | null;
          carbs: number | null;
          created_at: string | null;
          fat: number | null;
          fiber: number | null;
          id: string | null;
          name: string | null;
          protein: number | null;
          serving_size: number | null;
          serving_unit: string | null;
          updated_at: string | null;
        };
        Insert: {
          calories?: number | null;
          carbs?: number | null;
          created_at?: string | null;
          fat?: number | null;
          fiber?: number | null;
          id?: string | null;
          name?: string | null;
          protein?: number | null;
          serving_size?: number | null;
          serving_unit?: string | null;
          updated_at?: string | null;
        };
        Update: {
          calories?: number | null;
          carbs?: number | null;
          created_at?: string | null;
          fat?: number | null;
          fiber?: number | null;
          id?: string | null;
          name?: string | null;
          protein?: number | null;
          serving_size?: number | null;
          serving_unit?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      backup_meal_entries: {
        Row: {
          created_at: string | null;
          date: string | null;
          food_id: string | null;
          id: string | null;
          meal_type: string | null;
          notes: string | null;
          prepared_meal_id: string | null;
          quantity: number | null;
          recipe_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          date?: string | null;
          food_id?: string | null;
          id?: string | null;
          meal_type?: string | null;
          notes?: string | null;
          prepared_meal_id?: string | null;
          quantity?: number | null;
          recipe_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          date?: string | null;
          food_id?: string | null;
          id?: string | null;
          meal_type?: string | null;
          notes?: string | null;
          prepared_meal_id?: string | null;
          quantity?: number | null;
          recipe_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      backup_recipe_ingredients: {
        Row: {
          food_id: string | null;
          id: string | null;
          quantity: number | null;
          recipe_id: string | null;
        };
        Insert: {
          food_id?: string | null;
          id?: string | null;
          quantity?: number | null;
          recipe_id?: string | null;
        };
        Update: {
          food_id?: string | null;
          id?: string | null;
          quantity?: number | null;
          recipe_id?: string | null;
        };
        Relationships: [];
      };
      backup_recipes: {
        Row: {
          created_at: string | null;
          id: string | null;
          name: string | null;
          total_servings: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string | null;
          name?: string | null;
          total_servings?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string | null;
          name?: string | null;
          total_servings?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      food_items: {
        Row: {
          base_unit: string;
          calories: number;
          carbs: number | null;
          created_at: string | null;
          fat: number | null;
          fiber: number | null;
          id: string;
          name: string;
          protein: number | null;
          serving_label: string | null;
          serving_size: number | null;
        };
        Insert: {
          base_unit?: string;
          calories: number;
          carbs?: number | null;
          created_at?: string | null;
          fat?: number | null;
          fiber?: number | null;
          id?: string;
          name: string;
          protein?: number | null;
          serving_label?: string | null;
          serving_size?: number | null;
        };
        Update: {
          base_unit?: string;
          calories?: number;
          carbs?: number | null;
          created_at?: string | null;
          fat?: number | null;
          fiber?: number | null;
          id?: string;
          name?: string;
          protein?: number | null;
          serving_label?: string | null;
          serving_size?: number | null;
        };
        Relationships: [];
      };
      meal_entries: {
        Row: {
          created_at: string | null;
          date: string;
          food_id: string | null;
          id: string;
          meal_type: string;
          notes: string | null;
          prepared_meal_id: string | null;
          quantity: number;
          quantity_type: string;
          recipe_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          date: string;
          food_id?: string | null;
          id?: string;
          meal_type: string;
          notes?: string | null;
          prepared_meal_id?: string | null;
          quantity: number;
          quantity_type?: string;
          recipe_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          date?: string;
          food_id?: string | null;
          id?: string;
          meal_type?: string;
          notes?: string | null;
          prepared_meal_id?: string | null;
          quantity?: number;
          quantity_type?: string;
          recipe_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_entries_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "food_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_entries_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_entries_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes_with_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "app_users";
            referencedColumns: ["id"];
          }
        ];
      };
      recipe_ingredients: {
        Row: {
          food_id: string;
          id: string;
          quantity: number;
          recipe_id: string;
        };
        Insert: {
          food_id: string;
          id?: string;
          quantity: number;
          recipe_id: string;
        };
        Update: {
          food_id?: string;
          id?: string;
          quantity?: number;
          recipe_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "food_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes_with_batches";
            referencedColumns: ["id"];
          }
        ];
      };
      recipes: {
        Row: {
          base_recipe_name: string | null;
          batch_date: string | null;
          created_at: string | null;
          created_by_name: string | null;
          date_prepared: string | null;
          id: string;
          is_base_recipe: boolean | null;
          is_meal_prep: boolean | null;
          name: string;
          parent_recipe_id: string | null;
          total_calories: number | null;
          total_carbs: number | null;
          total_fat: number | null;
          total_fiber: number | null;
          total_protein: number | null;
          total_servings: number;
          total_weight: number | null;
          updated_at: string | null;
          user_id: string | null;
          weight_unit: string | null;
        };
        Insert: {
          base_recipe_name?: string | null;
          batch_date?: string | null;
          created_at?: string | null;
          created_by_name?: string | null;
          date_prepared?: string | null;
          id?: string;
          is_base_recipe?: boolean | null;
          is_meal_prep?: boolean | null;
          name: string;
          parent_recipe_id?: string | null;
          total_calories?: number | null;
          total_carbs?: number | null;
          total_fat?: number | null;
          total_fiber?: number | null;
          total_protein?: number | null;
          total_servings?: number;
          total_weight?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
          weight_unit?: string | null;
        };
        Update: {
          base_recipe_name?: string | null;
          batch_date?: string | null;
          created_at?: string | null;
          created_by_name?: string | null;
          date_prepared?: string | null;
          id?: string;
          is_base_recipe?: boolean | null;
          is_meal_prep?: boolean | null;
          name?: string;
          parent_recipe_id?: string | null;
          total_calories?: number | null;
          total_carbs?: number | null;
          total_fat?: number | null;
          total_fiber?: number | null;
          total_protein?: number | null;
          total_servings?: number;
          total_weight?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
          weight_unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "recipes_parent_recipe_id_fkey";
            columns: ["parent_recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipes_parent_recipe_id_fkey";
            columns: ["parent_recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes_with_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "app_users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      recipes_with_batches: {
        Row: {
          base_recipe_name: string | null;
          batch_count: number | null;
          batch_date: string | null;
          created_at: string | null;
          created_by_name: string | null;
          date_prepared: string | null;
          id: string | null;
          is_base_recipe: boolean | null;
          is_meal_prep: boolean | null;
          name: string | null;
          parent_name: string | null;
          parent_recipe_id: string | null;
          total_calories: number | null;
          total_carbs: number | null;
          total_fat: number | null;
          total_fiber: number | null;
          total_protein: number | null;
          total_servings: number | null;
          total_weight: number | null;
          updated_at: string | null;
          user_id: string | null;
          weight_unit: string | null;
        };
        Insert: {
          base_recipe_name?: string | null;
          batch_count?: never;
          batch_date?: string | null;
          created_at?: string | null;
          created_by_name?: string | null;
          date_prepared?: string | null;
          id?: string | null;
          is_base_recipe?: boolean | null;
          is_meal_prep?: boolean | null;
          name?: string | null;
          parent_name?: never;
          parent_recipe_id?: string | null;
          total_calories?: number | null;
          total_carbs?: number | null;
          total_fat?: number | null;
          total_fiber?: number | null;
          total_protein?: number | null;
          total_servings?: number | null;
          total_weight?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
          weight_unit?: string | null;
        };
        Update: {
          base_recipe_name?: string | null;
          batch_count?: never;
          batch_date?: string | null;
          created_at?: string | null;
          created_by_name?: string | null;
          date_prepared?: string | null;
          id?: string | null;
          is_base_recipe?: boolean | null;
          is_meal_prep?: boolean | null;
          name?: string | null;
          parent_name?: never;
          parent_recipe_id?: string | null;
          total_calories?: number | null;
          total_carbs?: number | null;
          total_fat?: number | null;
          total_fiber?: number | null;
          total_protein?: number | null;
          total_servings?: number | null;
          total_weight?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
          weight_unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "recipes_parent_recipe_id_fkey";
            columns: ["parent_recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipes_parent_recipe_id_fkey";
            columns: ["parent_recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes_with_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "app_users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      calculate_recipe_macros: {
        Args: { recipe_uuid: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
