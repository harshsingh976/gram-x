import { useState } from 'react';
import { Users, ShieldAlert, Sparkles } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function EquityIntel() {
  const [optimizeForEquity, setOptimizeForEquity] = useState(false);

  // 64. Service Accessibility inequality data (by Ward)
  const wardEquityData = [
    { ward: 'Ward A (Piparli North)', accessibility: 96, pop: 450, class: 'General Sector' },
    { ward: 'Ward B (Central Town)', accessibility: 88, pop: 520, class: 'Mixed Sector' },
    { ward: 'Ward C (East Hamlet)', accessibility: 78, pop: 220, class: 'Minority Colony' },
    { ward: 'Ward D (South Border)', accessibility: 42, pop: 350, class: 'SC/ST Hamlet' },
    { ward: 'Ward E (West Agriculture)', accessibility: 55, pop: 180, class: 'Marginal Farmers' }
  ];

  // 65. Last-Mile Gaps list
  const lastMileGaps = [
    {
      location: 'Ward D (South Border)',
      metric: '42% Water Coverage Access',
      impact: '350 residents depend on 1 functional handpump 1.1km away',
      severity: 'CRITICAL LAST-MILE GAP'
    },
    {
      location: 'Ward E (West Agriculture Block)',
      metric: '55% Electrification Coverage',
      impact: '180 residents experience 6h daily load shedding average',
      severity: 'HIGH WARNING GAP'
    }
  ];

  // 67. Citizen Silence Signal list
  const silenceSignals = [
    {
      location: 'Ward E (Harijan Basti - West Sector)',
      complaints: 0,
      appActivity: '0% logins logged',
      sensorReading: '0.0 L/min flow rate detected (Borewell #22)',
      status: 'SILENCE SIGNAL TRIGGERED',
      details: 'Warning: Zero complaints filed hides a suspected outage due to low smartphone penetration. Suggest manual surveyor dispatch.'
    }
  ];

  // 66. Equity-Aware Budget Simulator calculations
  const standardInterventions = [
    { name: 'Upgrade Ward A Water Tanker Station', cost: 45000, target: 'Ward A (96% access)' },
    { name: 'Pave Ward B Market Lane Segment', cost: 75000, target: 'Ward B (88% access)' },
    { name: 'Repair Ward D Handpump Motor Coil', cost: 18000, target: 'Ward D (42% access)' },
    { name: 'Construct Ward D Drainage Silt Trap', cost: 22000, target: 'Ward D (42% access)' }
  ];

  const equityOptimizedInterventions = [
    { name: 'Repair Ward D Handpump Motor Coil', cost: 18000, target: 'Ward D (42% access)' },
    { name: 'Construct Ward D Drainage Silt Trap', cost: 22000, target: 'Ward D (42% access)' },
    { name: 'Pave Ward E Agricultural Connector', cost: 65000, target: 'Ward E (55% access)' },
    { name: 'Pave Ward B Market Lane Segment', cost: 75000, target: 'Ward B (88% access)' }
  ];

  const activeInterventions = optimizeForEquity ? equityOptimizedInterventions : standardInterventions;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* HEADER */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Service Equity & Last-Mile Intelligence</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Measures service accessibility parity across minority and SC/ST hamlets, and highlights data silence warnings</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Equity Chart & Silence Signals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 64. Equity Chart */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>64. Ward Service Access Inequality Index</h4>
            
            <div style={{ height: '180px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wardEquityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="ward" stroke="var(--text-muted)" fontSize={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} />
                  <Bar dataKey="accessibility" name="Service Access Level (%)" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              📌 <b>Equity Disparity:</b> Ward D (SC/ST Hamlet) has the lowest accessibility score (42%). This indicates service inequality requiring targeted administrative action.
            </div>
          </div>

          {/* 67. Citizen Silence Signal */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-medium)' }}>
              <ShieldAlert size={18} />
              <span>67. Citizen Silence Signal Monitor</span>
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {silenceSignals.map((sig, idx) => (
                <div key={idx} style={{ border: '1px solid rgba(234,179,8,0.15)', background: 'rgba(234,179,8,0.02)', padding: '12px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 'bold' }}>
                    <span style={{ color: '#fff' }}>{sig.location}</span>
                    <span style={{ color: 'var(--status-medium)' }}>{sig.status}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>COMPLAINTS</span>
                      <p style={{ fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{sig.complaints}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>APP LOGINS</span>
                      <p style={{ fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{sig.appActivity}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SENSOR STATUS</span>
                      <p style={{ fontWeight: 'bold', color: 'var(--status-critical)', marginTop: '2px' }}>{sig.sensorReading}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    ⚠️ {sig.details}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Last-Mile Gaps & Optimization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 66. Equity-Aware Budget Optimization */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="var(--accent-primary)" />
              <span>66. Equity-Aware Budget Optimization</span>
            </h4>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                id="optimize-checkbox"
                type="checkbox"
                checked={optimizeForEquity}
                onChange={(e) => setOptimizeForEquity(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
              />
              <label htmlFor="optimize-checkbox" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                Toggle Equity-Aware Target Allocation
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                {optimizeForEquity 
                  ? '✨ Prioritizing underserved hamlets (access < 60%) first, regardless of simple cost-per-capita indicators:' 
                  : '📊 Standard allocation prioritizing cost efficiency first:'}
              </p>
              {activeInterventions.map((item, idx) => (
                <div key={idx} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.name}</span>
                  <span style={{ fontWeight: 'bold', color: item.target.includes('42%') ? 'var(--status-medium)' : 'var(--text-muted)' }}>
                    {item.target}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 65. Last-Mile Gap Detection */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-critical)' }}>
              <Users size={16} />
              <span>65. Last-Mile Accessibility Gaps</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
              {lastMileGaps.map((gap, idx) => (
                <div key={idx} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                    <span>{gap.location}</span>
                    <span style={{ color: 'var(--status-critical)', fontSize: '0.65rem', fontWeight: 700 }}>{gap.severity}</span>
                  </div>
                  <p style={{ color: 'var(--accent-secondary)', fontSize: '0.7rem' }}><b>Status:</b> {gap.metric}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', marginTop: '2px' }}><b>Impact:</b> {gap.impact}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
