import React, { useState } from 'react';
import { 
  ShieldAlert, Clock, Calendar, TrendingUp, AlertTriangle, 
  Settings, Play, HelpCircle, Activity, Info 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface PredictionFutureProps {
  villageId: number;
}

export default function PredictionFuture({ villageId }: PredictionFutureProps) {
  const [selectedIntervention, setSelectedIntervention] = useState<'repair' | 'replace' | 'preventive' | 'reuse' | 'donothing'>('repair');
  
  // 31. Do-Nothing Simulation Data (12 weeks decay curves)
  const doNothingDecayData = [
    { week: 'Week 0', repairCost: 18000, choleraRisk: 4, waterDeficit: 15 },
    { week: 'Week 2', repairCost: 22000, choleraRisk: 12, waterDeficit: 25 },
    { week: 'Week 4', repairCost: 29000, choleraRisk: 28, waterDeficit: 40 },
    { week: 'Week 6', repairCost: 38000, choleraRisk: 45, waterDeficit: 65 },
    { week: 'Week 8', repairCost: 52000, choleraRisk: 68, waterDeficit: 85 },
    { week: 'Week 10', repairCost: 65000, choleraRisk: 82, waterDeficit: 100 },
    { week: 'Week 12', repairCost: 78000, choleraRisk: 95, waterDeficit: 100 }
  ];

  // 29. Failure clock values
  const remainingHours = 142; // remaining hours for next asset in pipeline

  // 28. Seasonal Intelligence Calendar
  const seasonalIntelligence = [
    { season: 'Monsoon (Jul-Sep)', risk: 'Drain Overflow & Road Erosion', riskLevel: 'HIGH', color: 'var(--status-high)' },
    { season: 'Post-Monsoon (Oct-Nov)', risk: 'Vector-Breeding (Dengue/Malaria)', riskLevel: 'CRITICAL', color: 'var(--status-critical)' },
    { season: 'Winter (Dec-Feb)', risk: 'Fog-induced Streetlight Failures', riskLevel: 'LOW', color: 'var(--status-low)' },
    { season: 'Summer (Mar-Jun)', risk: 'Groundwater Scarcity & Aquifer Drops', riskLevel: 'CRITICAL', color: 'var(--status-critical)' }
  ];

  // 33. Counterfactual Intervention parameters comparison
  const counterfactuals = {
    donothing: {
      title: 'Do Nothing',
      cost: '₹78,000 (after 12w)',
      lifespan: '0 Months',
      consequence: 'Severe outbreak risk, water truck expenses (₹15,000/week), water scarcity',
      unintended: 'Total collapse of local trust, administrative litigation risk'
    },
    repair: {
      title: 'Standard Repair (Winding)',
      cost: '₹18,000',
      lifespan: '6 Months',
      consequence: 'Quick restore, but vulnerable to next voltage sag (12% repeat rate)',
      unintended: 'Temporary relief without resolving local substation grid balance'
    },
    replace: {
      title: 'Complete Replacement',
      cost: '₹95,000',
      lifespan: '5 Years',
      consequence: 'Excellent reliability, high water volume, long term security',
      unintended: 'Increases pipeline pressure by 35%, risking leaks in aging Ward C mains'
    },
    preventive: {
      title: 'Preventive Intervention',
      cost: '₹5,000',
      lifespan: '2 Months',
      consequence: 'Extends remaining motor life by lubricating/rewinding early',
      unintended: 'Requires scheduling down-time during crop irrigation peak hours'
    },
    reuse: {
      title: 'Asset Repurposing / Swapping',
      cost: '₹2,500',
      lifespan: 'Temporary Bypass',
      consequence: 'Redirect flow from underutilized Community Hall tank',
      unintended: 'Slightly reduces pressure at Community Hall during local festivals'
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* HEADER */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Prediction & Simulation Workbench</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Models deferred maintenance decay curves, estimates failure clocks, and calculates intervention trade-offs</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left column - Simulators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 31. Do-Nothing Simulator Graph */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>31. Do-Nothing Simulation (Deferred Maintenance Decay)</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--status-critical)', fontWeight: 'bold' }}>⚠️ 12-Week Scarcity Escalation</span>
            </h4>
            
            <div style={{ height: '200px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={doNothingDecayData}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--status-critical)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--status-critical)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--status-medium)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--status-medium)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#fff' }} 
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="repairCost" name="Repair Cost (₹)" stroke="var(--status-critical)" fillOpacity={1} fill="url(#costGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="choleraRisk" name="Waterborne Outbreak Risk (%)" stroke="var(--status-medium)" fillOpacity={1} fill="url(#healthGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              📌 <b>Do-Nothing Progression:</b> Postponing handpump repairs causes localized water scarcity, resulting in tanker rentals (₹15,000/week) and contamination risks rising from 4% to 95% as citizens fetch from shallow ditches.
            </div>
          </div>

          {/* 33. Counterfactual Intervention Engine */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>33. Counterfactual Intervention Engine</h4>
            
            {/* Toggle buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {Object.keys(counterfactuals).map(key => (
                <button 
                  key={key}
                  onClick={() => setSelectedIntervention(key as any)}
                  style={{ 
                    background: selectedIntervention === key ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                    color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' 
                  }}>
                  {counterfactuals[key as keyof typeof counterfactuals].title}
                </button>
              ))}
            </div>

            {/* Selected detail */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '6px', fontSize: '0.75rem' }}>
              <h5 style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--accent-secondary)', marginBottom: '8px' }}>
                Option: {counterfactuals[selectedIntervention].title}
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <div>Cost: <b style={{ color: '#fff' }}>{counterfactuals[selectedIntervention].cost}</b></div>
                <div>Expected Lifespan: <b style={{ color: '#fff' }}>{counterfactuals[selectedIntervention].lifespan}</b></div>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <b>Primary Outcome:</b> {counterfactuals[selectedIntervention].consequence}
              </p>
              
              {/* 35. Unintended Consequence Detector */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertTriangle size={14} color="var(--status-medium)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--status-medium)', fontWeight: 700 }}>35. UNINTENDED CONSEQUENCE WARNING</span>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{counterfactuals[selectedIntervention].unintended}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right column - Alerts & Maps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 27. Predictive Early Warning & 29. Failure Clock */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--accent-secondary)" />
              <span>29. Infrastructure Failure Clock</span>
            </h4>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.15)', padding: '14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--status-critical)' }}>
                {remainingHours}h
              </div>
              <div style={{ fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--status-critical)' }}>27. PREDICTIVE EARLY WARNING</span>
                <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Critical voltage fluctuations detected at Substation Node 4. Expected motor armature burnout on adjacent Handpump B in under 6 days.
                </p>
              </div>
            </div>
          </div>

          {/* 28. Seasonal Intelligence Calendar */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="var(--accent-primary)" />
              <span>28. Seasonal Infrastructure Risk Forecast</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
              {seasonalIntelligence.map((item, idx) => (
                <div key={idx} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h5 style={{ fontWeight: 600, color: '#fff' }}>{item.season}</h5>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Predicted: {item.risk}</p>
                  </div>
                  <span style={{ background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '4px', color: item.color, fontSize: '0.65rem', fontWeight: 700 }}>
                    {item.riskLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 30. Future Risk Hotspots Map indicator */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>30. Future Risk Hotspots Overlay</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
              <div style={{ padding: '8px', background: 'rgba(244,63,94,0.03)', borderLeft: '3px solid var(--status-critical)', borderRadius: '4px' }}>
                <b>🔴 Hotspot Alpha: Piparli Ward D</b>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>High risk of monsoon water logging due to narrow culvert pipeline (78% probability).</p>
              </div>
              <div style={{ padding: '8px', background: 'rgba(234,179,8,0.03)', borderLeft: '3px solid var(--status-medium)', borderRadius: '4px' }}>
                <b>🟡 Hotspot Beta: Ramnagar South Area</b>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Medium risk of streetlight outage due to oxidation on exposed overhead junction wires (54% probability).</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
