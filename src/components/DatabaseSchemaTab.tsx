import React from 'react';
import { Database, ShieldAlert, FileCode } from 'lucide-react';

export function DatabaseSchemaTab() {
  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white min-h-full">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Database className="w-7 h-7 text-indigo-600" />
              PostgreSQL (v15+) DDL Architecture
            </h2>
            <p className="text-slate-500 text-sm mt-2 max-w-2xl leading-relaxed">
              Production-ready PostgreSQL schemas for South African Municipal GRC (Governance, Risk, and Compliance). 
              Strictly adheres to the MFMA (Act 56 of 2003), Municipal Systems Act (Act 32 of 2000), and National Treasury guidelines.
            </p>
          </div>
          <div className="shrink-0">
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-indigo-200">
              Database Architect
            </span>
          </div>
        </div>

        {/* SQL Block */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-slate-400" /> Core DDL & Audit Triggers
          </h3>
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 overflow-x-auto shadow-inner">
            <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
{`-- ============================================================================
-- GLOBAL PRE-REQUISITES, ENUMS, AND AUDIT TRIGGER ARCHITECTURE
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Core Municipal Directorates
CREATE TYPE municipal_directorate AS ENUM (
    'Office_of_the_Municipal_Manager',
    'Finance_Budget_and_Treasury',
    'Infrastructure_and_Technical_Services',
    'Community_and_Social_Services',
    'Corporate_Services',
    'Economic_Development_and_Planning',
    'Human_Settlements'
);

-- Define Risk & Compliance Status Enums
CREATE TYPE risk_category_type AS ENUM ('Strategic', 'Operational', 'Financial', 'Project');
CREATE TYPE compliance_status_type AS ENUM ('Compliant', 'Non_Compliant', 'Partially_Compliant', 'Overdue_Submission');
CREATE TYPE voting_option_type AS ENUM ('For', 'Against', 'Abstain', 'Recused');
CREATE TYPE uifw_type AS ENUM ('Unauthorised', 'Irregular', 'Fruitless_and_Wasteful');
CREATE TYPE uifw_stage_type AS ENUM ('Identification', 'Investigation_MPAC', 'Disciplinary_Board', 'Council_Condonation', 'Recovery_Phase', 'Closed');
CREATE TYPE scm_anomaly_severity AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- Global Automated Audit Logging Function
CREATE TABLE IF NOT EXISTS system_audit_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    action_performed VARCHAR(10) NOT NULL,
    row_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    performed_by VARCHAR(100) DEFAULT 'system_user',
    timestamp_changed TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION generate_audit_log_entry()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO system_audit_log (table_name, action_performed, row_id, old_data, new_data)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MODULE 1: ENTERPRISE RISK MANAGEMENT (ERM)
-- ============================================================================

-- Sub-module 1.3: Risk Appetite & Tolerance Limits
CREATE TABLE erm_risk_appetite_thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    council_resolution_number VARCHAR(100) NOT NULL,
    approval_date DATE NOT NULL,
    maximum_acceptable_residual_score INT NOT NULL CHECK (maximum_acceptable_residual_score BETWEEN 1 AND 25),
    critical_alert_trigger_score INT NOT NULL CHECK (critical_alert_trigger_score BETWEEN 1 AND 25),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sub-module 1.1: Risk Identification & Registration
CREATE TABLE erm_risk_register (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'RSK-INFRA-2026-001'
    directorate municipal_directorate NOT NULL,
    risk_title VARCHAR(255) NOT NULL,
    risk_description TEXT NOT NULL,
    category risk_category_type NOT NULL,
    inherent_impact INT NOT NULL CHECK (inherent_impact BETWEEN 1 AND 5),
    inherent_likelihood INT NOT NULL CHECK (inherent_likelihood BETWEEN 1 AND 5),
    inherent_risk_score INT GENERATED ALWAYS AS (inherent_impact * inherent_likelihood) STORED,
    control_effectiveness_score INT DEFAULT 5 CHECK (control_effectiveness_score BETWEEN 1 AND 5), -- 1=Excellent, 5=Deficient
    residual_risk_score INT NOT NULL CHECK (residual_risk_score BETWEEN 1 AND 25),
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sub-module 1.4: Control Evaluation & Self-Assessment (CRSA)
CREATE TABLE erm_crsa_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_id UUID REFERENCES erm_risk_register(id) ON DELETE CASCADE,
    assessor_name VARCHAR(100) NOT NULL,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    existing_safeguards_description TEXT NOT NULL,
    evaluated_control_strength INT NOT NULL CHECK (evaluated_control_strength BETWEEN 1 AND 5),
    manager_comments TEXT,
    requires_remediation BOOLEAN GENERATED ALWAYS AS (evaluated_control_strength >= 4) STORED
);

-- Trigger for Auto-auditing ERM Risk Register
CREATE TRIGGER audit_erm_risk_register AFTER INSERT OR UPDATE OR DELETE ON erm_risk_register
FOR EACH ROW EXECUTE FUNCTION generate_audit_log_entry();

-- ============================================================================
-- MODULE 2: REGULATORY COMPLIANCE & GOVERNANCE
-- ============================================================================

-- Sub-module 2.1: Legal Register
CREATE TABLE gov_legal_register (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    act_name VARCHAR(255) NOT NULL, -- e.g., 'Municipal Finance Management Act (Act 56 of 2003)'
    section_reference VARCHAR(100) NOT NULL, -- e.g., 'Section 71'
    provision_summary TEXT NOT NULL,
    statutory_frequency VARCHAR(50) NOT NULL, -- e.g., 'Monthly', 'Quarterly', 'Annually'
    national_treasury_penalty_risk TEXT
);

-- Sub-module 2.2: Compliance Tracking & Alerts
CREATE TABLE gov_compliance_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legal_item_id UUID REFERENCES gov_legal_register(id) ON DELETE RESTRICT,
    responsible_directorate municipal_directorate NOT NULL,
    submission_deadline DATE NOT NULL,
    actual_submission_date DATE,
    compliance_status compliance_status_type DEFAULT 'Non_Compliant',
    evidence_document_url VARCHAR(512),
    days_overdue INT GENERATED ALWAYS AS (
        CASE 
            WHEN actual_submission_date IS NOT NULL THEN (actual_submission_date - submission_deadline)
            ELSE (CURRENT_DATE - submission_deadline)
        END
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sub-module 2.3: Governance Committee Support (APAC & Risk Committees)
CREATE TABLE gov_committee_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    committee_name VARCHAR(100) NOT NULL, -- e.g., 'Audit and Performance Audit Committee (APAC)'
    meeting_date TIMESTAMPTZ NOT NULL,
    agenda_items JSONB NOT NULL, -- Array of strings/objects defining the official agenda
    has_quorum BOOLEAN DEFAULT FALSE,
    minutes_document_url VARCHAR(512)
);

CREATE TABLE gov_committee_voting_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES gov_committee_meetings(id) ON DELETE CASCADE,
    resolution_description TEXT NOT NULL,
    committee_member_name VARCHAR(100) NOT NULL,
    vote_cast voting_option_type NOT NULL,
    declared_interest TEXT -- Transparancy logging for conflicts of interest
);

CREATE TABLE gov_committee_action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES gov_committee_meetings(id) ON DELETE CASCADE,
    action_item_description TEXT NOT NULL,
    assigned_directorate municipal_directorate NOT NULL,
    target_date DATE NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT
);

-- Trigger for Auto-auditing Compliance Changes
CREATE TRIGGER audit_gov_compliance AFTER INSERT OR UPDATE OR DELETE ON gov_compliance_tracking
FOR EACH ROW EXECUTE FUNCTION generate_audit_log_entry();

-- ============================================================================
-- MODULE 3: FINANCIAL RISK & CONSEQUENCE MANAGEMENT
-- ============================================================================

-- Sub-module 3.1: UIF&W Expenditure Tracker
CREATE TABLE fin_uifw_tracker (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_reference_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'UIFW-2026-0811'
    expenditure_type uifw_type NOT NULL,
    financial_year_impacted VARCHAR(9) NOT NULL, -- e.g., '2025/2026'
    discovery_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exact_amount NUMERIC(15, 2) NOT NULL CHECK (exact_amount > 0.00),
    responsible_directorate municipal_directorate NOT NULL,
    root_cause_analysis TEXT NOT NULL,
    scm_policy_section_breached TEXT,
    current_workflow_stage uifw_stage_type DEFAULT 'Identification',
    is_recovered_or_condoned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sub-module 3.2: Consequence Management Workflow
CREATE TABLE fin_consequence_management (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uifw_incident_id UUID REFERENCES fin_uifw_tracker(id) ON DELETE RESTRICT,
    disciplinary_board_referral_date DATE NOT NULL,
    evidence_package_compiled BOOLEAN DEFAULT FALSE,
    evidence_repository_url VARCHAR(512),
    council_sanction_details TEXT,
    remedial_actions_enforced TEXT NOT NULL,
    financial_recovery_amount NUMERIC(15, 2) DEFAULT 0.00,
    case_status VARCHAR(50) DEFAULT 'Under Investigation'
);

-- Sub-module 3.3: Supply Chain Management (SCM) Risk Anomalies
CREATE TABLE fin_scm_anomaly_monitor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_or_quotation_reference VARCHAR(100) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    transaction_amount NUMERIC(15, 2) NOT NULL,
    anomaly_detected_type VARCHAR(150) NOT NULL, -- e.g., 'Split orders to bypass bidding threshold'
    severity_rating scm_anomaly_severity NOT NULL,
    accounting_officer_deviation_note_attached BOOLEAN DEFAULT FALSE,
    deviation_justification_summary TEXT,
    is_flagged_for_uifw_investigation BOOLEAN DEFAULT FALSE,
    detected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for Financial Mismanagement Actions (Strict Auditing Requirements)
CREATE TRIGGER audit_fin_uifw_tracker AFTER INSERT OR UPDATE OR DELETE ON fin_uifw_tracker
FOR EACH ROW EXECUTE FUNCTION generate_audit_log_entry();`}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
