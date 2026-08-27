import React, { useState } from 'react';
import { 
  ShieldAlert, Activity, BarChart, FileText, CheckCircle, 
  AlertTriangle, RefreshCw, Layers, Compass, HelpCircle 
} from 'lucide-react';
import type { Incident, Asset, Village } from '../types';

interface GroundRealityProps {
  villageId: number;
  assets: Asset[];
  incidents: Incident[];
  villages: Village[];
}

export default function GroundReality({ 
  villageId, 
  assets, 
  incidents, 
  villages 
}: GroundRealityProps) {
  const activeVillage = villages.find(v => v.id === villageId) || villages[0];

  // 14. Fusion Confidence Speedometer calculation helper
  // Base confidence is high, reduced if contradictions or bad sensor quality
  const [fusionConfidence, setFusionConfidence] = useState(89.4);
  
  // Mock data for contradictions
  const contradictions = [
    {
      id: 1,
      assetName: 'Piparli Streetlight #14',
      officialStatus: 'Operational',
      sensorTelemetry: 'Inactive (0.0 kW power draw)',
      citizenReport: 'Broken (Report ID #42: "Light out for 2 weeks")',
      status: 'CRITICAL CONTRADICTION'
    },
    {
      id: 2,
      assetName: 'Piparli Drain Segment B',
      officialStatus: 'Cleaned (Contractor Log #88)',
      sensorTelemetry: 'Flow restricted (Water Level: 84% blockage sensor)',
      citizenReport: 'Water backing up into courtyards',
      status: 'WARNING CONTRADICTION'
    }
  ];

  // Mock data for Invisible Problem Detector (problems found via sensor telemetry before citizen complaint)
  const invisibleProblems = [
    {
      id: 101,
      assetName: 'Community Handpump B',
      indicator: 'Winding Temperature High',
      metric: '105°C (Threshold: 85°C)',
      estimatedFailure: '3 days remaining',
      action: 'Flagged for preventive lubrication dispatch'
    },
    {
      id: 102,
      assetName: 'Water Purification Filter #3',
      indicator: 'Pressure drop (Membrane clogging)',
      metric: 'Pressure Delta: 1.4 Bar (Normal < 0.5 Bar)',
      estimatedFailure: '5 days remaining',
      action: 'Flagged for backwash flushing cycle'
    }
  ];

  // Mock data for Evidence Quality Scores
  const evidenceQualityScores = {
    overall: 91.2,
    completeness: 88,
    freshness: 95,
    reliability: 90,
    gpsAccuracy: 98,
    timestampVerification: 100
  };

  // Mock data for Unknown Zone Detector (areas lacking sensors or logs)
  const unknownZones = [
    {
      wardName: 'Ward C (East Hamlets)',
      coverage: 'Low (18%)',
      reason: 'No connected IoT sensors, lowest digital app downloads (4%)',
      recommendation: 'Deploy mobile supervisor or install 2 nodes on community wells'
    },
    {
      wardName: 'Ward E (West Agriculture Block)',
      coverage: 'Medium-Low (32%)',
      reason: 'Stale asset registry (Last survey 220 days ago)',
      recommendation: 'Trigger digital twin asset verification project'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* HEADER SECTION */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Ground Reality Intelligence Engine</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fuses citizen records, sensor telemetry, and historical audits to monitor integrity and uncover invisible failures</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column - Fusion Engine, Contradictions, and Anomalies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 13 & 14. Fusion Engine Card */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={18} color="var(--accent-secondary)" />
                <span>Multi-Source Evidence Fusion Panel</span>
              </h4>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Real-time synchronization</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
              {/* Dial widget */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  width: '100px', height: '100px', borderRadius: '50%', 
                  background: 'conic-gradient(var(--accent-primary) 0% 89%, rgba(255,255,255,0.05) 89% 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
                }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{fusionConfidence}%</span>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>CONFIDENCE</span>
                  </div>
                </div>
              </div>

              {/* Description explanation */}
              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  The <b>Ground Reality Engine</b> aggregates digital maps, worker check-ins, sensor variables, and oral reports to formulate a unified operating grid.
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '4px', color: 'var(--accent-primary)' }}>
                    ● 12 Telemetry Feeds
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px', color: 'var(--status-low)' }}>
                    ● 3 Field Audits
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 16. Contradiction Detector */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-critical)' }}>
              <AlertTriangle size={18} />
              <span>Contradiction Detection Matrix</span>
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {contradictions.map(item => (
                <div key={item.id} style={{ border: '1px solid rgba(244,63,94,0.15)', background: 'rgba(244,63,94,0.02)', padding: '12px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 'bold' }}>
                    <span style={{ color: '#fff' }}>{item.assetName}</span>
                    <span style={{ color: 'var(--status-critical)' }}>{item.status}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>OFFICIAL STATUS</span>
                      <p style={{ fontWeight: 600, color: 'var(--status-low)', marginTop: '2px' }}>{item.officialStatus}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SENSOR READING</span>
                      <p style={{ fontWeight: 600, color: 'var(--status-critical)', marginTop: '2px' }}>{item.sensorTelemetry}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>CITIZEN FEEDBACK</span>
                      <p style={{ fontWeight: 600, color: 'var(--status-medium)', marginTop: '2px' }}>{item.citizenReport}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 15. Invisible Problem Detector */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-medium)' }}>
              <Compass size={18} />
              <span>Invisible Problem Detector (Pre-Complaint Flags)</span>
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Identifies impending hardware failures from mechanical telemetry anomalies before citizens experience outages.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {invisibleProblems.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <div>
                    <h5 style={{ fontWeight: 600, color: '#fff' }}>{item.assetName}</h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '2px' }}>Anomaly: {item.indicator} ({item.metric})</p>
                    <span style={{ color: 'var(--status-medium)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>⏱ Estimated Breakdown: {item.estimatedFailure}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ background: 'rgba(234,179,8,0.1)', color: 'var(--status-medium)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                      {item.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column - Evidence Quality, Unknown Zones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 17. Evidence Quality Score */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart size={18} color="var(--accent-primary)" />
              <span>Evidence Quality Analytics Score</span>
            </h4>
            
            {/* Main Score Progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>
                <span>Overall Quality Index</span>
                <span>{evidenceQualityScores.overall}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${evidenceQualityScores.overall}%`, height: '100%', background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))' }} />
              </div>
            </div>

            {/* Breakdown meters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', marginTop: '6px' }}>
              {[
                { label: 'Completeness', val: evidenceQualityScores.completeness, desc: 'Presence of photos, coordinates, and recordings' },
                { label: 'Freshness / Age', val: evidenceQualityScores.freshness, desc: 'Signals gathered within past 24 hours' },
                { label: 'Source Reliability', val: evidenceQualityScores.reliability, desc: 'Verified citizen status & calibrated IoT nodes' },
                { label: 'GPS Integrity', val: evidenceQualityScores.gpsAccuracy, desc: 'Geotag within village perimeter borders' },
                { label: 'Timestamp Verification', val: evidenceQualityScores.timestampVerification, desc: 'Synchronized network time stamp check' }
              ].map((item, idx) => (
                <div key={idx} style={{ padding: '6px 0', borderBottom: idx < 4 ? '1px solid rgba(255,255,255,0.02)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontWeight: 'bold' }}>{item.val}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.val}%`, height: '100%', background: 'var(--accent-secondary)' }} />
                  </div>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 18. Unknown Zone Detector */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)' }}>
              <Layers size={18} />
              <span>Unknown Zone Detector</span>
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Highlights village sectors where the administration lacks adequate, fresh, or reliable telemetry data to formulate decisions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {unknownZones.map((zone, idx) => (
                <div key={idx} style={{ background: 'rgba(99,102,241,0.02)', border: '1px dashed rgba(99,102,241,0.3)', padding: '12px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 'bold' }}>
                    <span style={{ color: '#fff' }}>{zone.wardName}</span>
                    <span style={{ color: 'var(--status-critical)' }}>Data coverage: {zone.coverage}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}><b>Issue:</b> {zone.reason}</p>
                  <div style={{ marginTop: '6px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', color: 'var(--accent-secondary)', fontSize: '0.65rem', fontWeight: 600 }}>
                    💡 Action Recommendation: {zone.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
