import React, { useState } from 'react';
import { 
  Wrench, Clock, Landmark, AlertTriangle, Play, 
  HelpCircle, CheckCircle, ShieldAlert, BarChart3 
} from 'lucide-react';
import type { Asset, AssetDetail } from '../types';

interface AssetIntelProps {
  assets: Asset[];
  selectedAssetId: number | null;
  assetDetail: AssetDetail | null;
  onAssetSelected: (id: number) => void;
}

export default function AssetIntel({ 
  assets, 
  selectedAssetId, 
  assetDetail,
  onAssetSelected
}: AssetIntelProps) {
  // If no asset is selected, default to Pump #17
  const currentAssetId = selectedAssetId || assets.find(a => a.name.includes("Pump #17"))?.id || assets[0]?.id;

  // Mock list of maintenance debt
  const maintenanceDebt = {
    totalDebt: 245000,
    delayedPumpCount: 2,
    delayedStreetlightCount: 14,
    delayedDrainCount: 3,
    severity: 'MEDIUM-HIGH'
  };

  // Mock Lifecycle data
  const lifecycleStages = [
    { label: 'Installation', desc: 'Installed Nov 2022', active: true },
    { label: 'Operation', desc: 'Running 6h/day average', active: true },
    { label: 'Anomalous Wear', desc: 'Bearing current spikes logged', active: true },
    { label: 'Maintenance Intercept', desc: 'Scheduled armature rewind', active: true },
    { label: 'Retirement', desc: 'Predicted replacement Nov 2027', active: false }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* HEADER */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Asset Lifecycle & Economics Core</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tracks complete historical breakdown memory, projects failure likelihood timelines, and measures accumulated maintenance debt</p>
      </div>

      {/* SEARCH/SELECTOR BOX */}
      <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Select Asset to Inspect:</span>
        <select 
          value={currentAssetId || ''} 
          onChange={(e) => onAssetSelected(Number(e.target.value))}
          style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          {assets.map(a => (
            <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Profile & Economics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 50. Complete Asset Profile */}
          {assetDetail ? (
            <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{assetDetail.name} Profile</h4>
                <span style={{ 
                  background: assetDetail.status === 'operational' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                  color: assetDetail.status === 'operational' ? 'var(--status-low)' : 'var(--status-critical)',
                  padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700
                }}>
                  {assetDetail.status.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>ASSET AGE</span>
                  <p style={{ fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>3.8 Years</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>UTILIZATION RATE</span>
                  <p style={{ fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{assetDetail.current_utilization}%</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>RELIABILITY INDEX</span>
                  <p style={{ fontWeight: 'bold', color: 'var(--status-low)', marginTop: '2px' }}>
                    {assetDetail.status === 'operational' ? '92%' : '45% (Degraded)'}
                  </p>
                </div>
              </div>

              {/* 51. Failure Memory Log */}
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>51. Failure Memory Timeline</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.7rem' }}>
                  {assetDetail.maintenance_history && assetDetail.maintenance_history.length > 0 ? (
                    assetDetail.maintenance_history.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                        <span>🛠 {m.action_taken}</span>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          <span>{new Date(m.date).toLocaleDateString()}</span>
                          <span style={{ marginLeft: '10px', fontWeight: 'bold', color: '#fff' }}>₹{m.cost.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', padding: '6px' }}>No failure logs found.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading asset profile...</div>
          )}

          {/* 52. Maintenance Economics Comparison */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>52. Maintenance Economics Sandbox</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '0.75rem' }}>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <b style={{ color: 'var(--accent-secondary)' }}>REPAIR OPTION</b>
                <p style={{ color: '#fff', margin: '4px 0', fontSize: '0.7rem' }}>Winding rewind</p>
                <span style={{ fontSize: '0.65rem' }}>Cost: <b>₹18,000</b><br />Reliability: <b>+6m</b></span>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <b style={{ color: 'var(--status-low)' }}>REPLACE OPTION</b>
                <p style={{ color: '#fff', margin: '4px 0', fontSize: '0.7rem' }}>New 10HP motor</p>
                <span style={{ fontSize: '0.65rem' }}>Cost: <b>₹95,000</b><br />Reliability: <b>+5y</b></span>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <b style={{ color: 'var(--status-medium)' }}>RETIRE OPTION</b>
                <p style={{ color: '#fff', margin: '4px 0', fontSize: '0.7rem' }}>Decommission</p>
                <span style={{ fontSize: '0.65rem' }}>Cost: <b>₹0</b><br />Reliability: <b>0</b></span>
              </div>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <b style={{ color: 'var(--accent-primary)' }}>REUSE SWAP</b>
                <p style={{ color: '#fff', margin: '4px 0', fontSize: '0.7rem' }}>Community cistern</p>
                <span style={{ fontSize: '0.65rem' }}>Cost: <b>₹2,500</b><br />Reliability: <b>Temp</b></span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Life-cycle & Debt */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 54. Asset Failure Prediction */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} color="var(--status-critical)" />
              <span>54. Predictive Failure Probability Meter</span>
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '14px', alignItems: 'center' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'conic-gradient(var(--status-critical) 0% 82%, rgba(255,255,255,0.05) 82% 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>
                  82%
                </div>
              </div>
              <div style={{ fontSize: '0.75rem' }}>
                <b style={{ color: 'var(--status-critical)' }}>High Winding Thermal Friction</b>
                <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Motor is pulling 14.8 Amps current (exceeding safety envelope of 12.0 Amps). High breakdown threat within next 140 operating hours.
                </p>
              </div>
            </div>
          </div>

          {/* 53. Maintenance Debt Map Overlay */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart3 size={16} color="var(--accent-secondary)" />
              <span>53. Maintenance Debt Summary</span>
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Financial and asset burden backlog representing postponed scheduled updates.
            </p>

            <div style={{ background: 'rgba(244,63,94,0.02)', border: '1px solid rgba(244,63,94,0.15)', padding: '14px', borderRadius: '8px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
                <span>Deferred Backlog Cost</span>
                <span style={{ color: 'var(--status-critical)' }}>₹{maintenanceDebt.totalDebt.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', color: 'var(--text-secondary)' }}>
                <div>Pumps: <b>{maintenanceDebt.delayedPumpCount}</b></div>
                <div>Streetlights: <b>{maintenanceDebt.delayedStreetlightCount}</b></div>
                <div>Drains: <b>{maintenanceDebt.delayedDrainCount}</b></div>
              </div>
            </div>
          </div>

          {/* 55. Asset Lifecycle Intelligence */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>55. Asset Lifecycle Progress Bar</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem' }}>
              {lifecycleStages.map((stage, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: '18px', height: '18px', borderRadius: '50%', 
                    background: stage.active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, marginTop: '2px'
                  }}>
                    {stage.active && <CheckCircle size={10} color="#fff" />}
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 'bold', color: stage.active ? '#fff' : 'var(--text-muted)' }}>{stage.label}</h5>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{stage.desc}</p>
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
