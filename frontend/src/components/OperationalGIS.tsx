import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MapContainer, TileLayer, CircleMarker, Popup, Polygon, Polyline, useMapEvents 
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Layers, MapPin, AlertTriangle, CheckCircle2, Shield, Wrench, 
  RefreshCw, Filter, Eye, Navigation, Info, List, Globe, ExternalLink 
} from 'lucide-react';
import * as api from '../api';
import type { UserRole } from '../types';

interface OperationalGISProps {
  currentRole: UserRole;
  onNavigateTab?: (tab: string, entityId?: number) => void;
  showToast?: (message: string, type?: 'info' | 'success' | 'error') => void;
}

interface GisFeatureCollection {
  type: string;
  bbox: number[];
  assets: any[];
  incidents: any[];
  workers: any[];
}

// Bounding Box Map Event Listener
function MapBoundsListener({ onBoundsChange }: { onBoundsChange: (bounds: any) => void }) {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds());
    },
    zoomend: () => {
      onBoundsChange(map.getBounds());
    }
  });

  useEffect(() => {
    onBoundsChange(map.getBounds());
  }, [map, onBoundsChange]);

  return null;
}

export default function OperationalGIS({ 
  currentRole, 
  onNavigateTab,
  showToast 
}: OperationalGISProps) {
  const [activeLayer, setActiveLayer] = useState<'all' | 'water' | 'roads' | 'electricity' | 'sanitation' | 'workers'>('all');
  const [features, setFeatures] = useState<GisFeatureCollection>({
    type: 'FeatureCollection',
    bbox: [],
    assets: [],
    incidents: [],
    workers: []
  });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'accessible_table'>('map');
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [unlocatedIncidents, setUnlocatedIncidents] = useState<any[]>([]);
  const [showUnlocatedDrawer, setShowUnlocatedDrawer] = useState(false);
  const debounceTimer = useRef<any>(null);

  // OpenStreetMap / Gov tile provider URL
  const tileUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAP_TILE_URL) 
    ? import.meta.env.VITE_MAP_TILE_URL 
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const fetchFeaturesForBounds = useCallback(async (bounds: any) => {
    if (!bounds) return;
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    setLoading(true);
    try {
      const data = await api.fetchGisFeatures({
        min_lat: southWest.lat,
        min_lng: southWest.lng,
        max_lat: northEast.lat,
        max_lng: northEast.lng,
        layers: activeLayer === 'all' ? 'all' : (activeLayer === 'workers' ? 'workers' : 'assets,incidents')
      });
      if (data) {
        setFeatures(data);
      }
    } catch (err) {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [activeLayer]);

  const handleBoundsChange = useCallback((bounds: any) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchFeaturesForBounds(bounds);
    }, 280);
  }, [fetchFeaturesForBounds]);

  // Load unlocated complaints safely
  useEffect(() => {
    async function loadUnlocated() {
      try {
        const incs = await api.fetchIncidents();
        if (Array.isArray(incs)) {
          setUnlocatedIncidents(incs.filter((i: any) => !i.latitude || !i.longitude || (i.latitude === 0 && i.longitude === 0)));
        }
      } catch (e) {
        // Silent fallback
      }
    }
    loadUnlocated();
  }, []);

  // Filtered Assets based on activeLayer
  const filteredAssets = features.assets.filter(a => {
    if (activeLayer === 'all') return true;
    if (activeLayer === 'water' && (a.type.includes('water') || a.type.includes('pump'))) return true;
    if (activeLayer === 'roads' && a.type.includes('road')) return true;
    if (activeLayer === 'electricity' && a.type.includes('light')) return true;
    if (activeLayer === 'sanitation' && (a.type.includes('drain') || a.type.includes('waste'))) return true;
    return false;
  });

  // Filtered Incidents based on activeLayer
  const filteredIncidents = features.incidents.filter(i => {
    if (activeLayer === 'all') return true;
    if (activeLayer === 'workers') return false;
    return i.category === activeLayer;
  });

  return (
    <div className="operational-gis-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Header & Layer Filter Bar */}
      <div className="card-gov p-4" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🗺️</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--gov-navy)', fontWeight: 700 }}>
              Live Operational GIS Intelligence
            </h3>
            <span className="badge-status badge-verified" style={{ fontSize: '0.7rem' }}>
              Real Viewport Bounding Box
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Viewport spatial query • Real coordinates • Zero synthetic coordinates
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Layer Filter Buttons */}
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '6px', padding: '2px' }}>
            {(['all', 'water', 'roads', 'electricity', 'sanitation', 'workers'] as const).map(l => (
              <button
                key={l}
                onClick={() => setActiveLayer(l)}
                style={{
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: activeLayer === l ? '#ffffff' : 'transparent',
                  color: activeLayer === l ? 'var(--gov-blue)' : 'var(--text-secondary)',
                  boxShadow: activeLayer === l ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  textTransform: 'capitalize'
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'map' ? 'accessible_table' : 'map')}
            className="btn-gov btn-gov-secondary"
            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            aria-label="Toggle accessible table view"
          >
            {viewMode === 'map' ? <List size={14} /> : <Globe size={14} />}
            {viewMode === 'map' ? 'Table View' : 'Map View'}
          </button>

          {/* Unlocated incidents alert drawer trigger */}
          {unlocatedIncidents.length > 0 && (
            <button
              onClick={() => setShowUnlocatedDrawer(!showUnlocatedDrawer)}
              className="btn-gov"
              style={{
                padding: '6px 10px',
                fontSize: '0.75rem',
                background: '#fff7ed',
                borderColor: '#fdba74',
                color: '#c2410c',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <AlertTriangle size={13} />
              {unlocatedIncidents.length} Unlocated Cases
            </button>
          )}
        </div>
      </div>

      {/* Main Map or Accessible Table */}
      {viewMode === 'map' ? (
        <div style={{ position: 'relative', width: '100%', height: '580px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
          {/* Loading Indicator */}
          {loading && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 1000,
              background: 'rgba(255,255,255,0.92)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontWeight: 600,
              color: 'var(--gov-navy)'
            }}>
              <RefreshCw size={13} className="animate-spin" />
              Loading viewport features...
            </div>
          )}

          <MapContainer 
            center={[23.285, 77.452]} 
            zoom={14} 
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • National Informatics Centre'
              url={tileUrl}
            />

            <MapBoundsListener onBoundsChange={handleBoundsChange} />

            {/* Draw Geocoded Assets */}
            {filteredAssets.map(a => {
              let color = '#0284c7'; // operational sky
              if (a.status === 'degraded') color = '#d97706';
              if (a.status === 'broken') color = '#dc2626';

              return (
                <CircleMarker 
                  key={`gis-asset-${a.id}`}
                  center={[a.latitude, a.longitude]}
                  radius={7}
                  pathOptions={{ color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 0.85 }}
                >
                  <Popup>
                    <div style={{ color: 'var(--gov-navy)', fontSize: '0.8rem', minWidth: '160px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px' }}>{a.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Type: {a.type.replace('_', ' ').toUpperCase()}</div>
                      <div style={{ marginTop: '4px' }}>
                        Status: <span style={{ fontWeight: 700, color }}>{a.status.toUpperCase()}</span>
                      </div>
                      {a.utilization > 0 && <div style={{ fontSize: '0.75rem' }}>Utilization: {a.current_utilization || a.utilization}%</div>}
                      {onNavigateTab && (
                        <button
                          onClick={() => onNavigateTab('asset_intel', a.id)}
                          style={{
                            marginTop: '8px',
                            width: '100%',
                            padding: '4px 8px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: 'var(--gov-blue)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          View Asset Telemetry
                        </button>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* Draw Geocoded Active Incidents */}
            {filteredIncidents.map(i => {
              let color = '#ea580c'; // warning orange
              if (i.severity === 'critical') color = '#b91c1c';
              if (i.severity === 'low') color = '#0284c7';

              return (
                <CircleMarker 
                  key={`gis-inc-${i.id}`}
                  center={[i.latitude, i.longitude]}
                  radius={9}
                  pathOptions={{ color: '#000000', weight: 2, fillColor: color, fillOpacity: 0.9 }}
                >
                  <Popup>
                    <div style={{ color: 'var(--gov-navy)', fontSize: '0.8rem', minWidth: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b91c1c', fontWeight: 700, fontSize: '0.85rem' }}>
                        <AlertTriangle size={13} />
                        {i.category.toUpperCase()} ALERT
                      </div>
                      <div style={{ fontWeight: 600, marginTop: '2px' }}>{i.title}</div>
                      <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                        Severity: <strong>{i.severity.toUpperCase()}</strong> | Status: <strong>{i.status}</strong>
                      </div>
                      {onNavigateTab && (
                        <button
                          onClick={() => onNavigateTab('incident_detail', i.id)}
                          style={{
                            marginTop: '8px',
                            width: '100%',
                            padding: '4px 8px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: '#b91c1c',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Open Case Workbench
                        </button>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* Draw Active Technicians */}
            {(activeLayer === 'all' || activeLayer === 'workers') && features.workers.map(t => (
              <CircleMarker 
                key={`gis-tech-${t.id}`}
                center={[t.latitude, t.longitude]}
                radius={8}
                pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#15803d', fillOpacity: 0.95 }}
              >
                <Popup>
                  <div style={{ color: 'var(--gov-navy)', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Wrench size={13} />
                      FIELD TECHNICIAN #{t.id}
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                      Specialty: {t.specialty.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.75rem' }}>
                      Rating: ⭐ {t.rating} / 5.0 (Govt Certified)
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Status Legend Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 1000,
            background: 'rgba(255,255,255,0.96)',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-light)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ fontWeight: 700, color: 'var(--gov-navy)', fontSize: '0.75rem', marginBottom: '2px' }}>
              Spatial Legend
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />
              <span>Operational Asset</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
              <span>Degraded / Maintenance Due</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#b91c1c', display: 'inline-block' }} />
              <span>Active Critical Grievance</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#15803d', display: 'inline-block' }} />
              <span>Dispatched Field Technician</span>
            </div>
          </div>
        </div>
      ) : (
        /* Accessible Table Mode for Screen Readers & Low-Bandwidth */
        <div className="card-gov p-4">
          <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--gov-navy)' }}>
            Spatial Features in Current Viewport ({filteredAssets.length + filteredIncidents.length} items)
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-gov">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name / Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(a => (
                  <tr key={`tab-asset-${a.id}`}>
                    <td><span className="badge-status badge-verified">Asset</span></td>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td>{a.type}</td>
                    <td>{a.status}</td>
                    <td>{a.latitude.toFixed(4)}</td>
                    <td>{a.longitude.toFixed(4)}</td>
                    <td>
                      {onNavigateTab && (
                        <button 
                          className="btn-gov btn-gov-secondary"
                          style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                          onClick={() => onNavigateTab('asset_intel', a.id)}
                        >
                          Telemetry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredIncidents.map(i => (
                  <tr key={`tab-inc-${i.id}`}>
                    <td><span className="badge-status badge-in-progress" style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' }}>Incident</span></td>
                    <td style={{ fontWeight: 600 }}>{i.title}</td>
                    <td>{i.category}</td>
                    <td>{i.severity} ({i.status})</td>
                    <td>{i.latitude.toFixed(4)}</td>
                    <td>{i.longitude.toFixed(4)}</td>
                    <td>
                      {onNavigateTab && (
                        <button 
                          className="btn-gov btn-gov-primary"
                          style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                          onClick={() => onNavigateTab('incident_detail', i.id)}
                        >
                          Analyze
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer for Complaints Without Geocodes */}
      {showUnlocatedDrawer && (
        <div className="card-gov p-4" style={{ borderLeft: '4px solid #ea580c', background: '#fffbeb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h5 style={{ margin: 0, color: '#9a3412', fontWeight: 700, fontSize: '0.9rem' }}>
              Complaints Without GPS Coordinates ({unlocatedIncidents.length})
            </h5>
            <button 
              onClick={() => setShowUnlocatedDrawer(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9a3412', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#7c2d12' }}>
            These records were filed via voice or SMS without device geolocation. Position is never simulated or fabricated.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
            {unlocatedIncidents.slice(0, 10).map((u: any) => (
              <div key={`unloc-${u.id}`} style={{ padding: '6px 10px', background: '#ffffff', borderRadius: '4px', border: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{u.title}</span>
                <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 600 }}>Location Not Available</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
