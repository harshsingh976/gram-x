import { Database, AlertCircle } from 'lucide-react';

export default function DataIntelligence() {
  
  // 145. Data Quality Command Centre metrics
  const qualityScores = {
    freshness: 94,
    completeness: 88,
    modelConfidence: 91,
    evidenceConfidence: 89
  };

  // Anomaly logs / cleaning bulletins
  const dataQualityLogs = [
    { id: 1, type: 'IMPOSSIBLE VALUE', asset: 'Streetlight #12', details: 'Telemetry reading logged 9,999 lux at 12:00 AM midnight (Suspected calibration/photocell fault).' },
    { id: 2, type: 'STALE RECORD', asset: 'Ramnagar Cistern Valve', details: 'No maintenance check-ins recorded for 180 days (Overdue verification checklist).' },
    { id: 3, type: 'CONFLICTING ENTRIES', asset: 'Borewell Pump #3', details: 'PHE contractor marked complete but local smart meter shows 0.0 Amps power consumption.' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* HEADER */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Data Quality Command Centre</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Evaluates structural integrity, monitors sensor drift parameters, and flags staleness anomalies across database nodes</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Quality gauges & completeness */}
        <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={18} color="var(--accent-primary)" />
            <span>Data Integrity Scores & Safeguards</span>
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.75rem' }}>
            {/* 146. Data Freshness */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>146. Data Freshness Score</span>
                <span style={{ fontWeight: 'bold' }}>{qualityScores.freshness}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${qualityScores.freshness}%`, height: '100%', background: 'var(--status-low)' }} />
              </div>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Average delay since last active IoT/Worker telemetry ping</span>
            </div>

            {/* 147. Data Completeness */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>147. Data Completeness Score</span>
                <span style={{ fontWeight: 'bold' }}>{qualityScores.completeness}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${qualityScores.completeness}%`, height: '100%', background: 'var(--accent-secondary)' }} />
              </div>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Required columns filled (GPS, evidence files, audit confirmations)</span>
            </div>

            {/* 148. Model Confidence */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>148. AI Model Confidence Index</span>
                <span style={{ fontWeight: 'bold' }}>{qualityScores.modelConfidence}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${qualityScores.modelConfidence}%`, height: '100%', background: 'var(--accent-primary)' }} />
              </div>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Calculated accuracy score across priority assessment pipelines</span>
            </div>

            {/* 149. Evidence Confidence */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>149. Evidence Fusion Confidence</span>
                <span style={{ fontWeight: 'bold' }}>{qualityScores.evidenceConfidence}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${qualityScores.evidenceConfidence}%`, height: '100%', background: 'var(--status-medium)' }} />
              </div>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Cross-sensor and citizen confirmation coherence scale</span>
            </div>

          </div>
        </div>

        {/* Right Column: Cleaning bulletins / log alerts */}
        <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-critical)' }}>
            <AlertCircle size={18} />
            <span>Data Cleaning bulletins & Alerts</span>
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem' }}>
            {dataQualityLogs.map(log => (
              <div key={log.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--status-critical)' }}>{log.type}</span>
                  <span style={{ color: '#fff' }}>{log.asset}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', lineHeight: '1.3' }}>{log.details}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
