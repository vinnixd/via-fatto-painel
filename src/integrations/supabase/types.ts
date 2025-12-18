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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          property_id: string | null
          read: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          property_id?: string | null
          read?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          property_id?: string | null
          read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "contacts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          email: string | null
          id: string
          phone: string | null
          property_id: string
          user_hash: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          property_id: string
          user_hash: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          property_id?: string
          user_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_items: number
          error_count: number
          errors: Json | null
          id: string
          processed_items: number
          status: string
          total_items: number
          updated_items: number
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_items?: number
          error_count?: number
          errors?: Json | null
          id?: string
          processed_items?: number
          status?: string
          total_items?: number
          updated_items?: number
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_items?: number
          error_count?: number
          errors?: Json | null
          id?: string
          processed_items?: number
          status?: string
          total_items?: number
          updated_items?: number
          user_id?: string | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          expires_at?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          invoice_number: string | null
          paid_at: string | null
          payment_method: string | null
          status: string
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date: string
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      portais: {
        Row: {
          ativo: boolean
          config: Json
          created_at: string
          formato_feed: Database["public"]["Enums"]["feed_format"]
          id: string
          metodo: Database["public"]["Enums"]["portal_method"]
          nome: string
          slug: string
          token_feed: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          config?: Json
          created_at?: string
          formato_feed?: Database["public"]["Enums"]["feed_format"]
          id?: string
          metodo?: Database["public"]["Enums"]["portal_method"]
          nome: string
          slug: string
          token_feed?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          config?: Json
          created_at?: string
          formato_feed?: Database["public"]["Enums"]["feed_format"]
          id?: string
          metodo?: Database["public"]["Enums"]["portal_method"]
          nome?: string
          slug?: string
          token_feed?: string
          updated_at?: string
        }
        Relationships: []
      }
      portal_logs: {
        Row: {
          created_at: string
          detalhes: Json | null
          feed_url: string | null
          id: string
          portal_id: string
          status: Database["public"]["Enums"]["log_status"]
          tempo_geracao_ms: number | null
          total_itens: number
        }
        Insert: {
          created_at?: string
          detalhes?: Json | null
          feed_url?: string | null
          id?: string
          portal_id: string
          status: Database["public"]["Enums"]["log_status"]
          tempo_geracao_ms?: number | null
          total_itens?: number
        }
        Update: {
          created_at?: string
          detalhes?: Json | null
          feed_url?: string | null
          id?: string
          portal_id?: string
          status?: Database["public"]["Enums"]["log_status"]
          tempo_geracao_ms?: number | null
          total_itens?: number
        }
        Relationships: [
          {
            foreignKeyName: "portal_logs_portal_id_fkey"
            columns: ["portal_id"]
            isOneToOne: false
            referencedRelation: "portais"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_publicacoes: {
        Row: {
          created_at: string
          id: string
          imovel_id: string
          mensagem_erro: string | null
          payload_snapshot: Json | null
          portal_id: string
          status: Database["public"]["Enums"]["publication_status"]
          ultima_tentativa: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          imovel_id: string
          mensagem_erro?: string | null
          payload_snapshot?: Json | null
          portal_id: string
          status?: Database["public"]["Enums"]["publication_status"]
          ultima_tentativa?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          imovel_id?: string
          mensagem_erro?: string | null
          payload_snapshot?: Json | null
          portal_id?: string
          status?: Database["public"]["Enums"]["publication_status"]
          ultima_tentativa?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_publicacoes_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_publicacoes_portal_id_fkey"
            columns: ["portal_id"]
            isOneToOne: false
            referencedRelation: "portais"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          creci: string | null
          email: string
          id: string
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          creci?: string | null
          email?: string
          id: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          creci?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          active: boolean
          address_city: string
          address_lat: number | null
          address_lng: number | null
          address_neighborhood: string | null
          address_state: string
          address_street: string | null
          address_zipcode: string | null
          amenities: string[] | null
          area: number
          bathrooms: number
          bedrooms: number
          built_area: number | null
          category_id: string | null
          condo_exempt: boolean | null
          condo_fee: number | null
          created_at: string
          created_by: string | null
          description: string | null
          documentation: Database["public"]["Enums"]["documentation_status"]
          featured: boolean
          features: string[] | null
          financing: boolean
          garages: number
          id: string
          iptu: number | null
          location_type: string
          old_url: string | null
          order_index: number | null
          price: number
          profile: Database["public"]["Enums"]["property_profile"]
          reference: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["property_status"]
          suites: number
          title: string
          type: Database["public"]["Enums"]["property_type"]
          updated_at: string
          views: number
        }
        Insert: {
          active?: boolean
          address_city?: string
          address_lat?: number | null
          address_lng?: number | null
          address_neighborhood?: string | null
          address_state?: string
          address_street?: string | null
          address_zipcode?: string | null
          amenities?: string[] | null
          area?: number
          bathrooms?: number
          bedrooms?: number
          built_area?: number | null
          category_id?: string | null
          condo_exempt?: boolean | null
          condo_fee?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documentation?: Database["public"]["Enums"]["documentation_status"]
          featured?: boolean
          features?: string[] | null
          financing?: boolean
          garages?: number
          id?: string
          iptu?: number | null
          location_type?: string
          old_url?: string | null
          order_index?: number | null
          price?: number
          profile?: Database["public"]["Enums"]["property_profile"]
          reference?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["property_status"]
          suites?: number
          title: string
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
          views?: number
        }
        Update: {
          active?: boolean
          address_city?: string
          address_lat?: number | null
          address_lng?: number | null
          address_neighborhood?: string | null
          address_state?: string
          address_street?: string | null
          address_zipcode?: string | null
          amenities?: string[] | null
          area?: number
          bathrooms?: number
          bedrooms?: number
          built_area?: number | null
          category_id?: string | null
          condo_exempt?: boolean | null
          condo_fee?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          documentation?: Database["public"]["Enums"]["documentation_status"]
          featured?: boolean
          features?: string[] | null
          financing?: boolean
          garages?: number
          id?: string
          iptu?: number | null
          location_type?: string
          old_url?: string | null
          order_index?: number | null
          price?: number
          profile?: Database["public"]["Enums"]["property_profile"]
          reference?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["property_status"]
          suites?: number
          title?: string
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "properties_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          order_index: number
          property_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          order_index?: number
          property_id: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          order_index?: number
          property_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      site_config: {
        Row: {
          about_image_position: string | null
          about_image_url: string | null
          about_text: string | null
          about_title: string | null
          accent_color: string | null
          address: string | null
          created_at: string
          email: string | null
          favicon_url: string | null
          footer_links: Json | null
          footer_text: string | null
          hero_background_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          home_image_position: string | null
          home_image_url: string | null
          id: string
          logo_horizontal_url: string | null
          logo_symbol_url: string | null
          logo_url: string | null
          logo_vertical_url: string | null
          og_image_url: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_youtube: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          about_image_position?: string | null
          about_image_url?: string | null
          about_text?: string | null
          about_title?: string | null
          accent_color?: string | null
          address?: string | null
          created_at?: string
          email?: string | null
          favicon_url?: string | null
          footer_links?: Json | null
          footer_text?: string | null
          hero_background_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          home_image_position?: string | null
          home_image_url?: string | null
          id?: string
          logo_horizontal_url?: string | null
          logo_symbol_url?: string | null
          logo_url?: string | null
          logo_vertical_url?: string | null
          og_image_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          about_image_position?: string | null
          about_image_url?: string | null
          about_text?: string | null
          about_title?: string | null
          accent_color?: string | null
          address?: string | null
          created_at?: string
          email?: string | null
          favicon_url?: string | null
          footer_links?: Json | null
          footer_text?: string | null
          hero_background_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          home_image_position?: string | null
          home_image_url?: string | null
          id?: string
          logo_horizontal_url?: string | null
          logo_symbol_url?: string | null
          logo_url?: string | null
          logo_vertical_url?: string | null
          og_image_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          annual_price: number
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          max_properties: number
          max_users: number
          monthly_price: number
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          annual_price?: number
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_properties?: number
          max_users?: number
          monthly_price?: number
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          annual_price?: number
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_properties?: number
          max_users?: number
          monthly_price?: number
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          created_at: string
          expires_at: string | null
          fiscal_cep: string | null
          fiscal_city: string | null
          fiscal_complement: string | null
          fiscal_document: string | null
          fiscal_name: string | null
          fiscal_neighborhood: string | null
          fiscal_number: string | null
          fiscal_state: string | null
          fiscal_street: string | null
          id: string
          plan_id: string | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          expires_at?: string | null
          fiscal_cep?: string | null
          fiscal_city?: string | null
          fiscal_complement?: string | null
          fiscal_document?: string | null
          fiscal_name?: string | null
          fiscal_neighborhood?: string | null
          fiscal_number?: string | null
          fiscal_state?: string | null
          fiscal_street?: string | null
          id?: string
          plan_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          expires_at?: string | null
          fiscal_cep?: string | null
          fiscal_city?: string | null
          fiscal_complement?: string | null
          fiscal_document?: string | null
          fiscal_name?: string | null
          fiscal_neighborhood?: string | null
          fiscal_number?: string | null
          fiscal_state?: string | null
          fiscal_street?: string | null
          id?: string
          plan_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      use_invite: {
        Args: { invite_token: string; user_id: string }
        Returns: boolean
      }
      validate_invite: {
        Args: { invite_token: string }
        Returns: {
          email: string
          error_message: string
          id: string
          is_valid: boolean
          name: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "corretor" | "gestor"
      documentation_status: "regular" | "irregular" | "pendente"
      feed_format: "xml" | "json" | "csv"
      log_status: "success" | "error"
      portal_method: "feed" | "api" | "manual"
      property_profile: "residencial" | "comercial" | "industrial" | "misto"
      property_status: "venda" | "aluguel" | "vendido" | "alugado"
      property_type:
        | "casa"
        | "apartamento"
        | "terreno"
        | "comercial"
        | "rural"
        | "cobertura"
        | "flat"
        | "galpao"
      publication_status: "pending" | "published" | "error" | "disabled"
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
      app_role: ["admin", "user", "corretor", "gestor"],
      documentation_status: ["regular", "irregular", "pendente"],
      feed_format: ["xml", "json", "csv"],
      log_status: ["success", "error"],
      portal_method: ["feed", "api", "manual"],
      property_profile: ["residencial", "comercial", "industrial", "misto"],
      property_status: ["venda", "aluguel", "vendido", "alugado"],
      property_type: [
        "casa",
        "apartamento",
        "terreno",
        "comercial",
        "rural",
        "cobertura",
        "flat",
        "galpao",
      ],
      publication_status: ["pending", "published", "error", "disabled"],
    },
  },
} as const
