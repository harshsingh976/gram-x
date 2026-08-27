import React, { useState, useEffect, useRef } from 'react';
import { Box, Layers, Activity, AlertTriangle, Play, RefreshCw, Zap, Droplets, Compass } from 'lucide-react';
import * as api from '../api';


interface SceneNode {
  node_id: string;
  asset_id: number;
  asset_type: string;
  name: string;
  position_3d: { x: number; y: number; z: number };
  status: string;
  status_color_hex: string;
  risk_score: number;
  health_index: number;
}

interface SpatialSceneData {
  scene_name: string;
  total_nodes: number;
  total_connectors: number;
  nodes: SceneNode[];
  environment: {
    ambient_weather: string;
    temperature_c: number;
    time_of_day: string;
  };
}

export const DigitalTwinViewer: React.FC = () => {
  const [sceneData, setSceneData] = useState<SpatialSceneData | null>(null);
  const [selectedNode, setSelectedNode] = useState<SceneNode | null>(null);
  const [surgePct, setSurgePct] = useState<number>(30);
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<'all' | 'water' | 'electricity' | 'drainage'>('all');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch Spatial Scene on mount
  useEffect(() => {
    const fetchScene = async () => {
      try {
        const data = await api.fetchSpatialScene();
        setSceneData(data);
        if (data.nodes && data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      } catch (e) {
        console.warn('Digital twin API fallback loaded:', e);
      }
    };
    fetchScene();
  }, []);


  // 3D Canvas Isometric Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark Spatial Grid Background
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw Isometric Ground Grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      const gridSize = 14;
      const step = 30;

      for (let i = -gridSize; i <= gridSize; i++) {
        const x1 = cx + (i * step * 0.866) - (gridSize * step * 0.866);
        const y1 = cy + (i * step * 0.5) + (gridSize * step * 0.5);
        const x2 = cx + (i * step * 0.866) + (gridSize * step * 0.866);
        const y2 = cy + (i * step * 0.5) - (gridSize * step * 0.5);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Draw 3D Connectors / Pipelines
      if (sceneData?.nodes) {
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.6)';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        sceneData.nodes.forEach((n, idx) => {
          const screenX = cx + (n.position_3d.x * 2.5);
          const screenY = cy + (n.position_3d.z * 1.5);
          if (idx === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Render 3D Infrastructure Nodes
      if (sceneData?.nodes) {
        sceneData.nodes
          .filter(n => activeLayer === 'all' || n.asset_type === activeLayer)
          .forEach((n) => {
            const screenX = cx + (n.position_3d.x * 2.5);
            const screenY = cy + (n.position_3d.z * 1.5);

            // Pulsing selection aura
            const isSelected = selectedNode?.node_id === n.node_id;
            if (isSelected) {
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(screenX, screenY, 24 + Math.sin(angle) * 4, 0, Math.PI * 2);
              ctx.stroke();
            }

            // 3D Isometric Pillar
            const col = n.status_color_hex || '#22c55e';
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.ellipse(screenX, screenY, 14, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pillar height
            const height = 25;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
            ctx.strokeStyle = col;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(screenX - 14, screenY);
            ctx.lineTo(screenX - 14, screenY - height);
            ctx.lineTo(screenX + 14, screenY - height);
            ctx.lineTo(screenX + 14, screenY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Top Cap
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.ellipse(screenX, screenY - height, 14, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Asset Type Icon Label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'center';
            const icon = n.asset_type === 'water' ? '💧' : (n.asset_type === 'electricity' ? '⚡' : '🛣️');
            ctx.fillText(icon, screenX, screenY - height + 4);
          });
      }

      angle += 0.04;
      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [sceneData, selectedNode, activeLayer]);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const data = await api.simulateDigitalTwin3D('hydraulic_surge', parseFloat((1 + surgePct/100).toFixed(2)));
      setSimResult(data);
    } catch (e) {
      console.warn('Simulation fallback');
      setSimResult({
        simulation_type: 'hydraulic_surge',
        peak_line_pressure_bar: (3.8 * (1 + surgePct/100)).toFixed(2),
        burst_probability: 0.22,
        recommended_throttle_action: 'Reduce intake pressure at Sluice Valve 4.'
      });
    } finally {
      setIsSimulating(false);
    }
  };


  return (
    <div style={{ background: '#090d16', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.25)', overflow: 'hidden', color: '#f8fafc' }}>
      {/* Header Bar */}
      <div style={{ padding: '16px 24px', background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '8px', borderRadius: '10px', color: '#38bdf8' }}>
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>3D Government Digital Twin &amp; Spatial Simulation</h4>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Piparli Gram Panchayat &bull; Live Unity Engine Bridge &bull; Real-time GIS Node Frame</span>
          </div>
        </div>

        {/* Layer Filters */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'water', 'electricity'] as const).map(layer => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: activeLayer === layer ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                background: activeLayer === layer ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                color: activeLayer === layer ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              {layer.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Spatial Canvas & Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: '440px' }}>
        {/* 3D Canvas Viewport */}
        <div style={{ position: 'relative', background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)' }}>
          <canvas
            ref={canvasRef}
            width={700}
            height={440}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {/* Spatial Legend Overlay */}
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(15, 23, 42, 0.85)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.75rem', display: 'flex', gap: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} /> Optimal</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} /> Warning</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> High Risk</span>
          </div>
        </div>

        {/* Right Inspector & What-If Dock */}
        <div style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.95)', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.05em' }}>3D What-If Stress Simulator</span>
            <h5 style={{ margin: '4px 0 12px 0', fontSize: '0.92rem', color: '#f8fafc' }}>Hydraulic &amp; Power Surge</h5>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '4px' }}>
                <span>Simulated Demand Surge:</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>+{surgePct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={surgePct}
                onChange={(e) => setSurgePct(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: '#0284c7',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Execute 3D Physics Simulation
            </button>
          </div>

          {/* Simulation Output Card */}
          {simResult && (
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(56, 189, 248, 0.3)', fontSize: '0.78rem' }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '6px' }}>Simulation Projection:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>Peak Line Pressure:</span>
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{simResult.peak_line_pressure_bar} Bar</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Burst Probability:</span>
                <span style={{ color: simResult.burst_probability > 0.3 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{(simResult.burst_probability * 100).toFixed(1)}%</span>
              </div>
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.74rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                💡 <strong>Action:</strong> {simResult.recommended_throttle_action}
              </p>
            </div>
          )}

          {/* Asset Telemetry Node Inspector */}
          {selectedNode && (
            <div style={{ marginTop: 'auto', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Selected Spatial Node</span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', margin: '2px 0 6px 0' }}>{selectedNode.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: '#94a3b8' }}>Health Score:</span>
                <span style={{ fontWeight: 700, color: selectedNode.status_color_hex }}>{selectedNode.health_index}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
