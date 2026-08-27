import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, BookOpen, Clock, Activity, 
  HelpCircle, AlertTriangle, FileText, ChevronRight, 
  Play, RefreshCw, Star, Info 
} from 'lucide-react';
import type { Incident, Project } from '../types';

interface AuditAccountabilityProps {
  incidents: Incident[];
  projects: Project[];
  activeIncidentId: number | null;
  onSelectIncident: (id: number) => void;
}

export default function AuditAccountability({ 
  incidents, 
  projects, 
  activeIncidentId,
  onSelectIncident 
}: AuditAccountabilityProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<number>(activeIncidentId || incidents[0]?.id || 1);
  const selectedIncident = incidents.find(i => i.id === selectedCaseId) || incidents[0];

  const [decisionReplayStep, setDecisionReplayStep] = useState(0);

  // 68. Risk-based Audit Prioritization list
  const auditPrioritization = [
    { name: 'Water Pipe Laying Project', cost: 120000, riskScore: 84, reason: 'High cost revision + 14d delay + low usage gap' },
    { name: 'Borewell Pump #17 restoration', cost: 18000, riskScore: 45, reason: 'Evidence verified by sensor and voice' },
    { name: 'Streetlight Grid Overhaul', cost: 45000, riskScore: 72, reason: 'Contradiction flagged: Official functional but sensor inactive' }
  ];

  // 74. Governance Flight Recorder logs
  const flightRecorderLogs = [
    '🪵 2026-08-13 17:52 - USER "admin" toggled user role to Panchayat Secretary',
    '🪵 2026-08-13 17:53 - incident ID #1 priority calculated as CRITICAL (92.5/100) by Fusion Engine',
    '🪵 2026-08-13 17:54 - USER "admin" approved Technician Suresh Kumar dispatch (Task ID #1)',
    '🪵 2026-08-13 17:55 - task ID #1 status changed to COMPLETED by Suresh Kumar',
    '🪵 2026-08-13 17:55 - central sensor reading flow restored to 81.5 L/min'
  ];

  // 76. Decision Debt
  const decisionDebt = {
    amount: 145000,
    delayedDecisions: 4,
    description: 'Postponed streetlight maintenance and drainage desilting costs accumulated wear liabilities.'
  };

  // 78. Confidence vs Importance matrix representation
  const matrixItems = [
    { label: 'Replace Pump #17', confidence: 'High', importance: 'High', action: 'PROCEED WITH DECISION' },
    { label: 'Construct Check Dam', confidence: 'Low', importance: 'High', action: 'DO NOT DECIDE YET - Collect Water Table Data' },
    { label: 'Deploy Water Tanker', confidence: 'High', importance: 'Low', action: 'PROCEED WITH DECISION' }
  ];

  // Replay steps
  const replaySteps = [
    { label: '1. Incident Reported', desc: 'Citizen Sunita Devi uploaded voice report in Hindi. Speech converted to Hindi text.' },
    { label: '2. Sensor Anomaly Fused', desc: 'IoT sensor verified flow drop to 0.0 L/m. Cross-referencing boosted priority weight by 20%.' },
    { label: '3. Historical MTBF Checked', desc: 'Pump #17 registered 4 previous failures. Criticality escalated to CRITICAL.' },
    { label: '4. Recommendation Formulated', desc: 'AI recommended immediate coil rewinding and estimated ₹18,000 cost. Dispatched Suresh.' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* HEADER */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Governance Audit & Accountability Core</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Maintains immutable governance flight recorder logs, trace replay variables, and enforces Responsible AI confidence safeguards</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Replay, Flight Recorder, Devil's Advocate */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 73. Decision Replay Panel */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>73. AI Decision Replay Engine</h4>
              <button 
                onClick={() => setDecisionReplayStep(s => (s + 1) % replaySteps.length)}
                className="secondary" 
                style={{ padding: '2px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={12} />
                <span>Next Trace</span>
              </button>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Replays the exact analysis parameters, telemetry matrices, and weights compiled during AI decision formulation.
            </p>

            <div style={{ background: '#050a12', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {replaySteps.map((step, idx) => (
                  <div key={idx} style={{ 
                    padding: '8px', borderRadius: '4px',
                    background: decisionReplayStep === idx ? 'rgba(99,102,241,0.06)' : 'transparent',
                    borderLeft: decisionReplayStep === idx ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    opacity: idx <= decisionReplayStep ? 1 : 0.4
                  }}>
                    <div style={{ fontWeight: 'bold', color: decisionReplayStep === idx ? '#fff' : 'var(--text-secondary)' }}>{step.label}</div>
                    {decisionReplayStep === idx && <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{step.desc}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 74. Governance Flight Recorder Console */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>74. Governance Flight Recorder Log</h4>
            
            <div style={{ background: '#000', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.7rem', border: '1px solid var(--border-color)', height: '120px', overflowY: 'auto' }}>
              {flightRecorderLogs.map((log, idx) => (
                <div key={idx} style={{ padding: '2px 0', color: 'var(--status-low)' }}>
                  {log}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Flight recorder records administrative actions and telemetry transitions for local Panchayat inspection.
            </p>
          </div>

          {/* 79 & 80. AI Devil's Advocate & "Why Not" Simulator */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>79. AI Devil's Advocate Challenging Recommendations</h4>
            
            <div style={{ background: 'rgba(244,63,94,0.03)', border: '1px solid rgba(244,63,94,0.15)', padding: '12px', borderRadius: '6px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 'bold', color: 'var(--status-critical)' }}>
                <AlertTriangle size={14} /> <span>AI Devil's Advocate Argument (For Winding Repair):</span>
              </div>
              <ul style={{ paddingLeft: '16px', marginTop: '6px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><b>Repeated Failure Hazard:</b> Winding motor has burned 4 times this year. Repair is a short-term band-aid.</li>
                <li><b>Grid Vulnerability:</b> Repair does not isolate the motor from the grid phase imbalances causing sags.</li>
                <li><b>Recommendation Challenge:</b> Complete motor replacement (₹95k) would extend MTBF by 5 years, yielding a higher long-term outcome.</li>
              </ul>
            </div>

            {/* 80 & 81. Why Not B? */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>80. "Why Not Option B (Complete Replacement)?"</span>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.7rem' }}>
                <b>Option B trade-offs:</b> Option B costs <b>₹95,000</b> upfront (+₹77,000 extra capital), but extends lifetime to 60 months (vs 6 months for repair) and secures Ward B drinking water safely through dry seasons.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Prioritization Table, Matrices, Debt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 68 & 69. Audit Prioritization */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>68. Risk-Based Audit Prioritization Table</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
              {auditPrioritization.map((p, idx) => (
                <div key={idx} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>
                    <span>{p.name}</span>
                    <span style={{ color: p.riskScore > 75 ? 'var(--status-critical)' : 'var(--status-medium)' }}>
                      Risk Score: {p.riskScore}%
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>Reason: {p.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 76. Decision Debt Index */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>76. Accumulated Decision Debt Index</h4>
            
            <div style={{ background: 'rgba(234,179,8,0.03)', border: '1px solid rgba(234,179,8,0.15)', padding: '12px', borderRadius: '8px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                <span>Unresolved Decision Liabilities</span>
                <span style={{ color: 'var(--status-medium)' }}>₹{decisionDebt.amount.toLocaleString('en-IN')}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                {decisionDebt.description} (Delayed Decisions: {decisionDebt.delayedDecisions}).
              </p>
            </div>
          </div>

          {/* 78. Confidence vs Importance Decision Matrix */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>78. Decision Safeguards Matrix</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
              {matrixItems.map((item, idx) => (
                <div key={idx} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.7rem' }}>
                  <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Conf: <b>{item.confidence}</b> | Imp: <b>{item.importance}</b></span>
                    <span style={{ color: item.action.includes('DO NOT') ? 'var(--status-critical)' : 'var(--status-low)', fontWeight: 600 }}>{item.action}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 82. AI Knows When NOT to Recommend */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--status-critical)' }}>82. AI Knows When NOT to Recommend Check</span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '2px' }}>
                <b>Status:</b> Dam Proposal blocked. Collect these three details: 1) Core subsoil compression test, 2) Downstream water flow volume logs.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
