/**
 * Tipos do schema Supabase. Escritos à mão para refletir
 * `supabase/migrations/0001_create_waitlist.sql`.
 *
 * Assim que o projeto Supabase estiver linkado (`supabase link`), regenere
 * com: `supabase gen types typescript --linked > types/database.types.ts`
 */
export type Database = {
  public: {
    Tables: {
      waitlist: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          city: string | null
          state: string | null
          profile: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_term: string | null
          fbclid: string | null
          gclid: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          city?: string | null
          state?: string | null
          profile?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_term?: string | null
          fbclid?: string | null
          gclid?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["waitlist"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
