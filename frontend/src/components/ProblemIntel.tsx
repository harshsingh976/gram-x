import React, { useState } from 'react';
import { 
  GitFork, ShieldAlert, Layers, BookOpen, Clock, 
  HelpCircle, AlertCircle, RefreshCw, Activity, ArrowRight 
} from 'lucide-react';
import type { Incident, Asset } from '../types';

interface ProblemIntelProps {
  incident: any;
  assets: Asset[];
}

export default function ProblemIntel({ incident, assets }: ProblemIntelProps) {
  // If no active incident selected, load default Borewell Pump #17 data
  const title = incident?.title || "Borewell Water Pump #17 Critical Failure";
  const category = incident?.category || "water";
  const priorityScore = incident?.priority_score || 92.5;

  // 22. Problem DNA Barcode Definition
  const problemDna = [
    { key: 'LOC', val: 'WARD-B', label: 'Location Ward B' },
    { key: 'SEAS', val: 'MONSOON', label: 'Monsoon High Humidity' },
    { key: 'ASSET', val: 'PUMP-17', label: 'Submersible Borewell' },
    { key: 'FAIL', val: 'HIST-4X', label: '4 Failures in 12 Months' },
    { key: 'COST', val: 'EST-18K', label: 'Estimated Repair ₹18,000' },
    { key: 'INT', val: 'WINDING', label: 'Motor Winding Focus' },
    { key: 'OUT', val: 'VERIFIED', label: 'SMS Audit Verified' }
  ];

  // 23. Similar problems list
  const historicalSimilarCases = [
    {
      date: 'June 2025',
      asset: 'Borewell Pump #17',
      cause: 'Voltage sag during local irrigation peak burned windings',
      intervention: 'Coil rewinding + copper connection cleaning (Cost: ₹15,400)',
      outcome: 'Restored in 36h. Success rating: 4.8/5'
    },
    {
      date: 'August 2024',
      asset: 'Borewell Pump #12 (Ward D)',
      cause: 'Phase imbalance in distribution transformer burned terminal block',
      intervention: 'Terminal block replacement + phase fuses (Cost: ₹8,900)',
      outcome: 'Restored in 24h. Success rating: 4.5/5'
    }
  ];

  // 26. District Problem Clustering List
  const clusterData = [
    {
      clusterName: 'Grid Phase Imbalance & Sags (42 Complaints)',
      impacted: 'Piparli, Ramnagar, and Gokalpur',
      rootCause: 'Overloaded 11kV distribution lines during pump operation times',
      status: 'Systemic Resolution: Deploying smart voltage protection relays'
    },
    {
      clusterName: 'Monsoon Gravel Subgrade Washouts (28 Complaints)',
      impacted: 'Raisen District Rural Roads Sector C',
      rootCause: 'Lack of lateral retaining drains causing subgrade saturation',
      status: 'Systemic Resolution: Upgrading shoulder masonry specifications'
    },
    {
      clusterName: 'Siltation-Induced Drainage Blockages (30 Complaints)',
      impacted: 'Market centers and highway junctions',
      rootCause: 'Single-chamber silt pits without trash grids overflowing',
      status: 'Systemic Resolution: Replacing with dual-chamber trash grate pits'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* HEADER SECTION */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700 }}>AI Problem Intelligence Core</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Diagnoses underlying failure DNA, models contagion cascades, and groups local complaints into systemic district clusters</p>
      </div>

      {/* TOP ROW: PROBLEM DNA & DEPENDENCIES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: DNA, Knowledge Graph, Causes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 22. Problem DNA Barcode */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>22. Problem DNA Signature</h4>
            
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
              {problemDna.map((item, idx) => (
                <div key={idx} style={{ 
                  background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '6px', padding: '10px 14px', flex: 1, minWidth: '95px', textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--accent-secondary)', fontWeight: 800, letterSpacing: '0.05em' }}>{item.key}</span>
                  <p style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: '4px 0', color: '#fff' }}>{item.val}</p>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 21. Root-Cause Knowledge Graph */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>21. Root-Cause Knowledge Graph Pipeline</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Visual trace detailing how the root cause propagates through assets and services to impact the citizen population.
            </p>

            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              background: 'rgba(0,0,0,0.15)', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--border-color)',
              position: 'relative', overflowX: 'auto'
            }}>
              {/* Node 1: Cause */}
              <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid var(--status-critical)', borderRadius: '6px', padding: '8px 12px', minWidth: '100px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.55rem', color: 'var(--status-critical)', fontWeight: 700 }}>CAUSE</span>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>Voltage Sags</p>
              </div>

              <ArrowRight size={16} color="var(--text-muted)" />

              {/* Node 2: Asset */}
              <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid var(--status-medium)', borderRadius: '6px', padding: '8px 12px', minWidth: '100px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.55rem', color: 'var(--status-medium)', fontWeight: 700 }}>ASSET</span>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>Pump #17 Motor</p>
              </div>

              <ArrowRight size={16} color="var(--text-muted)" />

              {/* Node 3: Service */}
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid var(--accent-primary)', borderRadius: '6px', padding: '8px 12px', minWidth: '100px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.55rem', color: 'var(--accent-primary)', fontWeight: 700 }}>SERVICE</span>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>Water Supply</p>
              </div>

              <ArrowRight size={16} color="var(--text-muted)" />

              {/* Node 4: Population */}
              <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid var(--accent-secondary)', borderRadius: '6px', padding: '8px 12px', minWidth: '100px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.55rem', color: 'var(--accent-secondary)', fontWeight: 700 }}>POPULATION</span>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>740 Residents</p>
              </div>

              <ArrowRight size={16} color="var(--text-muted)" />

              {/* Node 5: Impact */}
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid var(--status-low)', borderRadius: '6px', padding: '8px 12px', minWidth: '100px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.55rem', color: 'var(--status-low)', fontWeight: 700 }}>IMPACT</span>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>Water Scarcity</p>
              </div>
            </div>
          </div>

          {/* 20. Cause-Evidence-Consequence analysis */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>20. Root-Cause Diagnosis Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '0.75rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px' }}>
                <p style={{ color: 'var(--status-critical)', fontWeight: 700, fontSize: '0.65rem' }}>PROBABLE CAUSES</p>
                <ul style={{ paddingLeft: '14px', marginTop: '6px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Armature coil insulation burnout</li>
                  <li>Voltage fluctuations in rural line</li>
                  <li>Silt clog in inlet filter</li>
                </ul>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px' }}>
                <p style={{ color: 'var(--accent-secondary)', fontWeight: 700, fontSize: '0.65rem' }}>EVIDENCE CHAIN</p>
                <ul style={{ paddingLeft: '14px', marginTop: '6px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>IoT Sensor: 0 L/min flow</li>
                  <li>Citizen Voice note verified</li>
                  <li>MTBF history flags 4 sags</li>
                </ul>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px' }}>
                <p style={{ color: 'var(--status-medium)', fontWeight: 700, fontSize: '0.65rem' }}>IMMEDIATE CONSEQUENCES</p>
                <ul style={{ paddingLeft: '14px', marginTop: '6px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>740 Residents: No drinking water</li>
                  <li>Daily water fetching burden</li>
                  <li>Shallow well disease risk</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Similarity, Trees, Cascade, and Clustering */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 23. Have We Seen This Before? */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--accent-secondary)" />
              <span>23. "Have We Seen This Before?" Matches</span>
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Historical case scanner matching active variables to recommend verified solutions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem' }}>
              {historicalSimilarCases.map((c, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                    <span>{c.asset}</span>
                    <span style={{ color: 'var(--accent-secondary)' }}>{c.date}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}><b>Cause:</b> {c.cause}</p>
                  <p style={{ color: 'var(--status-low)', fontSize: '0.7rem', marginTop: '2px' }}><b>Fix:</b> {c.intervention}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '2px' }}>{c.outcome}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 24 & 25. Dependency Tree & Contagion Engine */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GitFork size={16} color="var(--status-medium)" />
              <span>Problem Contagion & Dependency Tree</span>
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Models how a single failure cascades into secondary service collapses.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--status-critical)' }}>Primary: Submersible Pump Coil Burnout (100% Active)</div>
              
              <div style={{ paddingLeft: '20px', borderLeft: '2px dashed var(--border-color)', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--status-medium)' }}>↳ Secondary: Ward B Water Scarcity (90% contagion risk)</span>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Impact: Citizens fetching shallow untreated water</p>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--status-medium)' }}>↳ Secondary: Primary School Meal Suspended (65% risk)</span>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Impact: Kitchen closed due to zero running wash water</p>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>↳ Tertiary: Outbreak of Waterborne Gastro-Illnesses (24% risk)</span>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Cascade Trigger: Residents drink shallow wells over 4 days</p>
                </div>
              </div>
            </div>
          </div>

          {/* 26. District Problem Clustering */}
          <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="var(--accent-primary)" />
              <span>26. District Systemic Problem Clustering</span>
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Aggregates 100+ isolated complaints to highlight underlying structural faults.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
              {clusterData.map((cluster, idx) => (
                <div key={idx} style={{ padding: '10px', background: 'rgba(99,102,241,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <h5 style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{cluster.clusterName}</h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '2px' }}><b>Coverage:</b> {cluster.impacted}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}><b>Systemic Root:</b> {cluster.rootCause}</p>
                  <div style={{ marginTop: '4px', color: 'var(--status-low)', fontSize: '0.65rem', fontWeight: 600 }}>
                    🛠 {cluster.status}
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
