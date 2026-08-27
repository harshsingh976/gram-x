import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, Compass, MapPin, 
  Map, Play, RefreshCw, Send, CheckCircle 
} from 'lucide-react';
import type { Asset } from '../types';

interface CrisisIntelligenceProps {
  villageId: number;
  assets: Asset[];
}

export default function CrisisIntelligence({ villageId, assets }: CrisisIntelligenceProps) {
  const [activePlanStep, setActivePlanStep] = useState<'immediate' | 'shortterm' | 'permanent'>('immediate');
  
  // 122. Crisis Command Centre Metrics
  const crisisMetrics = {
    affectedPop: 740,
    criticalAssetsFailed: 1, // Pump #17
    availableResponders: 3,
    blockedRoadsCount: 1,
    safeShelters: 'Panchayat Main Hall (Capacity: 150)'
  };

  // 123. Emergency Tanker Routing Coordinates
  const emergencyRoute = [
    { name: 'Water Treatment Plant (Source)', lat: 23.279, lng: 77.458 },
    { name: 'Blocked Main Road (Reroute Hop)', lat: 23.282, lng: 77.455 },
    { name: 'Ward B Distribution Cistern (Destination)', lat: 23.284, lng: 77.451 }
  ];

  // 124. Temporary Solution Planner
  const solutionPlan = {
    immediate: {
      title: 'Phase 1: Immediate Action (Hours 0 - 12)',
      action: 'Mobilize 3 emergency potable water tankers from Raisen municipal depot.',
      cost: '₹4,500 / Day',
      outcomes: 'Secures 15 Liters/capita/day drinking allocation for 740 residents.'
    },
    shortterm: {
      title: 'Phase 2: Short-term Relief (Days 1 - 3)',
      action: 'Install PVC temporary bypass connection from Community Hall Rainwater Cistern.',
      cost: '₹12,000 upfront',
      outcomes: 'Restores gravity-fed washing water outlet taps directly in Ward B lane intersections.'
    },
    permanent: {
      title: 'Phase 3: Permanent Resolution (Days 3 - 7)',
      action: 'Decommission failed submersible pump coil, install complete replacement copper motor windings + grid stabilizer.',
      cost: '₹95,000 replacement cost',
      outcomes: 'Guarantees long-term grid voltage tolerance and resolves system failure loop.'
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* 121. Active Crisis Alert Header */}
      <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid var(--status-critical)', padding: '16px', borderRadius: '10px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <ShieldAlert size={24} color="var(--status-critical)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--status-critical)', fontFamily: 'var(--font-title)' }}>
            ⚠️ 121. CRISIS MODE ACTIVATED: SYSTEM RESTORATION CRISIS
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Severe Water Scarcity alert triggered in Piparli block. Citizen feedback flags zero water access. Responders mobilised.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Command Desk & Solution Planner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 122. Crisis Command Desk */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>122. Crisis Command Centre Panel</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.75rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>AFFECTED POPULATION</span>
                <p style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem', marginTop: '2px' }}>{crisisMetrics.affectedPop} Citizens</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>CRITICAL ASSETS OFFLINE</span>
                <p style={{ fontWeight: 'bold', color: 'var(--status-critical)', fontSize: '1rem', marginTop: '2px' }}>{crisisMetrics.criticalAssetsFailed} Pump</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>SAFE RELIEF SHELTERS</span>
                <p style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.75rem', marginTop: '4px' }}>{crisisMetrics.safeShelters}</p>
              </div>
            </div>
          </div>

          {/* 124. Temporary Solution Planner */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>124. Phased Temporary Solution Planner</h4>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                onClick={() => setActivePlanStep('immediate')}
                style={{ 
                  background: activePlanStep === 'immediate' ? 'var(--status-critical)' : 'rgba(255,255,255,0.03)',
                  color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer'
                }}>
                Immediate
              </button>
              <button 
                onClick={() => setActivePlanStep('shortterm')}
                style={{ 
                  background: activePlanStep === 'shortterm' ? 'var(--status-medium)' : 'rgba(255,255,255,0.03)',
                  color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer'
                }}>
                Short-term Relief
              </button>
              <button 
                onClick={() => setActivePlanStep('permanent')}
                style={{ 
                  background: activePlanStep === 'permanent' ? 'var(--status-low)' : 'rgba(255,255,255,0.03)',
                  color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer'
                }}>
                Permanent Fix
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '6px', fontSize: '0.75rem' }}>
              <h5 style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fff', marginBottom: '8px' }}>
                {solutionPlan[activePlanStep].title}
              </h5>
              <p style={{ color: '#fff', marginBottom: '6px' }}>
                <b>Proposed Action:</b> {solutionPlan[activePlanStep].action}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <div>Est Cost: <b style={{ color: '#fff' }}>{solutionPlan[activePlanStep].cost}</b></div>
                <div>Expected Outcome: <b style={{ color: '#fff' }}>{solutionPlan[activePlanStep].outcomes}</b></div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Routing & Offline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 123. Emergency Resource Routing */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Map size={16} color="var(--accent-secondary)" />
              <span>123. Emergency Tanker Route Waypoints</span>
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Computes alternative road segments to bypass structural obstructions during floods or mud-slides.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.7rem' }}>
              {emergencyRoute.map((route, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff'
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 'bold', color: '#fff' }}>{route.name}</h5>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Coords: {route.lat}, {route.lng}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 125. Crisis Offline Mode for responders */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>125. Crisis Offline Node Status</h4>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 'bold' }}>
                <span>Offline Synchronizer</span>
                <span style={{ color: 'var(--status-low)' }}>ONLINE & SYNCED</span>
              </div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                Field worker devices cached 2 reports during outage. All records successfully synched with Panchayat HQ databases.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
