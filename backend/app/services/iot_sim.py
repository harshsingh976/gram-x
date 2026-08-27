import datetime
import json
from sqlalchemy.orm import Session
from app.models import Asset, SensorReading, Incident, IncidentEvidence, User, Technician, Task, Project, ProjectOutcome, MaintenanceHistory

# Global in-memory demo state
DEMO_STATE = {
    "current_step": 1,
    "last_updated": datetime.datetime.utcnow().isoformat(),
    "active_incident_id": None,
    "active_task_id": None,
    "active_project_id": None
}

DEMO_STEPS = {
    1: {
        "title": "Normal Operations",
        "description": "Borewell Water Pump #17 is operating normally, supplying water to Zone B (740 residents). Telemetry is healthy.",
        "badge": "Healthy"
    },
    2: {
        "title": "Sensor Anomaly Detected",
        "description": "IoT flow sensor detects an abrupt drop in flow rate (0.0 L/min) while the pump motor draws irregular current, signaling motor stall.",
        "badge": "Anomaly"
    },
    3: {
        "title": "Citizen Complaint Received",
        "description": "Citizen Sunita Devi uploads a voice report in Hindi: 'वार्ड बी में हैंडपंप पिछले पांच दिनों से काम नहीं कर रहा है और पानी गंदा आ रहा है।' AI converts to text.",
        "badge": "Citizen Report"
    },
    4: {
        "title": "AI Unified Evidence & Priority Engine",
        "description": "AI core combines the citizen report, active telemetry anomaly, and Pump #17's history (4 failures this year) to escalate priority to CRITICAL (92.5).",
        "badge": "AI Analysis"
    },
    5: {
        "title": "Panchayat Risk Assessment",
        "description": "Dashboard updates showing 740 residents affected, high risk of gastrointestinal illness, and immediate water security impact.",
        "badge": "Risk Identified"
    },
    6: {
        "title": "What-If Simulator Comparison",
        "description": "Admin compares fixing immediately (₹18,000, low risk) vs. delaying 3 months (₹42,000, high cholera risk, ₹15,000/week water tanker costs).",
        "badge": "Decision Support"
    },
    7: {
        "title": "Reuse-Before-Build Optimization",
        "description": "AI identifies that the adjacent underutilized Community Hall's rainwater collection cistern (utilization 25%) can bypass supply temporarily.",
        "badge": "Asset Reuse"
    },
    8: {
        "title": "Smart Dispatch & Action",
        "description": "Admin approves the repair. System dispatches nearest qualified plumber Suresh Kumar (1.2km away, specialty: water).",
        "badge": "Dispatching"
    },
    9: {
        "title": "Simulated Field Worker Repair",
        "description": "Technician Suresh accepts task, arrives at the site, performs the motor coil repair, and marks it completed in the portal.",
        "badge": "In Progress"
    },
    10: {
        "title": "IoT Sensor Telemeter Recovery",
        "description": "Borewell flow sensors detect restoration of normal flow rate (81.5 L/min). Water pressure normalizes.",
        "badge": "Telemetry Ok"
    },
    11: {
        "title": "Outcome Verification Poll",
        "description": "System automatically triggers an SMS feedback poll to 10 connected local households. 9 confirm water is running cleanly.",
        "badge": "Verifying"
    },
    12: {
        "title": "Resolution & Failure Memory Logging",
        "description": "The incident is closed as fully resolved. Maintenance logs append Suresh's work. Village Health index returns to excellent.",
        "badge": "Resolved"
    }
}

def get_demo_status(db: Session) -> dict:
    # 1. Fetch active incident on Pump #17
    pump_17 = db.query(Asset).filter(Asset.name.like("%Pump #17%")).first()
    
    # Calculate step dynamically based on DB state
    calculated_step = 1 # Normal Operations default
    active_inc_id = None
    active_task_id = None
    active_proj_id = None
    
    if pump_17:
        # Check for active (unresolved or recently resolved) incident
        inc = db.query(Incident).filter(
            Incident.asset_id == pump_17.id
        ).order_by(Incident.id.desc()).first()
        
        if inc:
            active_inc_id = inc.id
            
            # Check for task
            task = db.query(Task).filter(
                Task.incident_id == inc.id
            ).order_by(Task.id.desc()).first()
            
            if task:
                active_task_id = task.id
                
            # If incident is resolved, let's check review and outcomes
            if inc.status == "resolved":
                # Find associated project
                proj = db.query(Project).filter(
                    Project.title.like("%Pump #17%")
                ).order_by(Project.id.desc()).first()
                if proj:
                    active_proj_id = proj.id
                
                # Check if a citizen review/rating has been logged
                if task and task.status == "completed":
                    if proj and proj.outcome_verified:
                        calculated_step = 12 # Closed / Resolved
                    else:
                        calculated_step = 11 # Outcome Verification Poll
                else:
                    calculated_step = 10 # Telemetry Ok / restored
            else:
                # Incident is open (pending_verification, verified, in_progress, outcome_gap)
                if inc.status == "pending_verification":
                    # If there's an anomaly reading: Step 2. Else Step 3.
                    latest_reading = db.query(SensorReading).filter(
                        SensorReading.asset_id == pump_17.id,
                        SensorReading.parameter == "flow_rate"
                    ).order_by(SensorReading.timestamp.desc()).first()
                    
                    if latest_reading and latest_reading.value < 10.0:
                        calculated_step = 2 # Sensor Anomaly Detected
                    else:
                        calculated_step = 3 # Citizen Complaint Received
                elif inc.status == "verified":
                    calculated_step = 4 # AI Priority Score Triage
                elif inc.status == "in_progress":
                    if task:
                        if task.status == "assigned":
                            calculated_step = 8 # Smart Dispatch
                        elif task.status == "accepted":
                            calculated_step = 9 # Field Worker Repair
                        elif task.status == "completed":
                            calculated_step = 10 # Telemetry Ok
                    else:
                        calculated_step = 8 # Dispatching
                elif inc.status == "outcome_gap":
                    calculated_step = 11 # Shows outcome gap / requires verification
        else:
            # No incident. Check if sensor reading shows anomaly (flow_rate = 0.0)
            latest_reading = db.query(SensorReading).filter(
                SensorReading.asset_id == pump_17.id,
                SensorReading.parameter == "flow_rate"
            ).order_by(SensorReading.timestamp.desc()).first()
            
            if latest_reading and latest_reading.value < 10.0:
                calculated_step = 2 # Sensor Anomaly Detected
            else:
                calculated_step = 1 # Normal operations
                
    # Update in-memory state sync
    DEMO_STATE["current_step"] = calculated_step
    DEMO_STATE["active_incident_id"] = active_inc_id
    DEMO_STATE["active_task_id"] = active_task_id
    DEMO_STATE["active_project_id"] = active_proj_id
    
    step_info = DEMO_STEPS.get(calculated_step, {})
    return {
        "current_step": calculated_step,
        "total_steps": len(DEMO_STEPS),
        "title": step_info.get("title", ""),
        "description": step_info.get("description", ""),
        "badge": step_info.get("badge", ""),
        "active_incident_id": active_inc_id,
        "active_task_id": active_task_id,
        "active_project_id": active_proj_id,
        "last_updated": DEMO_STATE["last_updated"]
    }

def advance_demo_step(db: Session, target_step: int = None) -> dict:
    """
    State machine that updates DB tables to match the selected demo step.
    This creates a fully reactive dashboard experience.
    """
    if target_step is None:
        target_step = DEMO_STATE["current_step"] + 1
    if target_step > len(DEMO_STEPS):
        target_step = 1 # Loop back to 1
        
    DEMO_STATE["current_step"] = target_step
    DEMO_STATE["last_updated"] = datetime.datetime.utcnow().isoformat()
    
    # Load primary assets
    pump_17 = db.query(Asset).filter(Asset.name.like("%Pump #17%")).first()
    citizen_user = db.query(User).filter(User.username == "citizen").first()
    sec_user = db.query(User).filter(User.username == "admin").first()
    worker_tech = db.query(Technician).first()

    now = datetime.datetime.utcnow()

    if target_step == 1:
        # STEP 1: Reset everything to normal state
        DEMO_STATE["active_incident_id"] = None
        DEMO_STATE["active_task_id"] = None
        DEMO_STATE["active_project_id"] = None
        
        if pump_17:
            pump_17.status = "operational"
            pump_17.current_utilization = 75.0
            
        # Clean any demo-specific incidents & tasks
        db.query(Incident).filter(Incident.title.like("%Pump #17%")).delete()
        db.query(Task).filter(Task.description.like("%Pump #17%")).delete()
        db.commit()
        
        # Inject healthy sensor readings for the last 2 hours
        if pump_17:
            db.query(SensorReading).filter(SensorReading.asset_id == pump_17.id).delete()
            for h in range(12):
                db.add(SensorReading(
                    asset_id=pump_17.id,
                    parameter="flow_rate",
                    value=82.0 + (h % 3),
                    timestamp=now - datetime.timedelta(hours=h)
                ))
            db.commit()

    elif target_step == 2:
        # STEP 2: Anomaly - set pump to degraded, inject zero flow readings
        if pump_17:
            pump_17.status = "degraded"
            # Add zero flow readings
            db.add(SensorReading(
                asset_id=pump_17.id,
                parameter="flow_rate",
                value=0.0,
                timestamp=now
            ))
            db.commit()

    elif target_step == 3:
        # STEP 3: Citizen report - create incident, state "pending_verification"
        if pump_17:
            incident = Incident(
                title="Borewell Water Pump #17 critical failure - Muddy/No water",
                description="Sunita Devi reported: Water pump has stopped working and is starting to leak muddy water. Water is unavailable in Ward B.",
                category="water",
                status="pending_verification",
                severity="high",
                reporter_id=citizen_user.id if citizen_user else None,
                asset_id=pump_17.id,
                village_id=pump_17.village_id,
                latitude=pump_17.latitude,
                longitude=pump_17.longitude,
                created_at=now,
                ai_confidence=0.92,
                affected_population=740,
                priority_score=65.0 # raw base score
            )
            db.add(incident)
            db.commit()
            db.refresh(incident)
            DEMO_STATE["active_incident_id"] = incident.id

            # Add voice evidence
            ev = IncidentEvidence(
                incident_id=incident.id,
                type="voice",
                file_path="voice_audio_pump_hindi.wav",
                recognized_text="वार्ड बी में हैंडपंप पिछले पांच दिनों से काम नहीं कर रहा है और पानी गंदा आ रहा है।",
                ai_metadata=json.dumps({"pipeline": "Whisper-Base", "detected_language": "hi", "confidence": 0.92})
            )
            db.add(ev)
            db.commit()

    elif target_step == 4:
        # STEP 4: AI Analysis - Escalate priority score to CRITICAL (92.5) due to combined evidence
        inc_id = DEMO_STATE["active_incident_id"]
        if inc_id:
            incident = db.query(Incident).filter(Incident.id == inc_id).first()
            if incident:
                incident.status = "verified"
                incident.severity = "critical"
                incident.priority_score = 92.5
                db.commit()

    elif target_step in [5, 6, 7]:
        # Steps 5, 6, 7 are administrative reviews, no database changes needed,
        # but we ensure the active incident details remain present.
        pass

    elif target_step == 8:
        # STEP 8: Dispatch - Create task assigned to Suresh Kumar, set incident to "in_progress"
        inc_id = DEMO_STATE["active_incident_id"]
        if inc_id and worker_tech:
            incident = db.query(Incident).filter(Incident.id == inc_id).first()
            if incident:
                incident.status = "in_progress"
                
                # Check if task already exists
                task = db.query(Task).filter(Task.incident_id == inc_id).first()
                if not task:
                    task = Task(
                        incident_id=inc_id,
                        technician_id=worker_tech.id,
                        description="Repair core submersible motor winding and replace damaged outlet valve seal on Pump #17.",
                        status="assigned",
                        assigned_at=now,
                        cost=18000.0
                    )
                    db.add(task)
                    db.commit()
                    db.refresh(task)
                DEMO_STATE["active_task_id"] = task.id

    elif target_step == 9:
        # STEP 9: Field work - Technician completes repair, updates task and status to "completed"
        task_id = DEMO_STATE["active_task_id"]
        if task_id:
            task = db.query(Task).filter(Task.id == task_id).first()
            if task:
                task.status = "completed"
                task.completed_at = now
                
                # Add before/after photo evidence link to incident
                inc_id = DEMO_STATE["active_incident_id"]
                ev = IncidentEvidence(
                    incident_id=inc_id,
                    type="photo",
                    file_path="repair_after_pump.jpg",
                    recognized_text="Outlet valve replaced. Water flow cleared.",
                    ai_metadata=json.dumps({"objects_detected": ["clean_valves", "repaired_cable"], "confidence": 0.98})
                )
                db.add(ev)
                
                # Add maintenance log
                mh = MaintenanceHistory(
                    asset_id=pump_17.id,
                    date=now,
                    action_taken="Re-wounded submersible coil, replaced outlet gate valve.",
                    cost=18000.0,
                    technician_id=worker_tech.id
                )
                db.add(mh)
                db.commit()

    elif target_step == 10:
        # STEP 10: Telemetry recovery - restore flow sensor values to normal
        if pump_17:
            pump_17.status = "operational"
            db.add(SensorReading(
                asset_id=pump_17.id,
                parameter="flow_rate",
                value=81.5,
                timestamp=now
            ))
            db.commit()

    elif target_step == 11:
        # STEP 11: Outcome survey - create mock outcome entries
        inc_id = DEMO_STATE["active_incident_id"]
        if inc_id and pump_17:
            # Create a Project record to log the verified outcome
            proj = Project(
                title=f"Emergency Restoration of Pump #17",
                description=f"Action to restore core water borewell after terminal motor coil burn.",
                village_id=pump_17.village_id,
                cost_estimate=18000.0,
                start_date=now - datetime.timedelta(days=1),
                end_date=now,
                status="completed",
                physical_progress_pct=100.0,
                functional_status_pct=100.0,
                actual_usage_pct=100.0,
                outcome_verified=True
            )
            db.add(proj)
            db.commit()
            db.refresh(proj)
            DEMO_STATE["active_project_id"] = proj.id
            
            # Create Project outcomes
            po = ProjectOutcome(
                project_id=proj.id,
                metric_name="Citizen restoration feedback score",
                target_value=90.0,
                observed_value=95.0, # 9 out of 10 users satisfied
                verification_method="SMS automated voice call query poll (10 citizens)",
                status="verified"
            )
            db.add(po)
            db.commit()

    elif target_step == 12:
        # STEP 12: Close incident, clean status
        inc_id = DEMO_STATE["active_incident_id"]
        if inc_id:
            incident = db.query(Incident).filter(Incident.id == inc_id).first()
            if incident:
                incident.status = "resolved"
                incident.resolved_at = now
                db.commit()

    return get_demo_status(db)
