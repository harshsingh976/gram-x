import React, { useState, useEffect } from 'react';
import { 
  PiggyBank, TrendingUp, Info, HelpCircle, CheckCircle, 
  AlertTriangle, ArrowUpRight, DollarSign 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface MoneyBudgetProps {
  villageId: number;
}

export default function MoneyBudget({ villageId }: MoneyBudgetProps) {
  const [ledger, setLedger] = useState<any[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    setLoadingLedger(true);
    fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/villages/${villageId}/ledger`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setLedger(Array.isArray(data) ? data : []);
        setLoadingLedger(false);
      })
      .catch(() => {
        setLedger([]);
        setLoadingLedger(false);
      });
  }, [villageId]);
  // 38. Budget Slider State
  const [allocatedBudget, setAllocatedBudget] = useState<number>(150000); // default ₹1.5 Lakh

  // Mock list of candidate interventions
  const candidateProjects = [
    { id: 1, name: 'Borewell Pump #17 Motor Coil Repair', cost: 18000, pop: 740, severity: 5, category: 'Water', impactIndex: 205.5, convergence: 'PHE Scheme' },
    { id: 2, name: 'Market Junction Main Sewer Desilting', cost: 12000, pop: 480, severity: 4, category: 'Drainage', impactIndex: 160.0, convergence: 'Swachh Bharat' },
    { id: 3, name: 'Primary School Rainwater Cistern Seal', cost: 35000, pop: 350, severity: 4, category: 'Water', impactIndex: 40.0, convergence: 'NREGS' },
    { id: 4, name: 'Ward D Concrete Lane Paving (150m)', cost: 120000, pop: 600, severity: 3, category: 'Roads', impactIndex: 15.0, convergence: 'PMGSY' },
    { id: 5, name: 'Market Street Sodium Lamp Replacements', cost: 15000, pop: 220, severity: 3, category: 'Electricity', impactIndex: 44.0, convergence: 'Panchayat Core' },
    { id: 6, name: 'School Toilet Block Rehabilitation', cost: 85000, pop: 350, severity: 5, category: 'Sanitation', impactIndex: 20.5, convergence: 'Swachh Bharat' }
  ];

  // Sort candidate projects by Impact-per-Rupee index
  // Formula: (pop * severity) / cost * 1000
  const sortedProjects = [...candidateProjects].sort((a, b) => b.impactIndex - a.impactIndex);

  // Determine which projects are funded under current budget allocation slider
  let tempBudget = allocatedBudget;
  const fundedProjects = sortedProjects.map(proj => {
    if (tempBudget >= proj.cost) {
      tempBudget -= proj.cost;
      return { ...proj, funded: true };
    } else {
      return { ...proj, funded: false };
    }
  });

  const totalNeeds = candidateProjects.reduce((sum, p) => sum + p.cost, 0);
  const fundingGap = Math.max(0, totalNeeds - allocatedBudget);

  // 40. Diminishing Returns data representation
  const returnsData = [
    { spend: '₹5k (Lube)', reliability: 15 },
    { spend: '₹12k (Seal)', reliability: 45 },
    { spend: '₹18k (Rewind)', reliability: 80 },
    { spend: '₹35k (Premium)', reliability: 85 },
    { spend: '₹50k (Overhaul)', reliability: 87 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* HEADER */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Money & Budget Intelligence Engine</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Calculates the maximum social yield per rupee spent, models diminishing return curves, and targets convergence funding pools</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Allocator Sandbox & Rank Engine */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 38. Budget Allocation Simulator */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>38. Budget Allocation Simulator</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 'bold' }}>₹{allocatedBudget.toLocaleString('en-IN')} Limit</span>
            </h4>
            
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Adjust Available Panchayat Funding:</span>
                <span>₹10,000 to ₹3,00,000</span>
              </label>
              <input 
                type="range" 
                min="10000" 
                max="300000" 
                step="5000"
                value={allocatedBudget}
                onChange={(e) => setAllocatedBudget(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            {/* 37. Impact-per-Rupee Ranked list */}
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                37. Impact-per-Rupee Priority Rank List (Auto-Calculated Yield)
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                {fundedProjects.map((proj, idx) => (
                  <div key={proj.id} style={{ 
                    padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)',
                    background: proj.funded ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.01)',
                    borderLeft: proj.funded ? '4px solid var(--status-low)' : '4px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#fff' }}>
                        {idx + 1}. {proj.name}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span>Cost: ₹{proj.cost.toLocaleString('en-IN')}</span>
                        <span>Benefit Pop: {proj.pop}</span>
                        <span>Index: <b style={{ color: 'var(--accent-secondary)' }}>{proj.impactIndex.toFixed(1)}</b></span>
                      </div>
                    </div>
                    <div>
                      <span style={{ 
                        background: proj.funded ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                        color: proj.funded ? 'var(--status-low)' : 'var(--text-muted)',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 
                      }}>
                        {proj.funded ? 'FUNDED' : 'DEFERRED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gram Panchayat Digital Treasury Payout Ledger */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
              <PiggyBank size={18} />
              <span>Panchayat Digital Treasury Ledger (Real-Time Payouts)</span>
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Official immutable ledger recording disbursements from the Gram Panchayat PHE-Treasury wallet to dispatched technicians.
            </p>

            <div style={{ overflowX: 'auto' }}>
              {loadingLedger ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading treasury records...</p>
              ) : ledger.length === 0 ? (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '6px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  No payout disbursements recorded in this budget cycle yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '8px' }}>TXN ID</th>
                      <th style={{ padding: '8px' }}>Asset / Issue Case</th>
                      <th style={{ padding: '8px' }}>Technician</th>
                      <th style={{ padding: '8px' }}>Cost Details</th>
                      <th style={{ padding: '8px' }}>Disbursed</th>
                      <th style={{ padding: '8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((txn, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '8px', fontFamily: 'monospace', color: '#10b981' }}>{txn.payout_tx_id}</td>
                        <td style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>{txn.incident_title}</td>
                        <td style={{ padding: '8px' }}>{txn.technician_name}</td>
                        <td style={{ padding: '8px', color: txn.cost_increased ? 'var(--status-medium)' : 'var(--text-secondary)' }}>
                          {txn.cost_increased ? 'Markup Revise' : 'Fixed Base'}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: '#fff' }}>₹{txn.cost.toLocaleString()}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                            PAID ✔
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Calculations & Opportunities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 39 & 40. Marginal Impact & Diminishing Returns */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>40. Diminishing Returns Detector</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Identifies the point where additional repair investment ceases to yield linear reliability increases.
            </p>

            <div style={{ height: '110px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={returnsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="spend" stroke="var(--text-muted)" fontSize={9} />
                  <YAxis stroke="var(--text-muted)" fontSize={9} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} />
                  <Bar dataKey="reliability" name="Reliability Gain (%)" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.15)', padding: '10px', borderRadius: '6px', fontSize: '0.7rem' }}>
              💡 <b>39. Marginal Impact Calculator:</b> The next <b>₹10,000</b> creates the greatest additional benefit if spent desilting the Market Sewer (+480 citizens restored), compared to premium pump seals (+2% gains).
            </div>
          </div>

          {/* 41 & 42. Prevention Value & Funding Gaps */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>41. Prevention Value vs Funding Gap</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.15)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--status-low)' }}>🛡️ PREVENTION VALUE</span>
                <p style={{ fontWeight: 'bold', fontSize: '1rem', margin: '4px 0', color: '#fff' }}>₹40,000 Saved</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Investing ₹5,000 in early pump maintenance avoids ₹45,000 in future parts/water tanker costs.</p>
              </div>
              
              <div style={{ background: 'rgba(244,63,94,0.03)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--status-critical)' }}>📊 FUNDING GAP</span>
                <p style={{ fontWeight: 'bold', fontSize: '1rem', margin: '4px 0', color: '#fff' }}>₹{fundingGap.toLocaleString('en-IN')}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Total infrastructure needs equal ₹{totalNeeds.toLocaleString('en-IN')} vs allocated budget limit.</p>
              </div>
            </div>
          </div>

          {/* 43. Convergence Opportunity Engine */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpRight size={16} color="var(--accent-secondary)" />
              <span>43. Convergence Funding Opportunities</span>
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Bridges separate ministerial programs (e.g. Swachh Bharat) to co-finance local development needs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                <span>Toilet block rehab: Co-funded by <b>Swachh Bharat</b></span>
                <span style={{ color: 'var(--status-low)', fontWeight: 600 }}>Save ₹51,000 core</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                <span>School Rainwater: Co-funded by <b>NREGS Labour</b></span>
                <span style={{ color: 'var(--status-low)', fontWeight: 600 }}>Save ₹14,000 core</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
