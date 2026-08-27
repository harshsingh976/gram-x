import React from 'react';
import { 
  FolderGit2, Activity, ShieldAlert, Sparkles, CheckSquare, 
  HelpCircle, AlertCircle, RefreshCw, BarChart2, ArrowRight 
} from 'lucide-react';
import type { Project } from '../types';

interface ProjectIntelProps {
  projects: Project[];
  selectedProjectId: number | null;
  onProjectSelected: (id: number) => void;
  onAuditCompleted: (id: number) => void;
}

export default function ProjectIntel({ 
  projects, 
  selectedProjectId, 
  onProjectSelected,
  onAuditCompleted 
}: ProjectIntelProps) {
  // Default to first project
  const currentProjectId = selectedProjectId || projects[0]?.id;
  const project = projects.find(p => p.id === currentProjectId) || projects[0];

  // 59. Intervention Scorecard metrics
  const scorecardScores = {
    costEfficiency: 8.8,
    constructionSpeed: 9.2,
    populationBenefit: 9.5,
    serviceImprovement: 8.5,
    recurrencePrevention: 7.2,
    outcomeAchieved: 9.0
  };

  // 60. Project Evidence Chain
  const evidenceChain = [
    { title: 'Official Panchayat Approval Work Order', type: 'doc', status: 'VERIFIED', sign: 'Panchayat Sec.' },
    { title: 'Initial Geotagged Site Photo (Before)', type: 'photo', status: 'VERIFIED', sign: 'System GPS' },
    { title: 'Subcontractor Material Procurement Receipts', type: 'receipt', status: 'VERIFIED', sign: 'PHE Vendor' },
    { title: 'Completion Photo + Calibrated Flow Test', type: 'photo', status: 'VERIFIED', sign: 'Worker Suresh' },
    { title: 'Post-restoration Citizen Satisfaction Call Logs', type: 'voice', status: 'VERIFIED', sign: 'Panchayat SMS' }
  ];

  // 62 & 63. Bottlenecks & Administrative Delays
  const delayData = [
    { stage: 'Administrative Approval', days: 12, limit: 7, status: 'EXCEEDED', delayReason: 'District budget allocation clearance lag' },
    { stage: 'Procurement Bidding', days: 22, limit: 14, status: 'EXCEEDED', delayReason: 'Supplier bidding extensions during monsoon' },
    { stage: 'Field Mobilization', days: 3, limit: 5, status: 'HEALTHY', delayReason: 'Technician dispatched immediately' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* HEADER */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Project Intelligence & Outcome Audit Desk</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tracks physical infrastructure status, checks post-project outcome gaps, and builds evidence verification chains</p>
      </div>

      {/* SELECTOR */}
      <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Select Project:</span>
        <select 
          value={currentProjectId || ''} 
          onChange={(e) => onProjectSelected(Number(e.target.value))}
          style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {project ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* Left Column: Lifecycle, Outcome Gaps, Before/After */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 57. Outcome Gap Detector Alert */}
            {project.status === 'completed' && !project.outcome_verified && (
              <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', padding: '16px', borderRadius: '8px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <ShieldAlert size={20} color="var(--status-critical)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--status-critical)' }}>
                    ⚠️ 57. Outcome Gap Detected!
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    This infrastructure project is marked <b>100% physically built</b>, but real operational indicators show a discrepancy: <b>Actual usage is under 20%</b>.
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Reason: Main water flow pressure is insufficient. Restoring normal pressure requires completing an outcome audit.
                  </p>
                  <button 
                    onClick={() => onAuditCompleted(project.id)}
                    className="accent" 
                    style={{ padding: '6px 12px', fontSize: '0.7rem', marginTop: '10px' }}>
                    Trigger Geotagged Flow Rate Audit & Confirm Outcome
                  </button>
                </div>
              </div>
            )}

            {/* 56. Project Lifecycle Tracker */}
            <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>56. Six-Stage Project Lifecycle Tracker</h4>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
                {[
                  { label: 'Approved', active: true },
                  { label: 'Started', active: true },
                  { label: 'Built', active: project.physical_progress_pct >= 100 },
                  { label: 'Functional', active: project.functional_status_pct >= 100 },
                  { label: 'Used', active: project.actual_usage_pct >= 80 },
                  { label: 'Outcome', active: project.outcome_verified }
                ].map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                    <span style={{ 
                      background: step.active ? 'var(--status-low)' : 'rgba(255,255,255,0.05)',
                      color: step.active ? '#fff' : 'var(--text-muted)',
                      padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold'
                    }}>
                      {step.label}
                    </span>
                    {idx < 5 && <ArrowRight size={10} color="var(--text-muted)" />}
                  </div>
                ))}
              </div>
            </div>

            {/* 58. Before/After Verification photos comparison */}
            <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>58. Site Inspection Verification</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>BEFORE INTERVENTION (GEOTAGGED)</span>
                  <div style={{ height: '80px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0', fontSize: '0.7rem', color: 'var(--status-critical)', border: '1px dashed var(--status-critical)' }}>
                    ❌ Broken Cable & Low Output
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Captured: Aug 8, 17:52</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>AFTER RESTORATION (GEOTAGGED)</span>
                  <div style={{ height: '80px', background: 'rgba(16,185,129,0.05)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0', fontSize: '0.7rem', color: 'var(--status-low)', border: '1px dashed var(--status-low)' }}>
                    ✔️ Re-wound coil & clean valve
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Captured: Aug 13, 17:55</span>
                </div>
              </div>
            </div>

            {/* 61. Goal-to-Ground Tracker Pipeline */}
            <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>61. Goal-to-Ground Tracker Pipeline</h4>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.15)', padding: '12px 18px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem', overflowX: 'auto' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>PANCHAYAT GOAL</span>
                  <p style={{ fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>Zero Water Scarcity</p>
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>PROJECT TYPE</span>
                  <p style={{ fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>Borewell Restore</p>
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>DISPATCHED ACTION</span>
                  <p style={{ fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>Motor Winding</p>
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>ACTUAL OUTCOME</span>
                  <p style={{ fontWeight: 'bold', color: 'var(--status-low)', marginTop: '2px' }}>82 L/m Flow Restored</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Scorecard, Evidence Chain, Delays */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 59. Intervention Scorecard */}
            <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>59. Project Intervention Scorecard</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                {[
                  { label: 'Cost Efficiency Index', val: scorecardScores.costEfficiency, max: 10 },
                  { label: 'Construction Speed Rate', val: scorecardScores.constructionSpeed, max: 10 },
                  { label: 'Target Population Benefit', val: scorecardScores.populationBenefit, max: 10 },
                  { label: 'Service Reliability Improvement', val: scorecardScores.serviceImprovement, max: 10 },
                  { label: 'Recurrence Deterrence Score', val: scorecardScores.recurrencePrevention, max: 10 }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontWeight: 'bold' }}>{item.val} / {item.max}</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.val * 10}%`, height: '100%', background: 'var(--accent-primary)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 60. Project Evidence Chain */}
            <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckSquare size={16} color="var(--status-low)" />
                <span>60. Project Evidence Chain Checklist</span>
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
                Immutable digital receipts confirming the authenticity of construction reports.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.7rem' }}>
                {evidenceChain.map((ev, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                    <span>📄 {ev.title}</span>
                    <span style={{ color: 'var(--status-low)', fontWeight: 600 }}>{ev.status} ({ev.sign})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 62 & 63. Bottlenecks & Delay Intelligence */}
            <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-medium)' }}>
                <Activity size={16} />
                <span>62. Bottleneck & Administrative Delay Tracker</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem' }}>
                {delayData.map((d, idx) => (
                  <div key={idx} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                      <span>{d.stage}</span>
                      <span style={{ color: d.status === 'EXCEEDED' ? 'var(--status-critical)' : 'var(--status-low)' }}>
                        {d.days} Days / Max {d.limit}d ({d.status})
                      </span>
                    </div>
                    {d.status === 'EXCEEDED' && (
                      <p style={{ color: 'var(--status-medium)', fontSize: '0.65rem', marginTop: '2px' }}>
                        ⚠️ Delay Reason: {d.delayReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>No project selected.</div>
      )}

    </div>
  );
}
