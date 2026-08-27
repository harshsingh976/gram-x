from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime

# ----------------- AUTH SCHEMAS -----------------
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)

class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_.-]+$")
    email: Optional[str] = Field(None, max_length=120)
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(..., min_length=1, max_length=100)
    village_id: Optional[int] = Field(1, gt=0)
    role: Optional[str] = Field("citizen", pattern="^(admin|citizen|worker|district|super_admin)$")

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None
    role: Optional[str] = None
    username: Optional[str] = None
    name: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=10)

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    username_or_email: str = Field(..., min_length=1, max_length=120)

class VerifyOTPRequest(BaseModel):
    username_or_email: str = Field(..., min_length=1, max_length=120)
    otp_code: str = Field(..., min_length=6, max_length=8)

class ResetPasswordWithTokenRequest(BaseModel):
    username_or_email: str = Field(..., min_length=1, max_length=120)
    reset_ticket: str = Field(..., min_length=16, max_length=128)
    new_password: str = Field(..., min_length=6, max_length=128)

class ResetPasswordRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    new_password: str = Field(..., min_length=6, max_length=128)
    reset_token: Optional[str] = None


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_.-]+$")
    email: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., pattern="^(admin|citizen|worker|district|super_admin)$")
    village_id: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)

class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# ----------------- VILLAGE SCHEMAS -----------------
class VillageBase(BaseModel):
    name: str
    district: str
    state: str
    population: int
    budget_allocated: float
    budget_spent: float
    shape_geojson: Optional[str] = None

class VillageResponse(VillageBase):
    id: int
    class Config:
        from_attributes = True

class VillageMetricsResponse(BaseModel):
    village_id: int
    name: str
    health_score: float
    budget_allocated: float
    budget_spent: float
    active_incidents_count: int
    critical_incidents_count: int
    active_projects_count: int
    outcome_gap_projects_count: int
    asset_reliability_pct: float
    resource_utilization_pct: float
    water_reliability_pct: float
    service_coverage_pct: float

# ----------------- SENSOR SCHEMAS -----------------
class SensorReadingBase(BaseModel):
    parameter: str
    value: float
    timestamp: datetime

class SensorReadingResponse(SensorReadingBase):
    id: int
    asset_id: int
    class Config:
        from_attributes = True

# ----------------- MAINTENANCE SCHEMAS -----------------
class MaintenanceHistoryResponse(BaseModel):
    id: int
    date: datetime
    action_taken: str
    cost: float
    technician_id: Optional[int] = None
    class Config:
        from_attributes = True

# ----------------- ASSET SCHEMAS -----------------
class AssetBase(BaseModel):
    name: str
    type: str
    village_id: int
    status: str
    latitude: float
    longitude: float
    capacity: Optional[float] = None
    current_utilization: float

class AssetResponse(AssetBase):
    id: int
    install_date: datetime
    class Config:
        from_attributes = True

class AssetDetailResponse(AssetResponse):
    sensor_readings: List[SensorReadingResponse] = []
    maintenance_history: List[MaintenanceHistoryResponse] = []
    failures_count: int
    average_failure_interval_days: Optional[float] = None
    total_maintenance_cost: float
    health_grade: Optional[str] = None
    class Config:
        from_attributes = True

# ----------------- EVIDENCE SCHEMAS -----------------
class IncidentEvidenceResponse(BaseModel):
    id: int
    incident_id: Optional[int] = None
    task_id: Optional[int] = None
    type: str
    file_path: Optional[str] = None
    recognized_text: Optional[str] = None
    ai_metadata: Optional[str] = None
    uploaded_by: Optional[int] = None
    uploaded_at: Optional[datetime] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = 0
    checksum: Optional[str] = None
    review_status: Optional[str] = "pending"
    review_remarks: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class UploadEvidenceRequest(BaseModel):
    photo_base64: Optional[str] = Field(None, max_length=10000000)
    voice_base64: Optional[str] = Field(None, max_length=10000000)
    file_name: Optional[str] = Field(None, max_length=255)
    file_type: Optional[str] = Field(None, max_length=50)
    recognized_text: Optional[str] = Field(None, max_length=2000)
    work_summary: Optional[str] = Field(None, max_length=1000)

class EvidenceReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(accepted|rejected)$")
    remarks: Optional[str] = Field(None, max_length=500)

class NotificationResponse(BaseModel):
    id: int
    recipient_id: Optional[int] = None
    recipient_role: str
    event_type: str
    severity: str
    message: str
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    created_at: datetime
    read_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# ----------------- INCIDENT SCHEMAS -----------------
class IncidentBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    status: str
    severity: str
    asset_id: Optional[int] = None
    village_id: int
    latitude: float
    longitude: float
    ai_confidence: float
    affected_population: int
    priority_score: float

class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field(..., pattern="^(water|roads|waste|electricity|drainage)$")
    village_id: int = Field(..., gt=0)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    asset_id: Optional[int] = Field(None, gt=0)
    voice_base64: Optional[str] = None
    photo_base64: Optional[str] = None

class IncidentResponse(IncidentBase):
    id: int
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    # SLA Parameters
    expected_response_time: Optional[datetime] = None
    actual_response_time: Optional[datetime] = None
    expected_resolution_time: Optional[datetime] = None
    actual_resolution_time: Optional[datetime] = None
    sla_status: Optional[str] = None
    
    class Config:
        from_attributes = True


# ----------------- TASK & TECHNICIAN SCHEMAS -----------------
class TechnicianResponse(BaseModel):
    id: int
    name: str
    specialty: str
    availability: bool
    current_lat: float
    current_lng: float
    rating: float
    distance_km: Optional[float] = None
    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    incident_id: int = Field(..., gt=0)
    technician_id: int = Field(..., gt=0)
    description: Optional[str] = Field(None, max_length=1000)

class PriceIncreaseRequest(BaseModel):
    additional_cost: float = Field(..., gt=0, le=50000)
    work_done: str = Field(..., min_length=5, max_length=1000)
    what_was_wrong: str = Field(..., min_length=5, max_length=1000)
    product_effect: str = Field(..., min_length=3, max_length=500)

class ScopeRejectRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)

class TaskResponse(BaseModel):
    id: int
    incident_id: int
    technician_id: int
    description: Optional[str] = None
    status: str
    assigned_at: datetime
    completed_at: Optional[datetime] = None
    cost: float
    base_cost: float
    cost_increased: bool
    work_done: Optional[str] = None
    what_was_wrong: Optional[str] = None
    product_effect: Optional[str] = None
    payout_status: str
    payout_tx_id: Optional[str] = None
    
    # Financial & Scope Revision Governance
    cost_revision_status: Optional[str] = "none"  # none, pending, approved, rejected
    requested_cost: Optional[float] = None
    requested_additional_cost: Optional[float] = None
    scope_reviewed_by: Optional[str] = None
    scope_reviewed_at: Optional[datetime] = None
    scope_rejection_reason: Optional[str] = None

    # Enriched fields for Worker Portal display
    incident_title: Optional[str] = None
    incident_category: Optional[str] = None
    incident_village: Optional[str] = None
    incident_severity: Optional[str] = None
    incident_created_at: Optional[datetime] = None
    technician_name: Optional[str] = None
    technician_rating: Optional[float] = None
    technician_specialty: Optional[str] = None
    
    # Authoritative SLA parameters
    sla_priority: Optional[str] = None
    sla_response_hours: Optional[int] = None
    sla_resolution_hours: Optional[int] = None
    sla_expected_response_time: Optional[datetime] = None
    sla_expected_resolution_time: Optional[datetime] = None
    sla_status: Optional[str] = None
    sla_remaining_seconds: Optional[float] = None
    
    class Config:
        from_attributes = True

class CollectorDirectiveRequest(BaseModel):
    directive_text: str = Field(..., min_length=5, max_length=1000)
    priority_override: Optional[str] = None
    assigned_officer: Optional[str] = None

class IncidentDetailResponse(IncidentResponse):
    reporter: Optional[UserResponse] = None
    evidence: List[IncidentEvidenceResponse] = []
    probable_root_causes: List[str] = []
    consequences: List[str] = []
    historical_failures_count: int = 0
    tasks: List[TaskResponse] = []
    timeline_events: List[dict] = []
    verification_record: Optional[dict] = None
    class Config:
        from_attributes = True

# ----------------- PROJECT SCHEMAS -----------------
class ProjectMilestoneResponse(BaseModel):
    id: int
    title: str
    target_date: datetime
    status: str
    actual_date: Optional[datetime] = None
    class Config:
        from_attributes = True

class ProjectOutcomeResponse(BaseModel):
    id: int
    metric_name: str
    target_value: float
    observed_value: float
    verification_method: str
    status: str
    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    village_id: int
    cost_estimate: float
    status: str
    physical_progress_pct: float
    functional_status_pct: float
    actual_usage_pct: float
    outcome_verified: bool

class ProjectResponse(ProjectBase):
    id: int
    start_date: datetime
    end_date: Optional[datetime] = None
    class Config:
        from_attributes = True

class ProjectDetailResponse(ProjectResponse):
    milestones: List[ProjectMilestoneResponse] = []
    outcomes: List[ProjectOutcomeResponse] = []
    class Config:
        from_attributes = True

class ProjectVerifyRequest(BaseModel):
    observed_metrics: dict

# ----------------- SIMULATION SCHEMAS -----------------
class WhatIfRequest(BaseModel):
    incident_id: int
    delay_months: int

class ScenarioSummary(BaseModel):
    label: str
    estimated_cost: float
    population_affected: int
    expected_improvement_pct: float
    predicted_future_cost: float
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    secondary_consequences: List[str]
    resource_requirements: List[str]

class WhatIfResponse(BaseModel):
    today: ScenarioSummary
    delayed: ScenarioSummary

class ReuseRecommendation(BaseModel):
    id: int
    asset_name: str
    type: str
    current_utilization: float
    potential_utilization: float
    estimated_renovation_cost: float
    estimated_benefit_description: str
    alternative_new_construction_cost: float
    savings: float

class VerificationRecordCreate(BaseModel):
    verifier: Optional[str] = Field(None, max_length=100)
    verification_status: str = Field(..., pattern="^(verified|outcome_gap)$")
    remarks: Optional[str] = Field(None, max_length=500)

class VerificationRecordResponse(BaseModel):
    id: int
    incident_id: int
    verifier: str
    verification_status: str
    remarks: Optional[str] = None
    verified_at: datetime
    class Config:
        from_attributes = True

class ReuseDecisionCreate(BaseModel):
    asset_id: int = Field(..., gt=0)
    asset_name: str = Field(..., min_length=2, max_length=150)
    decision: str = Field(..., pattern="^(approved|rejected)$")

class ReuseDecisionResponse(BaseModel):
    id: int
    asset_id: int
    asset_name: str
    decision: str
    timestamp: datetime
    class Config:
        from_attributes = True

class SensorReadingCreate(BaseModel):
    asset_id: int = Field(..., gt=0)
    parameter: str = Field(..., min_length=2, max_length=50)
    value: float = Field(...)

# ----------------- KNOWLEDGE & SEMANTIC SEARCH SCHEMAS -----------------
class KnowledgeArticleResponse(BaseModel):
    id: int
    title: str
    category: str
    department: str
    content: str
    summary: Optional[str] = None
    role_visibility: str
    created_at: datetime
    class Config:
        from_attributes = True

class KnowledgeSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    category: Optional[str] = None
    department: Optional[str] = None
    limit: Optional[int] = Field(5, ge=1, le=20)

class KnowledgeSearchResult(BaseModel):
    id: int
    title: str
    category: str
    department: str
    content: str
    summary: Optional[str] = None
    similarity_score: float

class KnowledgeSearchResponse(BaseModel):
    query: str
    results: List[KnowledgeSearchResult]
    total_found: int

class SimilarIncidentResponse(BaseModel):
    source_incident_id: int
    similar_incidents: List[Dict[str, Any]]
    total_similar: int

# ----------------- INSPECTION & FLEXIBLE DOCUMENT SCHEMAS -----------------
class InspectionRecordCreate(BaseModel):
    incident_id: Optional[int] = None
    task_id: Optional[int] = None
    asset_id: Optional[int] = None
    inspector_name: str
    service_type: str  # water, road, electricity, sanitation, civil
    observations: Dict[str, Any] = {}
    measurements: Dict[str, Any] = {}
    dynamic_fields: Dict[str, Any] = {}
    recommendations: Optional[str] = None
    risk_level: Optional[str] = "low"

class InspectionRecordResponse(BaseModel):
    id: str
    incident_id: Optional[int] = None
    task_id: Optional[int] = None
    asset_id: Optional[int] = None
    inspector_name: str
    service_type: str
    observations: Dict[str, Any] = {}
    measurements: Dict[str, Any] = {}
    dynamic_fields: Dict[str, Any] = {}
    recommendations: Optional[str] = None
    risk_level: Optional[str] = "low"
    created_at: datetime

# ----------------- OBJECT STORAGE SCHEMAS -----------------
class StoredFileResponse(BaseModel):
    file_id: str
    resource_type: str
    resource_id: Optional[int] = None
    original_filename: str
    mime_type: str
    file_size: int
    checksum: str
    download_url: str
    created_at: datetime

