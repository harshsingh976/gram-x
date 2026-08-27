import React, { useState } from 'react';
import { 
  Briefcase, Landmark, RefreshCw, Star, MapPin, 
  Layers, HelpCircle, CheckCircle, ArrowRight 
} from 'lucide-react';
import type { Asset, ReuseRecommendation } from '../types';
import * as api from '../api';

interface ResourceIntelProps {
  assets: Asset[];
  villageId: number;
  recommendations: ReuseRecommendation[];
  onDecisionSubmitted: () => void;
}

export default function ResourceIntel({ assets, villageId, recommendations, onDecisionSubmitted }: ResourceIntelProps) {
  const [decisions, setDecisions] = useState<Record<number, string>>({});

  // 45. Underutilized Asset Detector: filter assets with utilization < 30%
  // Or display mock underutilized assets
  const underutilizedAssets = [
    { name: 'Old Panchayat Hall Annex', type: 'Building', util: '22%', capacity: '120 persons', action: 'Convert to digital E-Library' },
    { name: 'Primary School East Classroom', type: 'Building', util: '15%', capacity: '40 pupils', action: 'Repurpose as midday meal storage' },
    { name: 'Secondary Water Harvest Cistern', type: 'Water Storage', util: '25%', capacity: '8,000 Liters', action: 'Connect as emergency bypass manifold' }
  ];

  // 46. Community Resource Exchange Registry
  const crossVillageExchange = [
    { item: 'Submersible Pump Lifting Hoist', owner: 'Ramnagar Panchayat', rental: '₹500 / Day', status: 'Available', saving: 'Saves ₹22,000 purchase' },
    { item: 'Tractor Backhoe Digger', owner: 'Piparli Core', rental: 'Shared Cost (NREGS)', status: 'In use at Ramnagar', saving: 'Saves ₹4,500 contractor rate' }
  ];

  // 48. Resource Optimization Dispatcher
  const dispatchedWorker = {
    name: 'Suresh Kumar',
    specialty: 'Plumbing & Submersible Winding',
    distance: '1.2 km away',
    rating: 4.8,
    score: 94.2,
    breakdown: 'Skill: 95% | Proximity: 92% | Historic completion rate: 96%'
  };

  // 49. Minimum Viable Intervention Comparison
  const mviComparison = {
    problem: 'Siltation-blocked culvert drain causing monsoon overflow',
    minimumViable: {
      action: 'Debris desilting + custom steel wire catch-grate installation',
      cost: '₹3,500',
      duration: '4 Months risk reduction',
      confidence: '80%'
    },
    fullScope: {
      action: 'Total excavation & segment replacement with larger concrete pipes',
      cost: '₹45,000',
      duration: '5 Years permanent cure',
      confidence: '99%'
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* HEADER */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>Resource Intelligence Hub</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Evaluates underused infrastructure to prioritize reuse before building, and optimizes technician dispatch factors</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Underutilization and Reuse */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 45. Underutilized Asset Detector & 44. Reuse-Before-Build Engine */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Landmark size={18} color="var(--accent-secondary)" />
              <span>45. Underutilized Assets & Reuse-Before-Build Advisor</span>
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Flags assets with utility profiles below 30% capacity and suggests repurposing options to reduce capital expenditure.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
              {recommendations.map((rec) => {
                const decided = decisions[rec.id];
                return (
                  <div key={rec.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                      <span>{rec.asset_name}</span>
                      <span style={{ color: 'var(--status-medium)' }}>Utilization: {rec.current_utilization}%</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}><b>Alternative construction cost:</b> ₹{rec.alternative_new_construction_cost.toLocaleString()}</p>
                    
                    {/* Reuse Engine Suggestion */}
                    <div style={{ marginTop: '6px', background: 'rgba(14,165,233,0.05)', border: '1px dashed var(--accent-secondary)', padding: '8px 10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ color: 'var(--accent-secondary)', fontSize: '0.7rem', fontWeight: 700 }}>💡 REUSE RECOMMENDATION: {rec.estimated_benefit_description}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--status-low)', fontWeight: 600 }}>
                        <span>Renovation Cost: ₹{rec.estimated_renovation_cost.toLocaleString()}</span>
                        <span>Estimated Savings: ₹{rec.savings.toLocaleString()} ✔</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px', justifyContent: 'flex-end' }}>
                      {decided ? (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold', 
                          color: decided === 'approved' ? 'var(--status-low)' : 'var(--status-critical)',
                          background: decided === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                          padding: '4px 10px',
                          borderRadius: '4px'
                        }}>
                          Decision: {decided.toUpperCase()}
                        </span>
                      ) : (
                        <>
                          <button 
                            onClick={async () => {
                              try {
                                await api.submitReuseDecision(rec.id, rec.asset_name, 'rejected');
                                setDecisions(prev => ({ ...prev, [rec.id]: 'rejected' }));
                                onDecisionSubmitted();
                              } catch (e) {
                                alert("Failed to save decision.");
                              }
                            }}
                            className="secondary" 
                            style={{ padding: '4px 10px', fontSize: '0.7rem', borderColor: 'var(--status-critical)', color: 'var(--status-critical)' }}
                          >
                            Reject
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                await api.submitReuseDecision(rec.id, rec.asset_name, 'approved');
                                setDecisions(prev => ({ ...prev, [rec.id]: 'approved' }));
                                onDecisionSubmitted();
                              } catch (e) {
                                alert("Failed to save decision.");
                              }
                            }}
                            className="accent" 
                            style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                          >
                            Approve Repurpose
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 46. Community Resource Exchange & 47. Asset Swapping */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>46. Cross-Village Resource Exchange Registry</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
              {crossVillageExchange.map((item, idx) => (
                <div key={idx} style={{ padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h5 style={{ fontWeight: 'bold', color: '#fff' }}>{item.item}</h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '2px' }}>Panchayat Owner: {item.owner} | Rate: {item.rental}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--status-low)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                      {item.saving}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Swapping */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', background: 'rgba(99,102,241,0.02)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>🔄 47. ASSET SWAPPING SYSTEM RECOMMENDATION</span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '4px' }}>
                Suggest shifting community backup pump motor from Ward E (only 5 households connected) to Ward B (740 residents in active water emergency).
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Dispatch & MVIs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 48. Resource Optimization Dispatcher */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>48. Resource Dispatch Optimization Score</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Optimizes skill matrix + radial distance + current availability + labor rate.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold' }}>
                <span style={{ color: '#fff' }}>{dispatchedWorker.name}</span>
                <span style={{ color: 'var(--status-low)' }}>Match Score: {dispatchedWorker.score}%</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '6px' }}>
                <span>Skill: {dispatchedWorker.specialty}</span>
                <span>Proximity: {dispatchedWorker.distance}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                🧮 <b>Calculation:</b> {dispatchedWorker.breakdown}
              </div>
            </div>
          </div>

          {/* 49. Minimum Viable Intervention (MVI) */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>49. Minimum Viable Intervention (MVI)</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Finds the smallest, fastest, most affordable intervention that meaningfully reduces risk.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem', marginTop: '4px' }}>
              <p style={{ fontWeight: 600, color: 'var(--status-medium)' }}>Problem: {mviComparison.problem}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.2)', padding: '10px', borderRadius: '6px' }}>
                  <b style={{ color: 'var(--status-low)' }}>MINIMUM VIABLE FIX</b>
                  <p style={{ color: '#fff', margin: '4px 0', fontSize: '0.7rem' }}>{mviComparison.minimumViable.action}</p>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    Cost: <b>{mviComparison.minimumViable.cost}</b><br />
                    Extension: <b>{mviComparison.minimumViable.duration}</b>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px' }}>
                  <b>FULL SCOPE REPLACEMENT</b>
                  <p style={{ color: '#fff', margin: '4px 0', fontSize: '0.7rem' }}>{mviComparison.fullScope.action}</p>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    Cost: <b>{mviComparison.fullScope.cost}</b><br />
                    Extension: <b>{mviComparison.fullScope.duration}</b>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
