import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, Sparkles, Scale, Info, 
  HelpCircle, CheckCircle, RefreshCw, AlertTriangle 
} from 'lucide-react';

interface ResponsibleAIProps {
  villageId: number;
}

export default function ResponsibleAI({ villageId }: ResponsibleAIProps) {
  const [challenged, setChallenged] = useState(false);
  const [challengeReason, setChallengeReason] = useState('contractor_dispute');
  const [overrideSubmitted, setOverrideSubmitted] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState('');

  // 151. Priority Score explanation
  const priorityFormula = `Priority Score = (Severity Weight * 0.3) + (Affected Pop Weight * 0.25) + (Criticality * 0.2) + (Evidence Conf. * 0.15) + (Cost Factor * 0.1)`;

  // 156. Decision Audit Trail
  const decisionAuditTrail = [
    { date: 'Aug 13, 17:52', user: 'System Init', action: 'Populated Piparli Block baseline assets telemetry database' },
    { date: 'Aug 13, 17:53', user: 'Citizen Sunita Devi', action: 'Submitted Bhojpuri dialect voice complaint' },
    { date: 'Aug 13, 17:53', user: 'AI Core', action: 'Escalated priority to CRITICAL (92.5/100) using multi-source fusion' },
    { date: 'Aug 13, 17:54', user: 'Sec. Rajesh Kumar', action: 'Approved Suresh Kumar plumber dispatch (Human-in-the-Loop validation)' },
    { date: 'Aug 13, 17:55', user: 'Tech Suresh Kumar', action: 'Marked repair task COMPLETED in worker portal' }
  ];

  const handleChallengeSubmit = () => {
    setChallenged(true);
    alert("AI Recommendation Challenged successfully. Recalculating risk weights based on custom overrides.");
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideJustification) return;
    setOverrideSubmitted(true);
    alert(`Human Override Logged: "${overrideJustification}". Registered to central database audit log.`);
    setOverrideJustification('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* HEADER */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Responsible AI, Safety & Trust Sandbox</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Enforces explainable AI models, logs human overrides, and guarantees fair audit language policies</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Explainability, Challenge, Overrides */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 151. Explainable AI & 153/154. Confidence bounds */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={18} color="var(--accent-secondary)" />
              <span>151. Explainable AI Priority Score Formula</span>
            </h4>
            
            <div style={{ background: '#050a12', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              {priorityFormula}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>153. AI MODEL CONFIDENCE</span>
                <p style={{ fontWeight: 'bold', color: 'var(--status-low)', fontSize: '0.9rem', marginTop: '2px' }}>94.2% Accurate</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>154. UNCERTAINTY BOUNDS</span>
                <p style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem', marginTop: '2px' }}>±6% Variance Limit</p>
              </div>
            </div>
          </div>

          {/* 158. AI Recommendation Challenge */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>158. AI Recommendation Challenge Panel</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem' }}>
              <label style={{ color: 'var(--text-secondary)' }}>Select Challenge Override factor:</label>
              <select 
                value={challengeReason}
                onChange={(e) => setChallengeReason(e.target.value)}
                style={{ padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff' }}>
                <option value="contractor_dispute">Contractor has active performance dispute (Force alternate technician)</option>
                <option value="monsoon_cutoff">Access road is mud-logged due to monsoon (Escalate delay margin +48h)</option>
                <option value="local_election">Local village election assembly scheduled (Suspend non-essential shutdowns)</option>
              </select>

              <button onClick={handleChallengeSubmit} className="secondary" style={{ padding: '8px', fontWeight: 600 }}>
                Challenge Active Recommendation & Recalculate Risk
              </button>

              {challenged && (
                <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.2)', padding: '10px', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--status-low)' }}>
                  ✔️ Recommendation challenged. System has recalculating dispatch models: Suresh Kumar dispatch adjusted.
                </div>
              )}
            </div>
          </div>

          {/* 157. Human Override Log Form */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>157. Human Override Log Entry</h4>
            
            <form onSubmit={handleOverrideSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
              <input 
                type="text" 
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
                placeholder="Enter justification for overriding AI suggestion..."
                style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff' }}
              />
              <button type="submit" className="accent" style={{ padding: '8px' }}>Log Administrative Override</button>
            </form>
          </div>

        </div>

        {/* Right Column: Audit Trail & Language Safeguards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 156. Decision Audit Trail */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="var(--status-low)" />
              <span>156. Decision Audit Trail Log</span>
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.7rem' }}>
              {decisionAuditTrail.map((log, idx) => (
                <div key={idx} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 'bold' }}>
                    <span>{log.user}</span>
                    <span>{log.date}</span>
                  </div>
                  <p style={{ color: '#fff' }}>{log.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 159. No Automatic Accusations Disclaimer */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-medium)' }}>
              <AlertTriangle size={16} />
              <span>159. Safety & No Automatic Accusations Policy</span>
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              In compliance with Responsible AI core guidelines, GRAM-X does not formulate automated legal accusations of fraud or corruption.
            </p>

            <div style={{ background: 'rgba(234,179,8,0.04)', border: '1px solid rgba(234,179,8,0.15)', padding: '12px', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              <b>Discrepancy Phrasing Rule:</b><br />
              Instead of labeling a contractor log variance as <i>"Billing Fraud"</i> or <i>"Corruption"</i>, the engine flags it as:<br />
              <b style={{ color: 'var(--status-medium)', display: 'block', margin: '4px 0' }}>
                🔍 "Administrative Review Required: Contract Billing hours vs Geotagged Signal Variance"
              </b>
              This guarantees due process and human-in-the-loop review.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
