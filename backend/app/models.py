import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class IncidentStatus(str, Enum):
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    OUTCOME_GAP = "outcome_gap"

class AssetStatus(str, Enum):
    OPERATIONAL = "operational"
    DEGRADED = "degraded"
    BROKEN = "broken"

class TaskStatus(str, Enum):
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    COMPLETED = "completed"

class PayoutStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=True)
    password_hash = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)  # admin, citizen, worker, district, super_admin
    name = Column(String(100), nullable=False)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    village = relationship("Village", back_populates="users")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

class Village(Base):
    __tablename__ = "villages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    population = Column(Integer, default=1000)
    budget_allocated = Column(Float, default=100000.0)
    budget_spent = Column(Float, default=0.0)
    shape_geojson = Column(Text, nullable=True) # Simulated village boundary geojson

    users = relationship("User", back_populates="village")
    assets = relationship("Asset", back_populates="village")
    households = relationship("Household", back_populates="village")
    projects = relationship("Project", back_populates="village")
    incidents = relationship("Incident", back_populates="village")

class Household(Base):
    __tablename__ = "households"
    id = Column(Integer, primary_key=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False, index=True)
    members_count = Column(Integer, default=4)
    income_level = Column(String(20), default="APL")  # BPL, APL, etc.
    primary_water_source_id = Column(Integer, ForeignKey("assets.id"), nullable=True, index=True)

    village = relationship("Village", back_populates="households")
    primary_water_source = relationship("Asset", foreign_keys=[primary_water_source_id])

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # water_pump, streetlight, school_building, drain, road_segment
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False, index=True)
    status = Column(String(20), default="operational")  # operational, degraded, broken
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    install_date = Column(DateTime, default=datetime.datetime.utcnow)
    capacity = Column(Float, nullable=True)  # Liters/hr, kW, etc.
    current_utilization = Column(Float, default=0.0)  # Percentage (0-100)

    village = relationship("Village", back_populates="assets")
    sensor_readings = relationship("SensorReading", back_populates="asset", cascade="all, delete-orphan")
    maintenance_history = relationship("MaintenanceHistory", back_populates="asset", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="asset")

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    parameter = Column(String(50), nullable=False)  # flow_rate, runtime_hours, voltage, lux
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    asset = relationship("Asset", back_populates="sensor_readings")

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)  # water, roads, waste, electricity, drainage
    status = Column(String(30), default="pending_verification", index=True)  # pending_verification, verified, in_progress, resolved
    severity = Column(String(20), default="medium", index=True)  # low, medium, high, critical
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)
    ai_confidence = Column(Float, default=1.0)
    affected_population = Column(Integer, default=0)
    priority_score = Column(Float, default=0.0)
    public_reference = Column(String(50), nullable=True, unique=True, index=True)

    village = relationship("Village", back_populates="incidents")
    asset = relationship("Asset", back_populates="incidents")
    reporter = relationship("User")
    evidence = relationship("IncidentEvidence", back_populates="incident", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="incident", cascade="all, delete-orphan")


class IncidentEvidence(Base):
    __tablename__ = "incident_evidence"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True, index=True)
    type = Column(String(20), nullable=False)  # photo, voice, sensor
    file_path = Column(String(255), nullable=True)
    recognized_text = Column(Text, nullable=True)
    ai_metadata = Column(Text, nullable=True)  # JSON string
    
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    captured_at = Column(DateTime, nullable=True)  # Client device capture time
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    parent_evidence_id = Column(Integer, ForeignKey("incident_evidence.id"), nullable=True)  # Evidence versioning
    perceptual_hash = Column(String(64), nullable=True)  # dHash / aHash fingerprint
    quality_grade = Column(String(20), default="GOOD")  # GOOD, WARNING, FAILED
    risk_level = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH
    risk_signals_json = Column(Text, nullable=True)  # JSON explainable signals
    file_type = Column(String(50), nullable=True)
    file_size = Column(Integer, default=0)
    checksum = Column(String(64), nullable=True)  # SHA-256 Checksum
    review_status = Column(String(30), default="pending")  # pending, valid, flagged, under_review, accepted, verified, rejected
    review_remarks = Column(Text, nullable=True)
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    incident = relationship("Incident", back_populates="evidence")
    uploader = relationship("User", foreign_keys=[uploaded_by])
    parent_evidence = relationship("IncidentEvidence", remote_side=[id])


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    recipient_role = Column(String(30), nullable=False, index=True)  # citizen, worker, admin, district, all
    event_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), default="info")  # info, warning, critical
    message = Column(Text, nullable=False)
    reference_type = Column(String(50), nullable=True)  # incident, task, budget, sla, evidence
    reference_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    read_at = Column(DateTime, nullable=True)

    recipient = relationship("User")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False, index=True)
    cost_estimate = Column(Float, default=0.0)
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(20), default="approved")  # approved, in_progress, completed
    physical_progress_pct = Column(Float, default=0.0)
    functional_status_pct = Column(Float, default=0.0)
    actual_usage_pct = Column(Float, default=0.0)
    outcome_verified = Column(Boolean, default=False)

    village = relationship("Village", back_populates="projects")
    milestones = relationship("ProjectMilestone", back_populates="project", cascade="all, delete-orphan")
    outcomes = relationship("ProjectOutcome", back_populates="project", cascade="all, delete-orphan")

class ProjectMilestone(Base):
    __tablename__ = "project_milestones"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    target_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="pending")  # pending, completed
    actual_date = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="milestones")

class ProjectOutcome(Base):
    __tablename__ = "project_outcomes"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    metric_name = Column(String(100), nullable=False)
    target_value = Column(Float, nullable=False)
    observed_value = Column(Float, default=0.0)
    verification_method = Column(String(100), nullable=False)
    status = Column(String(20), default="pending")  # verified, outcome_gap, pending

    project = relationship("Project", back_populates="outcomes")

class Technician(Base):
    __tablename__ = "technicians"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    specialty = Column(String(50), nullable=False)  # water, electrical, construction, sanitation
    availability = Column(Boolean, default=True)
    current_lat = Column(Float, nullable=False)
    current_lng = Column(Float, nullable=False)
    rating = Column(Float, default=5.0)

    user = relationship("User")
    tasks = relationship("Task", back_populates="technician")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="assigned", index=True)  # assigned, accepted, completed
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)
    cost = Column(Float, default=0.0)
    
    # New columns for technician workflow & Panchayat accounting
    base_cost = Column(Float, default=15000.0)
    cost_increased = Column(Boolean, default=False)
    work_done = Column(Text, nullable=True)
    what_was_wrong = Column(Text, nullable=True)
    product_effect = Column(Text, nullable=True)
    payout_status = Column(String(20), default="pending", index=True)  # pending, paid
    payout_tx_id = Column(String(50), nullable=True)
    # Financial & Scope Revision Governance
    cost_revision_status = Column(String(20), default="none", index=True)  # none, pending, approved, rejected
    requested_cost = Column(Float, nullable=True)
    requested_additional_cost = Column(Float, nullable=True)
    scope_reviewed_by = Column(String(100), nullable=True)
    scope_reviewed_at = Column(DateTime, nullable=True)
    scope_rejection_reason = Column(Text, nullable=True)

    incident = relationship("Incident", back_populates="tasks")
    technician = relationship("Technician", back_populates="tasks")

class MaintenanceHistory(Base):
    __tablename__ = "maintenance_history"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    action_taken = Column(String(255), nullable=False)
    cost = Column(Float, default=0.0)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=True, index=True)

    asset = relationship("Asset", back_populates="maintenance_history")
    technician = relationship("Technician")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(255), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    details = Column(Text, nullable=True)
    prev_hash = Column(String(64), nullable=True)
    current_hash = Column(String(64), nullable=True, index=True)

    user = relationship("User")

# Cryptographic Audit Hash Chaining (SHA-256)
from sqlalchemy import event, text
import hashlib

_last_audit_hash = None

@event.listens_for(AuditLog, "before_insert")
def auto_hash_audit_log(mapper, connection, target):
    """Automatically computes and attaches tamper-evident SHA-256 hash chain before insert."""
    global _last_audit_hash
    try:
        if not target.current_hash:
            if _last_audit_hash is None:
                res = connection.execute(text("SELECT current_hash FROM audit_logs ORDER BY id DESC LIMIT 1")).fetchone()
                _last_audit_hash = res[0] if (res and res[0]) else ("0" * 64)
            
            prev_h = _last_audit_hash
            if len(prev_h) != 64:
                prev_h = hashlib.sha256(prev_h.encode('utf-8')).hexdigest()
            target.prev_hash = prev_h
            
            ts_str = target.timestamp.isoformat() if target.timestamp else datetime.datetime.utcnow().isoformat()
            data_payload = f"{target.action}|{target.user_id or 'SYSTEM'}|{ts_str}|{target.details or ''}|{prev_h}"
            target.current_hash = hashlib.sha256(data_payload.encode('utf-8')).hexdigest()
            _last_audit_hash = target.current_hash
    except Exception:
        # Fallback standalone hash if lookup fails
        if not target.current_hash:
            target.prev_hash = "0" * 64
            target.current_hash = hashlib.sha256(f"{target.action}|{target.details}".encode('utf-8')).hexdigest()

class VerificationRecord(Base):
    __tablename__ = "verification_records"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False, index=True)
    verifier = Column(String(100), nullable=False)
    verification_status = Column(String(30), nullable=False, index=True)  # verified, outcome_gap
    remarks = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("Incident")

class ReuseDecision(Base):
    __tablename__ = "reuse_decisions"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, nullable=False)
    asset_name = Column(String(100), nullable=False)
    decision = Column(String(20), nullable=False)  # approved, rejected
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    revoked = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")

class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # schemes, faqs, sops, regulations
    department = Column(String(100), nullable=False, default="Rural Development")
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    role_visibility = Column(String(50), default="all")  # all, citizen, worker, admin, district
    embedding_json = Column(Text, nullable=True)  # JSON encoded float vector
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class StoredFile(Base):
    __tablename__ = "stored_files"
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String(64), unique=True, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    resource_type = Column(String(50), nullable=False, index=True)  # incident_evidence, task_evidence, inspection
    resource_id = Column(Integer, nullable=True, index=True)
    storage_backend = Column(String(30), default="cloud", index=True)  # cloud, local
    storage_key = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    checksum = Column(String(64), nullable=False)  # SHA-256
    upload_status = Column(String(30), default="completed", index=True)  # completed, pending, failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    otp_code_hash = Column(String(64), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")

class OutboxEvent(Base):
    __tablename__ = "outbox_events"
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    channel = Column(String(50), nullable=False, index=True)  # citizen, worker, admin, district, broadcast
    payload_json = Column(Text, nullable=False)
    status = Column(String(20), default="pending", index=True)  # pending, processed, failed
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    processed_at = Column(DateTime, nullable=True)


class IncidentFeedback(Base):
    __tablename__ = "incident_feedback"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    is_resolved = Column(Boolean, nullable=False, default=True)
    rating = Column(Integer, nullable=True) # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    incident = relationship("Incident")
    user = relationship("User")


class EarlyWarningAlert(Base):
    __tablename__ = "early_warning_alerts"
    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(50), nullable=False, index=True)  # COMPLAINT_SPIKE, RECURRING_INFRASTRUCTURE_ISSUE, SLA_BREACH_SURGE, RESOLUTION_BACKLOG, CAPACITY_WARNING
    severity = Column(String(20), nullable=False, index=True)  # INFO, WARNING, HIGH, CRITICAL
    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    scope_type = Column(String(30), default="district")  # district, panchayat, asset
    scope_id = Column(Integer, nullable=True, index=True)  # village_id or asset_id
    category = Column(String(50), nullable=True, index=True)
    contributing_factors_json = Column(Text, nullable=True)  # JSON list of explainable factors
    supporting_metrics_json = Column(Text, nullable=True)  # JSON dict of exact numbers
    status = Column(String(30), default="open", index=True)  # open, acknowledged, investigating, actioned, closed
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    action_taken = Column(Text, nullable=True)
    actioned_by = Column(String(100), nullable=True)
    actioned_at = Column(DateTime, nullable=True)
    fingerprint = Column(String(64), nullable=True, index=True)  # For deduplication
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    preventive_orders = relationship("PreventiveWorkOrder", back_populates="alert", cascade="all, delete-orphan")


class PreventiveWorkOrder(Base):
    __tablename__ = "preventive_work_orders"
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("early_warning_alerts.id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=False, index=True)
    technician_id = Column(Integer, ForeignKey("technicians.id"), nullable=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True, index=True)
    status = Column(String(30), default="proposed", index=True)  # proposed, approved, in_progress, completed, rejected
    proposed_by = Column(String(100), nullable=True)
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    alert = relationship("EarlyWarningAlert", back_populates="preventive_orders")
    village = relationship("Village")
    technician = relationship("Technician")
    task = relationship("Task")




