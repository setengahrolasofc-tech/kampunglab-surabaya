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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      draft_attachments: {
        Row: {
          byte_size: number
          created_at: string
          draft_id: string
          id: string
          mime_type: string
          object_path: string | null
          original_name: string
          owner_id: string
          physical_queue_entered_at: string | null
          physical_simulation_id: string | null
          purpose: string
          removed_at: string | null
          request_id: string
          sha256: string
          storage_state: string
        }
        Insert: {
          byte_size: number
          created_at?: string
          draft_id: string
          id?: string
          mime_type: string
          object_path?: string | null
          original_name: string
          owner_id: string
          physical_queue_entered_at?: string | null
          physical_simulation_id?: string | null
          purpose?: string
          removed_at?: string | null
          request_id: string
          sha256: string
          storage_state?: string
        }
        Update: {
          byte_size?: number
          created_at?: string
          draft_id?: string
          id?: string
          mime_type?: string
          object_path?: string | null
          original_name?: string
          owner_id?: string
          physical_queue_entered_at?: string | null
          physical_simulation_id?: string | null
          purpose?: string
          removed_at?: string | null
          request_id?: string
          sha256?: string
          storage_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_attachments_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "innovation_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_attachments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_attachments_physical_simulation_id_fkey"
            columns: ["physical_simulation_id"]
            isOneToOne: false
            referencedRelation: "innovation_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      innovation_drafts: {
        Row: {
          attachment_revision: number
          create_request_id: string
          created_at: string
          current_step: number
          document: Json
          id: string
          owner_id: string
          revision: number
          status: string
          territory_kind: string | null
          territory_rt_id: string | null
          theme_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          attachment_revision?: number
          create_request_id: string
          created_at?: string
          current_step?: number
          document: Json
          id?: string
          owner_id: string
          revision?: number
          status?: string
          territory_kind?: string | null
          territory_rt_id?: string | null
          theme_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          attachment_revision?: number
          create_request_id?: string
          created_at?: string
          current_step?: number
          document?: Json
          id?: string
          owner_id?: string
          revision?: number
          status?: string
          territory_kind?: string | null
          territory_rt_id?: string | null
          theme_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "innovation_drafts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "innovation_drafts_territory_rt_id_territory_kind_fkey"
            columns: ["territory_rt_id", "territory_kind"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id", "kind"]
          },
          {
            foreignKeyName: "innovation_drafts_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "innovation_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      innovation_simulations: {
        Row: {
          attachment_revision: number
          attempt: number
          document: Json
          draft_id: string
          draft_revision: number
          evaluation_path: string | null
          id: string
          kelurahan_id: string
          mode: string
          owner_id: string
          previous_simulation_id: string | null
          queue_entered_at: string
          reached_stage: number
          reference: string | null
          rt_id: string
          rw_id: string
          status: string
          submitted_at: string
          title: string | null
          workflow_version: number
        }
        Insert: {
          attachment_revision?: number
          attempt?: number
          document: Json
          draft_id: string
          draft_revision: number
          evaluation_path?: string | null
          id?: string
          kelurahan_id: string
          mode?: string
          owner_id: string
          previous_simulation_id?: string | null
          queue_entered_at?: string
          reached_stage?: number
          reference?: string | null
          rt_id: string
          rw_id: string
          status?: string
          submitted_at?: string
          title?: string | null
          workflow_version?: number
        }
        Update: {
          attachment_revision?: number
          attempt?: number
          document?: Json
          draft_id?: string
          draft_revision?: number
          evaluation_path?: string | null
          id?: string
          kelurahan_id?: string
          mode?: string
          owner_id?: string
          previous_simulation_id?: string | null
          queue_entered_at?: string
          reached_stage?: number
          reference?: string | null
          rt_id?: string
          rw_id?: string
          status?: string
          submitted_at?: string
          title?: string | null
          workflow_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "innovation_simulations_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "innovation_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "innovation_simulations_kelurahan_id_fkey"
            columns: ["kelurahan_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "innovation_simulations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "innovation_simulations_previous_simulation_id_fkey"
            columns: ["previous_simulation_id"]
            isOneToOne: true
            referencedRelation: "innovation_simulations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "innovation_simulations_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "innovation_simulations_rw_id_fkey"
            columns: ["rw_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      innovation_themes: {
        Row: {
          active: boolean
          code: string
          id: string
          is_demo: boolean
          name: string
        }
        Insert: {
          active?: boolean
          code: string
          id?: string
          is_demo?: boolean
          name: string
        }
        Update: {
          active?: boolean
          code?: string
          id?: string
          is_demo?: boolean
          name?: string
        }
        Relationships: []
      }
      notification_receipts: {
        Row: {
          event_at: string
          kind: string
          read_at: string
          source_id: string
          user_id: string
        }
        Insert: {
          event_at: string
          kind: string
          read_at?: string
          source_id: string
          user_id: string
        }
        Update: {
          event_at?: string
          kind?: string
          read_at?: string
          source_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      office_mandates: {
        Row: {
          appointment_reference: string
          created_at: string
          ends_at: string | null
          granted_by: string | null
          id: string
          mandate_type: string
          office_id: string
          revocation_reason: string | null
          revoked_at: string | null
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          appointment_reference: string
          created_at?: string
          ends_at?: string | null
          granted_by?: string | null
          id?: string
          mandate_type: string
          office_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          starts_at: string
          status?: string
          user_id: string
        }
        Update: {
          appointment_reference?: string
          created_at?: string
          ends_at?: string | null
          granted_by?: string | null
          id?: string
          mandate_type?: string
          office_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_mandates_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_mandates_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_mandates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          active: boolean
          created_at: string
          id: string
          kind: string
          name: string
          territory_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          kind: string
          name: string
          territory_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          kind?: string
          name?: string
          territory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offices_territory_id_kind_fkey"
            columns: ["territory_id", "kind"]
            isOneToOne: true
            referencedRelation: "territories"
            referencedColumns: ["id", "kind"]
          },
        ]
      }
      physical_recommendation_actions: {
        Row: {
          action: string
          actor_id: string
          actor_name: string
          body: string
          contact_checked: boolean
          content_checked: boolean
          created_at: string
          id: string
          mandate_id: string | null
          office_id: string | null
          office_name: string | null
          physical_request_id: string
          request_id: string
          signature_checked: boolean
          workflow_version: number
        }
        Insert: {
          action: string
          actor_id: string
          actor_name: string
          body: string
          contact_checked?: boolean
          content_checked?: boolean
          created_at?: string
          id?: string
          mandate_id?: string | null
          office_id?: string | null
          office_name?: string | null
          physical_request_id: string
          request_id: string
          signature_checked?: boolean
          workflow_version: number
        }
        Update: {
          action?: string
          actor_id?: string
          actor_name?: string
          body?: string
          contact_checked?: boolean
          content_checked?: boolean
          created_at?: string
          id?: string
          mandate_id?: string | null
          office_id?: string | null
          office_name?: string | null
          physical_request_id?: string
          request_id?: string
          signature_checked?: boolean
          workflow_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "physical_recommendation_actions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_recommendation_actions_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "office_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_recommendation_actions_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_recommendation_actions_physical_request_id_fkey"
            columns: ["physical_request_id"]
            isOneToOne: false
            referencedRelation: "physical_recommendation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_recommendation_requests: {
        Row: {
          acknowledged: boolean
          attachment_id: string
          body: string
          closed_at: string | null
          created_at: string
          delay_days: number
          eligible_at: string
          id: string
          kelurahan_id: string
          owner_id: string
          queue_entered_at: string
          request_id: string
          settings_version: number
          simulation_id: string
          stage: string
          status: string
          submitted_workflow_version: number
        }
        Insert: {
          acknowledged: boolean
          attachment_id: string
          body: string
          closed_at?: string | null
          created_at?: string
          delay_days: number
          eligible_at: string
          id?: string
          kelurahan_id: string
          owner_id: string
          queue_entered_at: string
          request_id: string
          settings_version: number
          simulation_id: string
          stage: string
          status?: string
          submitted_workflow_version: number
        }
        Update: {
          acknowledged?: boolean
          attachment_id?: string
          body?: string
          closed_at?: string | null
          created_at?: string
          delay_days?: number
          eligible_at?: string
          id?: string
          kelurahan_id?: string
          owner_id?: string
          queue_entered_at?: string
          request_id?: string
          settings_version?: number
          simulation_id?: string
          stage?: string
          status?: string
          submitted_workflow_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "physical_recommendation_requests_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "draft_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_recommendation_requests_kelurahan_id_fkey"
            columns: ["kelurahan_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_recommendation_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_recommendation_requests_settings_version_fkey"
            columns: ["settings_version"]
            isOneToOne: false
            referencedRelation: "physical_route_settings"
            referencedColumns: ["version"]
          },
          {
            foreignKeyName: "physical_recommendation_requests_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "innovation_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_route_settings: {
        Row: {
          actor_id: string | null
          actor_name: string
          base_version: number
          created_at: string
          delay_days: number
          id: string
          reason: string
          request_id: string | null
          version: number
        }
        Insert: {
          actor_id?: string | null
          actor_name: string
          base_version: number
          created_at?: string
          delay_days: number
          id?: string
          reason: string
          request_id?: string | null
          version: number
        }
        Update: {
          actor_id?: string | null
          actor_name?: string
          base_version?: number
          created_at?: string
          delay_days?: number
          id?: string
          reason?: string
          request_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "physical_route_settings_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_role_grants: {
        Row: {
          appointment_reference: string
          created_at: string
          ends_at: string | null
          granted_by: string | null
          id: string
          revocation_reason: string | null
          revoked_at: string | null
          role: string
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          appointment_reference: string
          created_at?: string
          ends_at?: string | null
          granted_by?: string | null
          id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          role: string
          starts_at: string
          status?: string
          user_id: string
        }
        Update: {
          appointment_reference?: string
          created_at?: string
          ends_at?: string | null
          granted_by?: string | null
          id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          role?: string
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_role_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_role_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          domicile_kind: string | null
          domicile_rt_id: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          domicile_kind?: string | null
          domicile_rt_id?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          domicile_kind?: string | null
          domicile_rt_id?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_domicile_rt_fk"
            columns: ["domicile_rt_id", "domicile_kind"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id", "kind"]
          },
        ]
      }
      simulation_attachment_links: {
        Row: {
          attachment_id: string
          created_at: string
          id: string
          simulation_id: string
        }
        Insert: {
          attachment_id: string
          created_at?: string
          id?: string
          simulation_id: string
        }
        Update: {
          attachment_id?: string
          created_at?: string
          id?: string
          simulation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_attachment_links_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "draft_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_attachment_links_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "innovation_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_panel_assignments: {
        Row: {
          appointment_reference: string
          assigned_by: string
          assigned_by_name: string
          case_id: string
          closed_at: string | null
          created_at: string
          id: string
          reason: string
          reviewer_id: string
          reviewer_name: string
          seat: string
          status: string
        }
        Insert: {
          appointment_reference: string
          assigned_by: string
          assigned_by_name: string
          case_id: string
          closed_at?: string | null
          created_at?: string
          id?: string
          reason: string
          reviewer_id: string
          reviewer_name: string
          seat: string
          status?: string
        }
        Update: {
          appointment_reference?: string
          assigned_by?: string
          assigned_by_name?: string
          case_id?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          reason?: string
          reviewer_id?: string
          reviewer_name?: string
          seat?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_panel_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_panel_assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "simulation_panel_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_panel_assignments_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_panel_cases: {
        Row: {
          consent_version: string
          created_at: string
          id: string
          owner_id: string
          shared_at: string
          simulation_id: string
          state: string
          version: number
        }
        Insert: {
          consent_version?: string
          created_at?: string
          id?: string
          owner_id: string
          shared_at?: string
          simulation_id: string
          state: string
          version?: number
        }
        Update: {
          consent_version?: string
          created_at?: string
          id?: string
          owner_id?: string
          shared_at?: string
          simulation_id?: string
          state?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulation_panel_cases_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_panel_cases_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: true
            referencedRelation: "innovation_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_panel_entries: {
        Row: {
          acknowledged: boolean
          actor_id: string
          actor_name: string
          assignment_id: string
          beneficiaries_score: number | null
          body: string
          budget_score: number | null
          created_at: string
          evidence_score: number | null
          expected_workflow_version: number
          feasibility_score: number | null
          id: string
          kind: string
          problem_score: number | null
          request_id: string
          rubric_version: string
          total: number | null
          vote: string | null
        }
        Insert: {
          acknowledged: boolean
          actor_id: string
          actor_name: string
          assignment_id: string
          beneficiaries_score?: number | null
          body: string
          budget_score?: number | null
          created_at?: string
          evidence_score?: number | null
          expected_workflow_version: number
          feasibility_score?: number | null
          id?: string
          kind: string
          problem_score?: number | null
          request_id: string
          rubric_version?: string
          total?: number | null
          vote?: string | null
        }
        Update: {
          acknowledged?: boolean
          actor_id?: string
          actor_name?: string
          assignment_id?: string
          beneficiaries_score?: number | null
          body?: string
          budget_score?: number | null
          created_at?: string
          evidence_score?: number | null
          expected_workflow_version?: number
          feasibility_score?: number | null
          id?: string
          kind?: string
          problem_score?: number | null
          request_id?: string
          rubric_version?: string
          total?: number | null
          vote?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_panel_entries_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_panel_entries_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "simulation_panel_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_panel_events: {
        Row: {
          action: string
          actor_id: string
          actor_name: string
          assignment_id: string | null
          case_id: string
          created_at: string
          data: Json
          expected_version: number
          id: string
          request_id: string
        }
        Insert: {
          action: string
          actor_id: string
          actor_name: string
          assignment_id?: string | null
          case_id: string
          created_at?: string
          data: Json
          expected_version: number
          id?: string
          request_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          actor_name?: string
          assignment_id?: string | null
          case_id?: string
          created_at?: string
          data?: Json
          expected_version?: number
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_panel_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_panel_events_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "simulation_panel_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_panel_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "simulation_panel_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_review_events: {
        Row: {
          actor_id: string
          actor_name: string
          body: string
          checks: Json
          created_at: string
          decision_method: string
          evaluation_acknowledged: boolean
          evaluation_path: string | null
          expected_version: number
          from_status: string
          id: string
          mandate_id: string
          office_id: string
          office_name: string
          outcome: string
          physical_request_id: string | null
          request_id: string
          simulation_id: string
          stage: string
          to_status: string
        }
        Insert: {
          actor_id: string
          actor_name: string
          body: string
          checks: Json
          created_at?: string
          decision_method?: string
          evaluation_acknowledged?: boolean
          evaluation_path?: string | null
          expected_version: number
          from_status: string
          id?: string
          mandate_id: string
          office_id: string
          office_name: string
          outcome: string
          physical_request_id?: string | null
          request_id: string
          simulation_id: string
          stage: string
          to_status: string
        }
        Update: {
          actor_id?: string
          actor_name?: string
          body?: string
          checks?: Json
          created_at?: string
          decision_method?: string
          evaluation_acknowledged?: boolean
          evaluation_path?: string | null
          expected_version?: number
          from_status?: string
          id?: string
          mandate_id?: string
          office_id?: string
          office_name?: string
          outcome?: string
          physical_request_id?: string | null
          request_id?: string
          simulation_id?: string
          stage?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_review_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_review_events_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "office_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_review_events_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_review_events_physical_request_id_fkey"
            columns: ["physical_request_id"]
            isOneToOne: true
            referencedRelation: "physical_recommendation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_review_events_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "innovation_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_rt_notes: {
        Row: {
          actor_id: string
          actor_name: string
          body: string
          created_at: string
          domicile_checked: boolean
          family_conflict: boolean
          id: string
          mandate_id: string
          office_id: string
          office_name: string
          problem_checked: boolean
          request_id: string
          simulation_id: string
        }
        Insert: {
          actor_id: string
          actor_name: string
          body: string
          created_at?: string
          domicile_checked: boolean
          family_conflict: boolean
          id?: string
          mandate_id: string
          office_id: string
          office_name: string
          problem_checked: boolean
          request_id: string
          simulation_id: string
        }
        Update: {
          actor_id?: string
          actor_name?: string
          body?: string
          created_at?: string
          domicile_checked?: boolean
          family_conflict?: boolean
          id?: string
          mandate_id?: string
          office_id?: string
          office_name?: string
          problem_checked?: boolean
          request_id?: string
          simulation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_rt_notes_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_rt_notes_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "office_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_rt_notes_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_rt_notes_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "innovation_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      territories: {
        Row: {
          code: string
          id: string
          kind: string
          name: string
          parent_id: string | null
          parent_kind: string | null
        }
        Insert: {
          code: string
          id?: string
          kind: string
          name: string
          parent_id?: string | null
          parent_kind?: string | null
        }
        Update: {
          code?: string
          id?: string
          kind?: string
          name?: string
          parent_id?: string | null
          parent_kind?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "territories_parent_id_parent_kind_fkey"
            columns: ["parent_id", "parent_kind"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id", "kind"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_access: {
        Args: { p_operation: string; p_payload?: Json }
        Returns: Json
      }
      attachment_service: {
        Args: { operation: string; payload?: Json }
        Returns: Json
      }
      attachment_workflow: {
        Args: { operation: string; payload?: Json }
        Returns: Json
      }
      delete_own_account: { Args: never; Returns: Json }
      is_program_admin: { Args: never; Returns: boolean }
      link_domicile: {
        Args: {
          p_kecamatan: string
          p_kelurahan: string
          p_rt: number
          p_rw: number
        }
        Returns: Json
      }
      notification_workflow: {
        Args: { operation: string; payload?: Json }
        Returns: Json
      }
      panel_workflow: {
        Args: { operation: string; payload?: Json }
        Returns: Json
      }
      physical_workflow: {
        Args: { operation: string; payload?: Json }
        Returns: Json
      }
      set_profile_domicile: { Args: { rt: string }; Returns: Json }
      simulation_workflow: {
        Args: { operation: string; payload?: Json }
        Returns: Json
      }
      write_innovation_draft: {
        Args: { operation: string; payload: Json }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
