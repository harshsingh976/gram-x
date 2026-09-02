import React, { useState, useEffect, Suspense } from 'react';
import { 
  Activity, Map as MapIcon, ShieldAlert, Cpu, Layers, Wrench, 
  UserCheck, Users, Radio, HelpCircle, TrendingUp,
  CheckCircle, AlertTriangle, Play, RefreshCw, 
  ChevronRight, Check, Eye, PhoneCall, Volume2, Upload, AlertCircle,
  BarChart, Compass, Scale, ShieldCheck, Database, Landmark, Home, Heart, Activity as ActivityIcon
} from 'lucide-react';
import { 
  MapContainer, TileLayer, CircleMarker, Popup, Polygon, Polyline 
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as api from './api';
import type { 
  Village, VillageMetrics, Asset, AssetDetail, Incident, 
  IncidentDetail, Project, Technician, Task, WhatIfResponse, 
  ReuseRecommendation, DemoStatus, UserRole 
} from './types';

// Dynamic Lazy Component Imports for optimized bundle delivery
const CentralGovernance = React.lazy(() => import('./components/CentralGovernance'));
const GroundReality = React.lazy(() => import('./components/GroundReality'));
const ProblemIntel = React.lazy(() => import('./components/ProblemIntel'));
const PredictionFuture = React.lazy(() => import('./components/PredictionFuture'));
const MoneyBudget = React.lazy(() => import('./components/MoneyBudget'));
const ResourceIntel = React.lazy(() => import('./components/ResourceIntel'));
const AssetIntel = React.lazy(() => import('./components/AssetIntel'));
const ProjectIntel = React.lazy(() => import('./components/ProjectIntel'));
const EquityIntel = React.lazy(() => import('./components/EquityIntel'));
const AuditAccountability = React.lazy(() => import('./components/AuditAccountability'));
const CrisisIntelligence = React.lazy(() => import('./components/CrisisIntelligence'));
const DataIntelligence = React.lazy(() => import('./components/DataIntelligence'));
const ResponsibleAI = React.lazy(() => import('./components/ResponsibleAI'));
const ESGOverview = React.lazy(() => import('./components/common/ESGOverview'));

import CitizenExperience from './components/CitizenExperience';
import CitizenPortal from './components/CitizenPortal';
import TechnicianPortal from './components/TechnicianPortal';
import AdminPortal from './components/AdminPortal';
import CollectorPortal from './components/CollectorPortal';
import GovAuthPortal from './components/GovAuthPortal';
import OperationalGIS from './components/OperationalGIS';
import PortalFirstPage from './components/PortalFirstPage';
import SplashScreen from './components/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';
import { NotificationCenter } from './components/NotificationCenter';
import { AnnouncementTicker, GovernmentInfoBar, Breadcrumb, PageTitle, SidebarQuickLinks, GovFooter } from './components/GovUI';
import { getInitials, getRoleAvatarGradient } from './imageMap';
import { useLanguage } from './i18n';
import LiveClock from './components/LiveClock';
import NetworkStatus from './components/NetworkStatus';
import LanguageSelector from './components/LanguageSelector';
import { CardSkeleton } from './components/common/UIComponents';

import CitizenLanding from './components/landings/CitizenLanding';
import WorkerLanding from './components/landings/WorkerLanding';
import AdminLanding from './components/landings/AdminLanding';
import CollectorLanding from './components/landings/CollectorLanding';
import AccessDenied from './components/AccessDenied';
import LoadingState from './components/LoadingState';

// Simple Router Helper
type Tab = 'command_center' | 'village_dashboard' | 'gis_map' | 'incidents' | 'incident_detail' | 'asset_intel' | 'project_intel' | 'what_if' | 'resource_opt' | 'worker_portal' | 'citizen_portal' | 'cross_analytics' | 'ground_reality' | 'prediction_future' | 'money_budget' | 'equity_intel' | 'audit_accountability' | 'crisis_intelligence' | 'data_intelligence' | 'responsible_ai' | 'new_citizen_portal' | 'new_worker_portal' | 'new_admin_portal' | 'new_collector_portal' | 'blackrock_login' | 'blackrock_auth' | 'portal_first_page' | 'profile' | 'esg_overview';

export type AuthStatus = 'AUTH_LOADING' | 'AUTHENTICATED' | 'AUTH_UNAUTHENTICATED';

// Detect role requested by hostname subdomain if applicable
export const getSubdomainRole = (): UserRole | null => {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname.toLowerCase();
  if (host.startsWith('citizen.')) return 'citizen';
  if (host.startsWith('worker.')) return 'worker';
  if (host.startsWith('admin.')) return 'admin';
  if (host.startsWith('collector.') || host.startsWith('dm.')) return 'district';
  return null;
};

const getInitialTabForRole = (userRole: UserRole): Tab => {
  const sub = getSubdomainRole();
  const effRole = sub || userRole;
  if (effRole === 'citizen') return 'citizen_portal';
  if (effRole === 'worker') return 'worker_portal';
  if (effRole === 'district') return 'command_center';
  return 'village_dashboard';
};



export default function App() {
  // State variables
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [role, setRole] = useState<UserRole>((localStorage.getItem('role') as UserRole) || 'admin');
  const [username, setUsername] = useState<string>(localStorage.getItem('username') || '');
  const [fullName, setFullName] = useState<string>(localStorage.getItem('fullName') || '');
  const [showSplash, setShowSplash] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() => {
    return localStorage.getItem('token') ? 'AUTH_LOADING' : 'AUTH_UNAUTHENTICATED';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const savedRole = localStorage.getItem('role') as UserRole;
    return getInitialTabForRole(savedRole || 'admin');
  });

  // Synchronize dynamic role theme on root document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const activeTheme = role === 'district' ? 'collector' : role || 'admin';
      document.documentElement.setAttribute('data-theme', activeTheme);
    }
  }, [role]);

  // Global Command Palette Shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Multi-Language Localization
  const { language, setLanguage, t } = useLanguage();
  
  // Selected IDs
  const [selectedVillageId, setSelectedVillageId] = useState<number>(1); // Piparli
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Backend Data State
  const [villages, setVillages] = useState<Village[]>([]);
  const [activeMetrics, setActiveMetrics] = useState<VillageMetrics | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  
  // Details State
  const [incidentDetail, setIncidentDetail] = useState<IncidentDetail | null>(null);
  const [assetDetail, setAssetDetail] = useState<AssetDetail | null>(null);
  const [whatIfData, setWhatIfData] = useState<WhatIfResponse | null>(null);
  const [delayMonths, setDelayMonths] = useState<number>(3);
  const [reuseRecs, setReuseRecs] = useState<ReuseRecommendation[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<Technician[]>([]);

  // Citizen Portal Form State
  const [citizenTitle, setCitizenTitle] = useState('');
  const [citizenDesc, setCitizenDesc] = useState('');
  const [citizenCat, setCitizenCat] = useState('water');
  const [voiceSimText, setVoiceSimText] = useState('वार्ड बी में हैंडपंप पिछले पांच दिनों से काम नहीं कर रहा है और पानी गंदा आ रहा है।');
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedPhotoBase64, setUploadedPhotoBase64] = useState<string | null>(null);

  // Worker Portal State
  const [workerTasks, setWorkerTasks] = useState<Task[]>([]);
  const [workerChecklist, setWorkerChecklist] = useState<boolean[]>([false, false, false, false]);
  const [additionalCost, setAdditionalCost] = useState<number>(3000);
  const [workDone, setWorkDone] = useState<string>('Rewound 3-phase submersible copper coils and replaced gate valve seal');
  const [whatWasWrong, setWhatWasWrong] = useState<string>('Submersible motor winding completely burnt due to prolonged grid voltage fluctuations');
  const [productEffect, setProductEffect] = useState<string>('Pump lifetime extended by 4 years, stable current draw restored, and water flow rate back to normal');
  const [showPriceIncreaseForm, setShowPriceIncreaseForm] = useState<boolean>(false);

  // Demo Simulation State
  const [demoState, setDemoState] = useState<DemoStatus | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showDeveloperConsole, setShowDeveloperConsole] = useState<boolean>(false);
  const [appMode, setAppMode] = useState<string>('production');
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [villageLoading, setVillageLoading] = useState(false);
  const [villageError, setVillageError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Session initialization / restoration on application startup (Runs ONCE on mount)
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setAuthStatus('AUTH_UNAUTHENTICATED');
      return;
    }

    setAuthStatus('AUTH_LOADING');
    api.getMe()
      .then((me) => {
        const uRole = me.role as UserRole;
        setToken(savedToken);
        setRole(uRole);
        setUsername(me.username);
        setFullName(me.name);
        localStorage.setItem('role', me.role);
        localStorage.setItem('username', me.username);
        localStorage.setItem('fullName', me.name);
        setActiveTab(getInitialTabForRole(uRole));
        setAuthStatus('AUTHENTICATED');
        loadGlobalData();
        loadDemoStatus();
        if (uRole === 'admin') {
          loadVillageData(selectedVillageId || 1);
        }
      })
      .catch((err) => {
        console.warn("Stored session expired or invalid", err);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('fullName');
        setToken(null);
        setRole('admin');
        setUsername('');
        setFullName('');
        setAuthStatus('AUTH_UNAUTHENTICATED');
      });
  }, []);

  // Load Village metrics when active village changes
  useEffect(() => {
    if (selectedVillageId && authStatus === 'AUTHENTICATED') {
      loadVillageData(selectedVillageId);
    }
  }, [selectedVillageId, demoState?.current_step, authStatus]);

  // Load Incident detail if selected
  useEffect(() => {
    if (selectedIncidentId) {
      api.fetchIncidentDetail(selectedIncidentId).then(setIncidentDetail);
      api.fetchAvailableWorkers(selectedIncidentId).then(setAvailableWorkers);
    }
  }, [selectedIncidentId]);

  // Load Asset detail if selected
  useEffect(() => {
    if (selectedAssetId) {
      api.fetchAssetDetail(selectedAssetId).then(setAssetDetail);
    }
  }, [selectedAssetId]);

  // Load What-if data
  useEffect(() => {
    if (selectedIncidentId) {
      api.runWhatIfSimulation(selectedIncidentId, delayMonths).then(setWhatIfData);
    }
  }, [selectedIncidentId, delayMonths]);

  // Real-Time Background State Synchronization (Every 6s when tab is active)
  useEffect(() => {
    if (authStatus !== 'AUTHENTICATED') return;

    const syncTimer = setInterval(async () => {
      if (document.hidden) return; // Save bandwidth when window/tab is in background

      try {
        const [vIncidents, vTasks, vTechnicians] = await Promise.all([
          api.fetchIncidents().catch(() => null),
          api.fetchTasks().catch(() => null),
          api.fetchAllWorkers().catch(() => null),
        ]);

        if (vIncidents && Array.isArray(vIncidents)) {
          setIncidents(vIncidents);
        }
        if (vTasks && Array.isArray(vTasks)) {
          setAllTasks(vTasks);
        }
        if (vTechnicians && Array.isArray(vTechnicians)) {
          setTechnicians(vTechnicians);
        }

        if (role === 'worker') {
          const myT = await api.fetchMyTasks().catch(() => null);
          if (myT && Array.isArray(myT)) {
            setWorkerTasks(myT);
          }
        }
      } catch (err) {
        // Silent sync failure
      }
    }, 6000);

    return () => clearInterval(syncTimer);
  }, [authStatus, role]);

  const loadGlobalData = async () => {
    setGlobalLoading(true);
    setGlobalError(null);
    try {
      try {
        const cfg = await api.fetchAppConfig();
        setAppMode(cfg.APP_MODE);
        if (cfg.APP_MODE === 'production') {
          setShowDeveloperConsole(false);
        }
      } catch (err) {
        console.warn("Failed to fetch app mode from backend", err);
      }
      const vData = await api.fetchVillages();
      setVillages(vData);
      const aData = await api.fetchAssets();
      setAssets(aData);
      const iData = await api.fetchIncidents();
      setIncidents(iData);
      const pData = await api.fetchProjects();
      setProjects(pData);
      const tData = await api.fetchTasks();
      setAllTasks(tData);

      // Load all field workers for the dashboard
      try {
        const wData = await api.fetchAllWorkers();
        setTechnicians(wData);
      } catch (err) {
        console.warn('Failed to fetch workers list', err);
      }

      const savedRole = localStorage.getItem('role');
      if (savedRole === 'worker' || role === 'worker') {
        try {
          const myT = await api.fetchMyTasks();
          setWorkerTasks(myT);
        } catch (err) {
          console.warn("Failed to fetch worker tasks", err);
        }
      }
      setGlobalLoading(false);
    } catch (e) {
      console.error(e);
      setGlobalError("Failed to connect to the GRAM-X backend server. Please verify the service is running and retry.");
      setGlobalLoading(false);
    }
  };

  const loadVillageData = async (vid: number) => {
    setVillageLoading(true);
    setVillageError(null);
    try {
      const metrics = await api.fetchVillageMetrics(vid);
      setActiveMetrics(metrics);
      
      const vAssets = await api.fetchAssets(vid);
      setAssets(vAssets);
      
      const vIncidents = await api.fetchIncidents(vid);
      setIncidents(vIncidents);

      const vProjects = await api.fetchProjects(vid);
      setProjects(vProjects);

      const rRecs = await api.fetchReuseRecommendations(vid);
      setReuseRecs(rRecs);
      
      const tData = await api.fetchTasks();
      setAllTasks(tData);
      setVillageLoading(false);
    } catch (e) {
      console.error(e);
      setVillageError("Failed to load metrics for the selected village. Please retry.");
      setVillageLoading(false);
    }
  };

  const loadDemoStatus = async () => {
    try {
      const status = await api.getDemoState();
      setDemoState(status);
      
      const tData = await api.fetchTasks();
      setAllTasks(tData);
      
      // Update selected IDs if demo has them active
      if (status.active_incident_id) {
        setSelectedIncidentId(status.active_incident_id);
      }
      if (status.active_project_id) {
        setSelectedProjectId(status.active_project_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerNextDemoStep = async () => {
    setDemoLoading(true);
    try {
      const nextStep = demoState ? (demoState.current_step === 12 ? 1 : demoState.current_step + 1) : 1;
      const result = await api.advanceDemo(nextStep);
      setDemoState(result);
      
      // Re-fetch all data to ensure React views are in sync
      await loadGlobalData();
      if (selectedVillageId) {
        await loadVillageData(selectedVillageId);
      }

      // Automatically route tabs depending on the demo step to wow the judge
      if (nextStep === 1) {
        setActiveTab('village_dashboard');
      } else if (nextStep === 2) {
        setActiveTab('gis_map');
      } else if (nextStep === 3) {
        setActiveTab('incidents');
      } else if (nextStep === 4) {
        if (result.active_incident_id) {
          setSelectedIncidentId(result.active_incident_id);
          setActiveTab('incident_detail');
        }
      } else if (nextStep === 6) {
        setActiveTab('what_if');
      } else if (nextStep === 7) {
        setActiveTab('resource_opt');
      } else if (nextStep === 9) {
        setActiveTab('worker_portal');
        const tId = result.active_task_id;
        if (tId) {
          api.fetchTask(tId).then((task: any) => {
            setWorkerTasks([task]);
          }).catch(() => {
            setWorkerTasks([]);
          });
        } else {
          setWorkerTasks([]);
        }
      } else if (nextStep === 10) {
        setActiveTab('asset_intel');
        const pumpAsset = assets.find(a => a.name.includes('Pump #17'));
        if (pumpAsset) {
          setSelectedAssetId(pumpAsset.id);
        }
      } else if (nextStep === 11) {
        setActiveTab('project_intel');
        if (result.active_project_id) {
          setSelectedProjectId(result.active_project_id);
        }
      } else if (nextStep === 12) {
        setActiveTab('village_dashboard');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDemoLoading(false);
    }
  };

  const resetDemoState = async () => {
    setDemoLoading(true);
    try {
      const result = await api.advanceDemo(1);
      setDemoState(result);
      await loadGlobalData();
      if (selectedVillageId) {
        await loadVillageData(selectedVillageId);
      }
      setActiveTab('village_dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setDemoLoading(false);
    }
  };

  // Mock Login Handler (Redirects active tab when switcher changes)
  const handleMockLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    let uName = 'admin';
    if (selectedRole === 'citizen') uName = 'citizen';
    if (selectedRole === 'worker') uName = 'worker';
    if (selectedRole === 'district') uName = 'district';
    
    setUsername(uName);
    localStorage.setItem('role', selectedRole);
    
    // Auto redirect based on login role
    if (selectedRole === 'citizen') {
      setActiveTab('citizen_portal');
    } else if (selectedRole === 'worker') {
      setActiveTab('worker_portal');
      if (demoState?.active_task_id) {
        api.fetchTask(demoState.active_task_id).then((task: any) => {
          setWorkerTasks([task]);
        }).catch(() => {
          setWorkerTasks([]);
        });
      } else {
        setWorkerTasks([]);
      }
    } else if (selectedRole === 'district') {
      setActiveTab('command_center');
    } else {
      setActiveTab('village_dashboard');
    }
  };

  // Real Login Submit Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setLoginError("Please enter both username and password.");
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const data = await api.login(loginUsername, loginPassword);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      
      const me = await api.getMe();
      const uRole = me.role as UserRole;
      setRole(uRole);
      setUsername(me.username);
      setFullName(me.name);
      localStorage.setItem('role', me.role);
      localStorage.setItem('username', me.username);
      localStorage.setItem('fullName', me.name);
      setActiveTab(getInitialTabForRole(uRole));
      setAuthStatus('AUTHENTICATED');
      showToast(`Welcome back, ${me.name || me.username}!`, 'success');
      loadGlobalData();
      if (uRole === 'admin') {
        loadVillageData(selectedVillageId || 1);
      }
    } catch (err: any) {
      console.error(err);
      setLoginError("Invalid credentials. Try admin/admin123, citizen/citizen123, etc.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Quick Demo Access Login Handler
  const handleQuickLogin = async (usr: string) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const data = await api.login(usr, usr + "123");
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      
      const me = await api.getMe();
      const uRole = me.role as UserRole;
      setRole(uRole);
      setUsername(me.username);
      setFullName(me.name);
      localStorage.setItem('role', me.role);
      localStorage.setItem('username', me.username);
      localStorage.setItem('fullName', me.name);
      setActiveTab(getInitialTabForRole(uRole));
      setAuthStatus('AUTHENTICATED');
      showToast(`Logged in successfully as ${me.name || me.username}`, 'success');
      loadGlobalData();
      if (uRole === 'admin') {
        loadVillageData(selectedVillageId || 1);
      }
    } catch (err: any) {
      console.error(err);
      setLoginError(`Failed to login as ${usr}. Make sure the backend is active.`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
    setToken(null);
    setRole('admin');
    setUsername('');
    setFullName('');
    setAuthStatus('AUTH_UNAUTHENTICATED');
    setShowLanding(true);
    showToast('Signed out successfully.', 'info');
  };

  // Citizen submit voice/photo simulation
  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let voiceB64 = undefined;
      let photoB64 = undefined;

      if (isRecording) {
        // Encode the Hindi text transcription string directly as standard base64
        // FastAPI backend parses it using base64_probe_text
        voiceB64 = btoa(unescape(encodeURIComponent(voiceSimText)));
      }
      if (uploadedPhotoBase64) {
        photoB64 = uploadedPhotoBase64;
      }

      const result = await api.submitIncidentReport({
        title: citizenTitle || "Borewell Handpump Leaking",
        description: citizenDesc,
        category: citizenCat,
        village_id: selectedVillageId,
        latitude: 23.284 + Math.random() * 0.005,
        longitude: 77.451 + Math.random() * 0.005,
        asset_id: assets.find(a => a.type === 'water_pump')?.id,
        voice_base64: voiceB64,
        photo_base64: photoB64
      });

      showToast(`Report submitted! AI priority score computed: ${result.priority_score}. Category detected: ${result.category.toUpperCase()}`, 'success');
      
      // Reset form
      setCitizenTitle('');
      setCitizenDesc('');
      setUploadedPhotoBase64(null);
      setIsRecording(false);
      
      // Refresh
      loadVillageData(selectedVillageId);
      setActiveTab('village_dashboard');
    } catch (err) {
      showToast('Error submitting report.', 'error');
    }
  };

  // Worker accepts task simulation
  const handleWorkerAcceptTask = async (taskId: number) => {
    try {
      const updatedTask = await api.acceptTask(taskId);
      showToast('Task ACCEPTED. GPS Navigation active.', 'success');
      setWorkerTasks([updatedTask]);
      loadDemoStatus();
      loadVillageData(selectedVillageId);
    } catch (err) {
      showToast('Error accepting task.', 'error');
    }
  };

  // Worker requests price increase simulation
  const handleWorkerPriceIncrease = async (taskId: number) => {
    try {
      const updatedTask = await api.requestPriceIncrease(taskId, additionalCost, workDone, whatWasWrong, productEffect);
      showToast('Price increase request submitted and auto-approved by Gram Panchayat rules engine!', 'success');
      setWorkerTasks([updatedTask]);
      setShowPriceIncreaseForm(false);
      loadDemoStatus();
      loadVillageData(selectedVillageId);
    } catch (err) {
      showToast('Error updating price.', 'error');
    }
  };

  // Worker completes task simulation
  const handleWorkerCompleteTask = async (taskId: number) => {
    try {
      const updatedTask = await api.updateTaskStatus(taskId, 'completed');
      showToast('Task marked COMPLETED. Sensors normalising. Panchayat Treasury funds transferred!', 'success');
      setWorkerTasks([updatedTask]);
      // Reload demo state & village metrics
      loadDemoStatus();
      loadVillageData(selectedVillageId);
    } catch (err) {
      showToast('Error updating task.', 'error');
    }
  };

  // Run outcome verification audit
  const handleOutcomeAudit = async (projId: number) => {
    try {
      const observed = {
        "Households with direct water tap connection": 120.0,
        "Average water supply duration (mins/day)": 60.0,
        "functional_status_pct": 100.0,
        "actual_usage_pct": 98.0
      };
      await api.verifyProjectOutcome(projId, observed);
      showToast('Verification survey completed. Outcome fully verified (100% success)!', 'success');
      loadVillageData(selectedVillageId);
    } catch (err) {
      showToast('Error completing audit.', 'error');
    }
  };
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // 1. AUTH_LOADING: Session is restoring on app mount
  if (authStatus === 'AUTH_LOADING') {
    return (
      <LoadingState
        variant="fullscreen"
        context="authenticating"
        role={(localStorage.getItem('role') as UserRole) || undefined}
      />
    );
  }


  // 2. AUTH_UNAUTHENTICATED: Show landing page or login portal
  if (authStatus === 'AUTH_UNAUTHENTICATED' || !token) {
    if (showLanding) {
      const subdomain = getSubdomainRole();
      const loginHandler = () => setShowLanding(false);
      // Serve role-specific landing when on a subdomain
      if (subdomain === 'citizen') return <CitizenLanding onLoginClick={loginHandler} />;
      if (subdomain === 'worker') return <WorkerLanding onLoginClick={loginHandler} />;
      if (subdomain === 'admin') return <AdminLanding onLoginClick={loginHandler} />;
      if (subdomain === 'district') return <CollectorLanding onLoginClick={loginHandler} />;
      // Default: general landing page for root/unknown subdomain
      return <PortalFirstPage onLoginClick={loginHandler} />;
    }
    return (
      <GovAuthPortal 
        initialRole={getSubdomainRole() || 'citizen'}
        onLoginSuccess={(tokenVal, roleVal, usernameVal, nameVal) => {
          const uRole = roleVal as UserRole;
          localStorage.setItem('token', tokenVal);
          localStorage.setItem('role', roleVal);
          localStorage.setItem('username', usernameVal);
          localStorage.setItem('fullName', nameVal);
          setToken(tokenVal);
          setRole(uRole);
          setUsername(usernameVal);
          setFullName(nameVal);
          setActiveTab(getInitialTabForRole(uRole));
          setAuthStatus('AUTHENTICATED');
          showToast(`Welcome back, ${nameVal}!`, 'success');
          loadGlobalData();
          if (uRole === 'admin') {
            loadVillageData(selectedVillageId || 1);
          }
        }}
        onBackToHome={() => setShowLanding(true)}
      />
    );
  }

  // 3. AUTHENTICATED + SUBDOMAIN ROLE MISMATCH GUARD
  // If on a specific subdomain, verify the logged-in role matches the subdomain.
  // Example: worker logging into admin.gramx.gov.in → AccessDenied screen.
  const subdomainRole = getSubdomainRole();
  if (subdomainRole && authStatus === 'AUTHENTICATED') {
    const roleMatchesSubdomain =
      (subdomainRole === 'citizen' && role === 'citizen') ||
      (subdomainRole === 'worker' && role === 'worker') ||
      (subdomainRole === 'admin' && (role === 'admin')) ||
      (subdomainRole === 'district' && (role === 'district'));

    if (!roleMatchesSubdomain) {
      return (
        <AccessDenied
          requestedRole={subdomainRole}
          actualRole={role}
          displayName={fullName || username}
          onLogout={handleLogout}
        />
      );
    }
  }

  return (
    <ErrorBoundary>
    <>
    <div className="dashboard-container">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? '' : ' overlay-hidden'}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* WCAG 2.1 AA / GIGW 3.0 Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-indigo-700 focus:text-white focus:px-4 focus:py-2.5 focus:rounded-lg focus:shadow-xl focus:outline-hidden font-bold text-xs"
      >
        Skip to main content &rarr;
      </a>

      {toastMessage && (
        <div className={`toast toast-${toastType || 'info'} toast-responsive`} role="alert" aria-live="assertive" aria-atomic="true">
          <span aria-hidden="true">{toastType === 'success' ? '✔' : toastType === 'error' ? '⚠' : 'ℹ'}</span>
          <span style={{ flex: 1 }}>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            aria-label="Close notification message"
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer', padding: '0 0 0 8px', height: 'auto', display: 'flex', alignItems: 'center', flexShrink: 0, minWidth: '28px', minHeight: '28px', justifyContent: 'center' }}
          >×</button>
        </div>
      )}
      
      {/* ---------------- SIDEBAR NAVIGATION ---------------- */}
      <nav id="primary-sidebar" className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`} aria-label="Primary Portal Navigation" role="navigation">
        {/* Sidebar Identity Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--accent-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: '1rem' }} aria-hidden="true">🇮🇳</span>
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>GRAM-X</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {role === 'citizen' && 'Citizen Portal'}
              {role === 'worker' && 'Field Operations'}
              {role === 'admin' && 'Panchayat Admin'}
              {role === 'district' && 'District Collector'}
            </div>
          </div>
        </div>

        {/* Role Switcher (Hidden in production view, visible only in dev console) */}
        {showDeveloperConsole && (
          <div style={{ marginBottom: '24px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>ACTIVE USER ROLE</p>
            <select value={role} onChange={(e) => handleMockLogin(e.target.value as UserRole)} style={{ padding: '6px 10px', fontSize: '0.8rem', background: 'var(--bg-primary)', width: '100%', marginBottom: '8px' }}>
              <option value="admin">Panchayat Sec. (Admin)</option>
              <option value="citizen">Sunita Devi (Citizen)</option>
              <option value="worker">Suresh Kumar (Worker)</option>
              <option value="district">Collector (District)</option>
            </select>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>USER: {username.toUpperCase()}</p>
            
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '10px', marginBottom: '8px', fontWeight: 700 }}>INTEGRATED CUSTOM VIEWS</p>
            <select value={activeTab} onChange={(e) => setActiveTab(e.target.value as Tab)} style={{ padding: '6px 10px', fontSize: '0.8rem', background: 'var(--bg-primary)', width: '100%' }}>
              <option value="command_center">Standard Dashboard</option>
              <option value="new_citizen_portal">Citizen Portal (Camera/Timeline)</option>
              <option value="new_worker_portal">Technician Portal (State Machine)</option>
              <option value="new_admin_portal">Admin Portal (Attention/SLA)</option>
              <option value="new_collector_portal">DM Oversight (District Health)</option>
              <option value="blackrock_login">BlackRock Wealth Login</option>
              <option value="blackrock_auth">BlackRock Wealth Auth</option>
              <option value="portal_first_page">Zod Area Initialize</option>
            </select>
          </div>
        )}

        <nav style={{ display: 'flex', gap: '6px', flex: 1, flexDirection: 'column', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
          {/* CITIZEN SIDEBAR */}
          {role === 'citizen' && (
            <>
              <button className={`secondary ${activeTab === 'citizen_portal' ? 'active' : ''}`} 
                onClick={() => setActiveTab('citizen_portal')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'citizen_portal' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <Home size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.dashboard')}</span>
              </button>

              <button className="secondary" 
                onClick={() => {
                  setActiveTab('citizen_portal');
                  showToast(t('citizen.write_complaint'), 'info');
                }}
                style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none' }}>
                <Radio size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.report_issue')}</span>
              </button>

              <button className="secondary" 
                onClick={() => {
                  setActiveTab('citizen_portal');
                  showToast(t('citizen.my_complaints_title'), 'info');
                }}
                style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none' }}>
                <Layers size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.my_complaints')}</span>
              </button>

              <button className="secondary" 
                onClick={() => {
                  setActiveTab('citizen_portal');
                }}
                style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none' }}>
                <CheckCircle size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.track_verify')}</span>
              </button>

              <button className="secondary" 
                onClick={() => {
                  const myUnresolved = incidents.filter(i => (i.reporter_name === fullName || i.reporter_name === username) && i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed');
                  showToast(`${t('notifications.title')}: ${myUnresolved.length} ${t('citizen.active_complaints')}`, 'info');
                }}
                style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none', position: 'relative' }}>
                <Radio size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('notifications.title')}</span>
                {incidents.filter(i => (i.reporter_name === fullName || i.reporter_name === username) && i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length > 0 && (
                  <span style={{ position: 'absolute', right: '12px', background: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px' }}>
                    {incidents.filter(i => (i.reporter_name === fullName || i.reporter_name === username) && i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length}
                  </span>
                )}
              </button>

              <button className="secondary" 
                onClick={() => setActiveTab('profile')}
                style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none' }}>
                <UserCheck size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('profile')}</span>
              </button>

              <button className="secondary" 
                onClick={() => showToast(`${t('helpline.title')}: ${t('helpline.number')}`, 'info')}
                style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none' }}>
                <HelpCircle size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('helpline.title')}</span>
              </button>

              {/* Call Toll-free Widget */}
              <div style={{
                marginTop: 'auto',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.1)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}>
                <span style={{ display: 'block', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>📞 {t('helpline.title')}</span>
                <strong style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }}>{t('helpline.number')}</strong>
              </div>
            </>
          )}

          {/* TECHNICIAN (Worker) SIDEBAR */}
          {role === 'worker' && (
            <>
              <button className={`secondary ${activeTab === 'worker_portal' ? 'active' : ''}`} 
                onClick={() => setActiveTab('worker_portal')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'worker_portal' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <Home size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.dashboard')}</span>
              </button>

              <button className="secondary" 
                onClick={() => {
                  setActiveTab('worker_portal');
                  showToast(t('worker.today_work'), 'info');
                }}
                style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none' }}>
                <Layers size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.my_tasks')}</span>
              </button>

              <button className="secondary" 
                onClick={() => setActiveTab('worker_portal')}
                style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none' }}>
                <Wrench size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.current_assignment')}</span>
              </button>

              <button className="secondary" 
                onClick={() => {
                  setActiveTab('worker_portal');
                  showToast(t('nav.gps_navigation'), 'info');
                }}
                style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none' }}>
                <MapIcon size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.gps_navigation')}</span>
              </button>

              <button className="secondary" 
                onClick={() => {
                  const completedTasks = workerTasks.filter(t => t.status === 'completed');
                  showToast(`${t('nav.work_history')}: ${completedTasks.length} ${t('worker.completed')}`, 'info');
                }}
                style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none' }}>
                <ShieldCheck size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.work_history')}</span>
              </button>

              <button className="secondary" 
                onClick={() => {
                  const earnings = workerTasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.cost, 0);
                  showToast(`${t('nav.my_earnings')}: ₹${earnings.toLocaleString()}`, 'info');
                }}
                style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none' }}>
                <BarChart size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.my_earnings')}</span>
              </button>

              {/* Status Widget */}
              <div style={{
                marginTop: 'auto',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.1)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}>
                <span style={{ display: 'block', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{t('worker.payout_status')}</span>
                <span className="badge badge-low" style={{ marginBottom: '8px', display: 'inline-flex' }}>
                  {workerTasks.find(t => t.status !== 'completed') ? 'ON TASK' : 'AVAILABLE'}
                </span>
                <p style={{ fontSize: '0.65rem', marginBottom: '8px' }}>USER ID: <strong>{username.toUpperCase()}</strong></p>
                <button className="secondary" style={{ padding: '4px 8px', fontSize: '0.65rem', width: '100%', borderColor: '#ef4444', color: '#fca5a5' }} onClick={() => showToast(t('common.offline'), 'info')}>
                  {t('sign_out')}
                </button>
              </div>
            </>
          )}

          {/* PANCHAYAT ADMIN SIDEBAR */}
          {role === 'admin' && (
            <>
              <button className={`secondary ${activeTab === 'village_dashboard' ? 'active' : ''}`} 
                onClick={() => setActiveTab('village_dashboard')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'village_dashboard' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <Home size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.dashboard')}</span>
              </button>

              <button className={`secondary ${activeTab === 'ground_reality' ? 'active' : ''}`} 
                onClick={() => setActiveTab('ground_reality')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'ground_reality' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <Activity size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.ground_reality')}</span>
              </button>

              <button className={`secondary ${activeTab === 'gis_map' ? 'active' : ''}`} 
                onClick={() => setActiveTab('gis_map')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'gis_map' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <MapIcon size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.gis_map')}</span>
              </button>

              <button className={`secondary ${activeTab === 'incidents' ? 'active' : ''}`} 
                onClick={() => setActiveTab('incidents')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'incidents' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <ShieldAlert size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.incidents')}</span>
              </button>

              <button className={`secondary ${activeTab === 'prediction_future' ? 'active' : ''}`} 
                onClick={() => setActiveTab('prediction_future')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'prediction_future' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <Compass size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.smart_dispatch')}</span>
              </button>

              <button className={`secondary ${activeTab === 'money_budget' ? 'active' : ''}`} 
                onClick={() => setActiveTab('money_budget')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'money_budget' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <BarChart size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.budget_treasury')}</span>
              </button>

              <button className={`secondary ${activeTab === 'asset_intel' ? 'active' : ''}`} 
                onClick={() => setActiveTab('asset_intel')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'asset_intel' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <Cpu size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.asset_health')}</span>
              </button>

              <button className={`secondary ${activeTab === 'resource_opt' ? 'active' : ''}`} 
                onClick={() => setActiveTab('resource_opt')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'resource_opt' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <Landmark size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.resource_opt')}</span>
              </button>

              <button className={`secondary ${activeTab === 'project_intel' ? 'active' : ''}`} 
                onClick={() => setActiveTab('project_intel')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'project_intel' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <Layers size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.project_audit')}</span>
              </button>

              <button className={`secondary ${activeTab === 'data_intelligence' ? 'active' : ''}`} 
                onClick={() => setActiveTab('data_intelligence')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'data_intelligence' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <Database size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.data_intelligence')}</span>
              </button>

              <button className={`secondary ${activeTab === 'responsible_ai' ? 'active' : ''}`} 
                onClick={() => setActiveTab('responsible_ai')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'responsible_ai' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <Scale size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.responsible_ai')}</span>
              </button>

              <button className={`secondary ${activeTab === 'crisis_intelligence' ? 'active' : ''}`} 
                onClick={() => setActiveTab('crisis_intelligence')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'crisis_intelligence' ? 'var(--accent-primary)' : 'transparent', border: 'none', color: 'var(--status-critical)' }}>
                <ShieldAlert size={16} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('nav.crisis_command')}</span>
              </button>
            </>
          )}

          {/* DISTRICT COLLECTOR SIDEBAR */}
          {role === 'district' && (
            <>
              <button className={`secondary ${activeTab === 'command_center' ? 'active' : ''}`} 
                onClick={() => setActiveTab('command_center')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'command_center' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <Home size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.dashboard')}</span>
              </button>

              <button className={`secondary ${activeTab === 'village_dashboard' ? 'active' : ''}`} 
                onClick={() => setActiveTab('village_dashboard')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'village_dashboard' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <Activity size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('collector.district_overview')}</span>
              </button>

              <button className={`secondary ${activeTab === 'gis_map' ? 'active' : ''}`} 
                onClick={() => setActiveTab('gis_map')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'gis_map' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <MapIcon size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.gis_map')}</span>
              </button>

              <button className={`secondary ${activeTab === 'ground_reality' ? 'active' : ''}`} 
                onClick={() => setActiveTab('ground_reality')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'ground_reality' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <ActivityIcon size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.ground_reality')}</span>
              </button>

              <button className={`secondary ${activeTab === 'equity_intel' ? 'active' : ''}`} 
                onClick={() => setActiveTab('equity_intel')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'equity_intel' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <Heart size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('collector.inter_village_equity')}</span>
              </button>

              <button className={`secondary ${activeTab === 'audit_accountability' ? 'active' : ''}`} 
                onClick={() => setActiveTab('audit_accountability')}
                style={{ justifyContent: 'flex-start', background: activeTab === 'audit_accountability' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}>
                <ShieldCheck size={16} />
                <span style={{ fontSize: '0.8rem' }}>{t('nav.audit_ledger')}</span>
              </button>
            </>
          )}
        </nav>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          style={{
            marginTop: '16px',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#dc2626',
            width: '100%',
            padding: '8px',
            fontSize: '13px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>🚪</span> {t('sign_out')}
        </button>

        {/* Sidebar Quick Links + External Links */}
        <SidebarQuickLinks role={role} onNavigate={(tab) => setActiveTab(tab as Tab)} />
      </nav>

      {/* ---------------- MAIN CONTAINER ---------------- */}
      <main id="main-content" className="main-content" role="main" tabIndex={-1}>

        {/* Institutional Government-Style Header — sticky at top */}
        <header role="banner" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 'var(--z-header)' as any }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 24px' }}>
            {/* Mobile hamburger + Left Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Mobile hamburger */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={sidebarOpen}
                aria-controls="primary-sidebar"
                className="mobile-hamburger"
                style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#334155', minWidth: '36px', minHeight: '36px' }}
              >
                <span aria-hidden="true" style={{ fontSize: '1rem', lineHeight: '1' }}>☰</span>
              </button>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #3b82f6', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                🇮🇳
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>{t('brand.title')}</span>
                  <span style={{ fontSize: '0.6rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('brand.badge')}</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '2px 0 0 0', fontWeight: 600 }}>
                  {t('brand.subtitle')}
                </p>
              </div>
            </div>

            {/* Right Portion: Status, Search, Notifications, Language, Profile & Sign Out */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              
              {/* Quick Global Search / Command Palette Trigger */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="header-search-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
                aria-label="Open Command Palette Search (Ctrl+K)"
              >
                <span aria-hidden="true">🔍</span>
                <span className="header-search-text">{t('action.search')}</span>
                <kbd style={{ fontSize: '0.65rem', background: '#e2e8f0', color: '#334155', padding: '1px 5px', borderRadius: '4px', border: '1px solid #cbd5e1' }} className="header-search-kbd">{t('search.shortcut')}</kbd>
              </button>

              {/* System Operational Badge — hidden on narrow screens */}
              <div className="header-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} aria-hidden="true"></span>
                <span>{t('system.operational')}</span>
              </div>

              {/* Network Status Indicator */}
              <NetworkStatus />

              {/* Live Clock */}
              <div className="hidden lg:block">
                <LiveClock variant="full" />
              </div>

              {/* Native 4-Language Selector (Hindi, Tamil, Telugu, English) */}
              <LanguageSelector variant="compact" />

              {/* Dynamic Database-driven Notification Bell */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsNotificationDrawerOpen(true)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', position: 'relative' }}
                  aria-label={`${t('notifications.title')} — ${incidents.filter(i => i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length} active`}
                >
                  <span
                    style={{ fontSize: '1.2rem', display: 'inline-block' }}
                    className={incidents.filter(i => i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length > 0 ? 'gov-bell-pulse' : ''}
                    aria-hidden="true"
                  >🔔</span>
                  {incidents.filter(i => i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length > 0 && (
                    <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', fontSize: '0.55rem', fontWeight: 'bold', width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
                      {incidents.filter(i => i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length}
                    </span>
                  )}
                </button>
              </div>

              {/* Authenticated user name & Role label with avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
                <div className="role-avatar" style={{ background: getRoleAvatarGradient(role), width: 36, height: 36, fontSize: '13px', flexShrink: 0 }} aria-hidden="true">
                  {getInitials(fullName || role || 'U')}
                </div>
                <div className="header-user-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{fullName || t('greeting.welcome_back')}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {role === 'admin' ? t('role.admin') : role === 'district' ? t('role.district') : role === 'citizen' ? t('role.citizen') : t('role.worker')}
                  </span>
                </div>
              </div>

              {/* Profile Link Button */}
              <button 
                onClick={() => { setActiveTab('profile'); setShowNotifications(false); }}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px', fontWeight: 'bold', color: '#334155' }}
              >
                {t('profile')}
              </button>

            </div>
          </div>

          {/* Saffron-White-Green Tricolour Accent Line */}
          <div style={{ display: 'flex', height: '3.5px', width: '100%', overflow: 'hidden' }}>
            <div style={{ background: '#FF9933', flex: 1 }} />
            <div style={{ background: '#ffffff', flex: 1 }} />
            <div style={{ background: '#138808', flex: 1 }} />
          </div>

          {/* Government Information Bar */}
          <GovernmentInfoBar
            onHelpline={() => showToast('Helpline: 1800-212-GRAMX — Available 9AM–6PM (Mon–Sat)', 'info')}
          />
        </header>

        {/* Announcement Ticker — real incident-driven messages */}
        <AnnouncementTicker
          notices={[
            incidents.filter(i => i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length > 0
              ? `📢 ALERT — ${incidents.filter(i => i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length} active infrastructure complaint${incidents.filter(i => i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length !== 1 ? 's' : ''} under review. Citizens can track resolution status online.`
              : '✅ All reported infrastructure complaints are currently resolved. Thank you for using GRAM-X.',
            '🔧 सूचना / NOTICE — Field technicians must submit completion evidence for GP fund disbursement.',
            '💧 जल जीवन मिशन — Har Ghar Jal | Tracking water asset repairs across all Gram Panchayats.',
            '📋 All service requests are SLA-tracked. Response time target: 48 hours. Escalation: 72 hours.',
            '🇮🇳 Government of India — Panchayati Raj Ministry | Digital Rural Infrastructure Governance Initiative.',
          ]}
        />

        {/* ---------------- INTERACTIVE DEMO SCENARIO HEADER CONTROLLER (Collapsible) ---------------- */}
        {showDeveloperConsole && (
          <div className="glass" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(99, 102, 241, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="badge" style={{ background: '#6366f1', color: '#fff', fontSize: '0.7rem' }}>SCENARIO DRIVER</span>
                <h3 style={{ fontSize: '1rem', color: '#fff' }}>Water Crisis Demo Sequence</h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="secondary" onClick={resetDemoState} style={{ padding: '6px 12px', fontSize: '0.75rem' }} disabled={demoLoading}>
                  <RefreshCw size={14} className={demoLoading ? 'spin' : ''} />
                  <span>Reset Demo</span>
                </button>
                <button onClick={triggerNextDemoStep} style={{ padding: '6px 14px', fontSize: '0.75rem', background: '#10b981' }} disabled={demoLoading}>
                  <Play size={14} />
                  <span>{demoState?.current_step === 12 ? 'Restart Scenario' : 'Advance Next Step'}</span>
                </button>
              </div>
            </div>
            
            {demoState && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '6px', textAlign: 'center', minWidth: '80px' }}>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>ACTIVE STEP</p>
                  <h4 style={{ fontSize: '1.25rem', color: '#6366f1' }}>{demoState.current_step}/12</h4>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-critical" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{demoState.badge}</span>
                    <strong style={{ fontSize: '0.85rem' }}>{demoState.title}</strong>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{demoState.description}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- PAGE ROUTING CONTAINER ---------------- */}
        <div className="page-routing-container">

          {/* Breadcrumb + Page Title */}
          {role !== 'citizen' && role !== 'worker' && (
            <Breadcrumb
              activeTab={activeTab}
              onNavigate={(tab) => setActiveTab(tab as Tab)}
            />
          )}
          <PageTitle activeTab={activeTab} />

          {globalError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1rem' }}>⚠️</span>
                <p style={{ fontSize: '13px', color: '#dc2626', margin: 0, fontWeight: 600 }}>{globalError}</p>
              </div>
              <button className="secondary" onClick={loadGlobalData} style={{ padding: '4px 10px', fontSize: '12px', height: '32px' }}>
                Retry Connection
              </button>
            </div>
          )}

          {villageError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '13px', color: '#dc2626', margin: 0, fontWeight: 600 }}>{villageError}</p>
              <button className="secondary" onClick={() => loadVillageData(selectedVillageId)} style={{ padding: '2px 8px', fontSize: '12px', height: '32px' }}>
                Retry
              </button>
            </div>
          )}

          {(globalLoading || villageLoading) && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px', gap: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <div className="btn-spinner-dark" />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Synchronizing Gram Panchayat records & assets...</span>
            </div>
          )}
          
          {/* Active Village Context Header */}
          {(activeTab !== 'command_center' && activeTab !== 'cross_analytics' && role === 'admin') && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Panchayat Context</span>
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
                  {villages.find(v => v.id === selectedVillageId)?.name || 'Piparli'} Panchayat
                </h1>
              </div>
              <div>
                <select value={selectedVillageId} onChange={(e) => setSelectedVillageId(Number(e.target.value))} style={{ width: '180px', background: 'var(--bg-secondary)' }}>
                  {villages.map(v => (
                    <option key={v.id} value={v.id}>{v.name} Village</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <Suspense fallback={<div className="p-6 space-y-4"><CardSkeleton /><CardSkeleton /></div>}>
          {/* 1. CENTRAL COMMAND CENTRE (DISTRICT ADMIN) */}
          {activeTab === 'command_center' && (
            <CentralGovernance onSelectVillage={setSelectedVillageId} selectedVillageId={selectedVillageId} villages={villages} incidents={incidents} tasks={allTasks} />
          )}

          {/* 2. VILLAGE DASHBOARD */}
          {activeTab === 'village_dashboard' && (
            !activeMetrics ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px' }}>
                <div className="btn-spinner-dark" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>Loading Panchayat data...</p>
              </div>
            ) : (
            <div className="space-y-6">
              {/* PANCHAYAT COMMAND CENTER Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>PANCHAYAT COMMAND CENTER</h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {villages.find(v => v.id === selectedVillageId)?.name || 'Piparli'} Panchayat ● Systems Operational
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>
                    ● LIVE TELEMETRY
                  </span>
                  <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '4px 0 0 0', fontWeight: 'bold' }}>
                    Last synchronized: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Dynamic KPI Row — responsive repeat without overflow */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Alerts</span>
                  <strong style={{ display: 'block', fontSize: '1.75rem', color: '#0f172a', marginTop: '4px', fontWeight: 800 }}>
                    {incidents.filter(i => i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length}
                  </strong>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical</span>
                  <strong style={{ display: 'block', fontSize: '1.75rem', color: '#ef4444', marginTop: '4px', fontWeight: 800 }}>
                    {incidents.filter(i => (i.severity === 'CRITICAL' || i.severity === 'critical') && i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length}
                  </strong>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SLA At Risk</span>
                  <strong style={{ display: 'block', fontSize: '1.75rem', color: '#f59e0b', marginTop: '4px', fontWeight: 800 }}>
                    {incidents.filter(i => (i.sla_status === 'AT_RISK' || i.sla_status === 'at_risk') && i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length}
                  </strong>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Workers</span>
                  <strong style={{ display: 'block', fontSize: '1.75rem', color: '#3b82f6', marginTop: '4px', fontWeight: 800 }}>
                    {technicians.length}
                  </strong>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Budget Util.</span>
                  <strong style={{ display: 'block', fontSize: '1.5rem', color: '#0f172a', marginTop: '6px', fontWeight: 800 }}>
                    {activeMetrics.budget_allocated > 0 ? Math.round((activeMetrics.budget_spent / activeMetrics.budget_allocated) * 100) : 64}%
                  </strong>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Verify</span>
                  <strong style={{ display: 'block', fontSize: '1.75rem', color: '#10b981', marginTop: '4px', fontWeight: 800 }}>
                    {incidents.filter(i => i.status === 'pending_verification').length}
                  </strong>
                </div>
              </div>

              {/* Requires Attention Alert Panel */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requires Attention</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Dynamic Critical incidents check */}
                  {incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '0 6px 6px 0', fontSize: '0.75rem' }}>
                      <span style={{ color: '#991b1b', fontWeight: 'bold' }}>CRITICAL: {i.title} (SLA: {i.sla_status || 'Active'})</span>
                      <button 
                        style={{ padding: '2px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                        onClick={() => { setSelectedIncidentId(i.id); setActiveTab('incident_detail'); }}
                      >
                        Dispatch
                      </button>
                    </div>
                  ))}

                  {/* Warning: Worker availability check */}
                  {technicians.filter(t => !t.availability).length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '0 6px 6px 0', fontSize: '0.75rem' }}>
                      <span style={{ color: '#92400e', fontWeight: 'bold' }}>WARNING: {technicians.filter(t => !t.availability).length} Workers currently unavailable / active on routes</span>
                      <span style={{ color: '#92400e', fontWeight: 'bold' }}>Field Operations</span>
                    </div>
                  )}

                  {/* Price Scope revisions */}
                  {allTasks.filter(t => t.cost_increased && t.status !== 'completed').map(t => {
                    const linkedInc = incidents.find(i => i.id === t.incident_id);
                    return (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#eff6ff', borderLeft: '4px solid #3b82f6', borderRadius: '0 6px 6px 0', fontSize: '0.75rem' }}>
                        <span style={{ color: '#1e40af', fontWeight: 'bold' }}>REVIEW: Cost scope revision requested for {linkedInc?.title || 'Task'} (₹{t.cost} total scope)</span>
                        <button 
                          style={{ padding: '2px 8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                          onClick={() => { setSelectedIncidentId(t.incident_id); setActiveTab('incident_detail'); }}
                        >
                          Review Scope
                        </button>
                      </div>
                    );
                  })}
                  
                  {/* Empty state */}
                  {incidents.filter(i => (i.severity === 'CRITICAL' || i.severity === 'critical') && i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length === 0 &&
                   allTasks.filter(t => t.cost_increased && t.status !== 'completed').length === 0 && (
                     <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>No urgent anomalies requiring administrative attention.</p>
                   )}
                </div>
              </div>

              {/* Incidents and Projects panels — responsive wrapping */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Active Alerts list */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Active Alert Register</h3>
                    <button className="secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setActiveTab('incidents')}>View Queue</button>
                  </div>
                  
                  {incidents.filter(i => i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                      <CheckCircle size={36} color="#10b981" style={{ marginBottom: '12px', margin: '0 auto' }} />
                      <p style={{ fontSize: '0.75rem' }}>No active incidents. Panchayat systems operational.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {incidents.filter(i => i.status !== 'resolved' && i.status !== 'completed' && i.status !== 'resolved_confirmed').map(i => (
                        <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#f8fafc' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={`badge badge-${i.severity}`} style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>{i.severity}</span>
                              <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{i.title}</strong>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Category: {i.category.toUpperCase()} | Priority: {i.priority_score}</p>
                          </div>
                          <button className="secondary" style={{ padding: '4px 8px', fontSize: '0.7rem', border: '1px solid #cbd5e1' }} onClick={() => {
                            setSelectedIncidentId(i.id);
                            setActiveTab('incident_detail');
                          }}>Dispatch Desk</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Projects Panel */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Panchayat Projects</h3>
                    <button className="secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setActiveTab('project_intel')}>Audit</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {projects.map(p => {
                      const hasGap = p.status === 'completed' && !p.outcome_verified && p.title.includes('Pipeline');
                      return (
                        <div key={p.id} style={{ padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#f8fafc' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>{p.title}</strong>
                            <span className={`badge ${p.status === 'completed' ? 'badge-low' : 'badge-medium'}`} style={{ fontSize: '0.65rem' }}>{p.status}</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b' }}>
                              <span>Physical Progress</span>
                              <span>{p.physical_progress_pct}%</span>
                            </div>
                            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${p.physical_progress_pct}%`, height: '100%', background: '#3b82f6' }}></div>
                            </div>
                          </div>

                          {/* Outcome Gap Banner */}
                          {hasGap && (
                            <div style={{ marginTop: '10px', background: '#fff1f2', border: '1px solid #fecdd3', padding: '6px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', color: '#e11d48', fontSize: '0.7rem' }}>
                              <AlertTriangle size={12} />
                              <span>Outcome Gap: 51% actual usage vs 100% completed.</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* 3. LIVE GIS MAP */}
          {activeTab === 'gis_map' && (
            <OperationalGIS 
              currentRole={role}
              onNavigateTab={(tab, id) => {
                if (id && tab === 'incident_detail') setSelectedIncidentId(id);
                if (id && tab === 'asset_intel') setSelectedAssetId(id);
                setActiveTab(tab as Tab);
              }}
              showToast={showToast}
            />
          )}

          {/* 4. INCIDENT QUEUE */}
          {activeTab === 'incidents' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2>Grassroots Incident Priority Ledger</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>AI prioritization based on socio-economic impact per rupee.</p>
              </div>

              <div className="glass-card">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px' }}>Incident Alert</th>
                      <th>Category</th>
                      <th>Severity</th>
                      <th>Affected Pop.</th>
                      <th>Evidence Confidence</th>
                      <th>AI Priority Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map(i => (
                      <tr key={i.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px', fontWeight: 600 }}>{i.title}</td>
                        <td>{i.category.toUpperCase()}</td>
                        <td>
                          <span className={`badge badge-\${i.severity}`}>{i.severity}</span>
                        </td>
                        <td>{i.affected_population} residents</td>
                        <td>{Math.round((i.ai_confidence ?? 0.9) * 100)}%</td>
                        <td style={{ fontWeight: 800, color: (i.priority_score ?? 0) > 75 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                          {i.priority_score ?? 75}/100
                        </td>
                        <td>
                          <button className="secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => {
                            setSelectedIncidentId(i.id);
                            setActiveTab('incident_detail');
                          }}>Case Intel</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. INCIDENT DETAIL / CASE WORKBENCH */}
          {activeTab === 'incident_detail' && incidentDetail && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setActiveTab('incidents')}>
                  &larr; Back to queue
                </button>
                <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <button 
                    onClick={() => setSelectedProjectId(null)} // use as tab switcher inside detail
                    style={{ background: selectedProjectId === null ? 'var(--accent-primary)' : 'transparent', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '0.7rem', color: '#fff', cursor: 'pointer' }}>
                    🔧 Action Workbench
                  </button>
                  <button 
                    onClick={() => setSelectedProjectId(999)}
                    style={{ background: selectedProjectId === 999 ? 'var(--accent-primary)' : 'transparent', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '0.7rem', color: '#fff', cursor: 'pointer' }}>
                    🧬 AI Problem Intel & DNA
                  </button>
                  <button 
                    onClick={() => setSelectedProjectId(888)}
                    style={{ background: selectedProjectId === 888 ? 'var(--accent-primary)' : 'transparent', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '0.7rem', color: '#fff', cursor: 'pointer' }}>
                    🛡️ Safety & Trust
                  </button>
                </div>
              </div>

              {selectedProjectId === null && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', alignItems: 'start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span className={`badge badge-\${incidentDetail.severity}`}>{incidentDetail.severity} Severity</span>
                        <strong style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>AI Priority Rank Score: {incidentDetail.priority_score}</strong>
                      </div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>{incidentDetail.title}</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{incidentDetail.description}</p>
                      
                      {/* Status timeline */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <span className="badge" style={{ background: incidentDetail.status === 'pending_verification' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(255,255,255,0.05)', color: incidentDetail.status === 'pending_verification' ? '#eab308' : '#fff' }}>Pending Verification</span>
                        <ChevronRight size={16} color="var(--text-muted)" />
                        <span className="badge" style={{ background: incidentDetail.status === 'verified' ? 'rgba(249, 115, 22, 0.12)' : 'rgba(255,255,255,0.05)', color: incidentDetail.status === 'verified' ? '#f97316' : '#fff' }}>Verified</span>
                        <ChevronRight size={16} color="var(--text-muted)" />
                        <span className="badge" style={{ background: incidentDetail.status === 'in_progress' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.05)', color: incidentDetail.status === 'in_progress' ? '#6366f1' : '#fff' }}>Repairing</span>
                        <ChevronRight size={16} color="var(--text-muted)" />
                        <span className="badge" style={{ background: incidentDetail.status === 'resolved' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.05)', color: incidentDetail.status === 'resolved' ? '#10b981' : '#fff' }}>Resolved</span>
                      </div>
                    </div>

                    {/* Evidence analysis */}
                    <div className="glass-card">
                      <h3>Incident Evidence Analysis</h3>
                      {incidentDetail.evidence.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '10px' }}>No media evidence submitted.</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                          {incidentDetail.evidence.map(ev => (
                            <div key={ev.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                {ev.type === 'photo' ? <Eye size={16} color="#6366f1" /> : <Volume2 size={16} color="#14b8a6" />}
                                <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>{ev.type} evidence</strong>
                              </div>
                              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>"{ev.recognized_text}"</p>
                              {ev.ai_metadata && (
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  Pipeline: {JSON.parse(ev.ai_metadata).pipeline} | Language: {JSON.parse(ev.ai_metadata).detected_language}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dispatch Form */}
                    {incidentDetail.status !== 'resolved' && (
                      <div className="glass-card">
                        <h3>Smart Dispatch & Intervention Action</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                          {availableWorkers.map(w => (
                            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                              <div>
                                <strong style={{ fontSize: '0.85rem' }}>{w.name}</strong>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Specialty: {w.specialty.toUpperCase()} | Rating: ⭐{w.rating} | Distance: {w.distance_km} km away</p>
                              </div>
                              <button style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={async () => {
                                try {
                                  await api.dispatchWorker(incidentDetail.id, w.id);
                                  showToast(`Task assigned to ${w.name}!`, 'success');
                                  loadDemoStatus();
                                  loadVillageData(selectedVillageId);
                                } catch (err) {
                                  showToast('Failed to dispatch technician. Please try again.', 'error');
                                }
                              }}>Dispatch Tech</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-card" style={{ borderTop: '4px solid #6366f1' }}>
                      <h3 style={{ marginBottom: '12px' }}>AI Root Cause Analysis</h3>
                      <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {incidentDetail.probable_root_causes.map((rc, idx) => (
                          <li key={idx}>{rc}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="glass-card" style={{ borderTop: '4px solid #ef4444' }}>
                      <h3 style={{ marginBottom: '12px' }}>Compound Consequences</h3>
                      <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {incidentDetail.consequences.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {selectedProjectId === 999 && (
                <ProblemIntel incident={incidentDetail} assets={assets} />
              )}

              {selectedProjectId === 888 && (
                <ResponsibleAI villageId={selectedVillageId} />
              )}
            </div>
          )}

          {/* 6. ASSET INTELLIGENCE */}
          {activeTab === 'asset_intel' && (
            <AssetIntel assets={assets} selectedAssetId={selectedAssetId} assetDetail={assetDetail} onAssetSelected={setSelectedAssetId} />
          )}

          {/* 7. PROJECT INTELLIGENCE */}
          {activeTab === 'project_intel' && (
            <ProjectIntel projects={projects} selectedProjectId={selectedProjectId} onProjectSelected={setSelectedProjectId} onAuditCompleted={handleOutcomeAudit} />
          )}

          {/* 8. PREDICTION & FUTURE / WHAT-IF */}
          {activeTab === 'prediction_future' && (
            <PredictionFuture villageId={selectedVillageId} />
          )}

          {/* 9. MONEY & BUDGET */}
          {activeTab === 'money_budget' && (
            <MoneyBudget villageId={selectedVillageId} />
          )}

          {/* 10. RESOURCE REUSE */}
          {activeTab === 'resource_opt' && (
            <ResourceIntel 
              assets={assets} 
              villageId={selectedVillageId} 
              recommendations={reuseRecs}
              onDecisionSubmitted={() => loadVillageData(selectedVillageId)}
            />
          )}

          {/* 11. EQUITY & LAST-MILE */}
          {activeTab === 'equity_intel' && (
            <EquityIntel />
          )}

          {/* 12. AUDIT & REPLAY */}
          {activeTab === 'audit_accountability' && (
            <AuditAccountability incidents={incidents} projects={projects} activeIncidentId={selectedIncidentId} onSelectIncident={setSelectedIncidentId} />
          )}

          {/* 13. DATA QUALITY CC */}
          {activeTab === 'data_intelligence' && (
            <DataIntelligence />
          )}

          {/* 14. RESPONSIBLE AI */}
          {activeTab === 'responsible_ai' && (
            <ResponsibleAI villageId={selectedVillageId} />
          )}

          {/* 15. CITIZEN PORTAL */}
          {activeTab === 'citizen_portal' && (
            <CitizenExperience villageId={selectedVillageId} assets={assets} villages={villages} incidents={incidents} onReportSubmitted={() => loadVillageData(selectedVillageId)} demoState={demoState} showToast={showToast} fullName={fullName} username={username} />
          )}

          {activeTab === 'new_citizen_portal' && (
            <CitizenPortal 
              existingIncidents={incidents} 
              villageId={selectedVillageId}
              onReportSubmitted={() => loadVillageData(selectedVillageId)}
              showToast={showToast}
              fullName={fullName || 'Citizen'}
            />
          )}
          {activeTab === 'new_worker_portal' && (
            <TechnicianPortal 
              tasks={workerTasks.length > 0 ? workerTasks : allTasks}
              workerName={fullName || username || 'Field Technician'}
              onAcceptTask={handleWorkerAcceptTask}
              onRequestPriceIncrease={(taskId, cost, workDone, whatWasWrong, productEffect) => {
                return api.requestPriceIncrease(taskId, cost, workDone, whatWasWrong, productEffect).then(t => {
                  setWorkerTasks([t]);
                  loadVillageData(selectedVillageId);
                });
              }}
              onCompleteTask={handleWorkerCompleteTask}
              onRefresh={() => loadVillageData(selectedVillageId)}
              showToast={showToast}
            />
          )}
          {activeTab === 'new_admin_portal' && (
            <AdminPortal 
              village={villages.find(v => v.id === selectedVillageId)}
              incidents={incidents}
              assets={assets}
              technicians={technicians}
              tasks={allTasks}
              onDispatch={async (incId: number, techId: number) => {
                await api.dispatchWorker(incId, techId);
                loadVillageData(selectedVillageId);
              }}
              onSelectIncident={(id: number) => {
                setSelectedIncidentId(id);
                setActiveTab('incident_detail');
              }}
              onNavigateTab={(tab: string) => setActiveTab(tab as any)}
              showToast={showToast}
              onRefresh={() => loadVillageData(selectedVillageId)}
            />
          )}
          {activeTab === 'new_collector_portal' && (
            <CollectorPortal 
              villages={villages}
              incidents={incidents}
              tasks={allTasks}
              onSelectVillage={(vid: number) => {
                setSelectedVillageId(vid);
                setActiveTab('village_dashboard');
              }}
              onSelectIncident={(incId: number) => {
                setSelectedIncidentId(incId);
                setActiveTab('incident_detail');
              }}
              onRefresh={() => loadVillageData(selectedVillageId)}
              showToast={showToast}
              districtName="Raisen"
            />
          )}
          {(activeTab === 'blackrock_login' || activeTab === 'blackrock_auth') && (
            <GovAuthPortal 
              onLoginSuccess={(tokenVal, roleVal, usernameVal, nameVal) => {
                const uRole = roleVal as UserRole;
                localStorage.setItem('token', tokenVal);
                localStorage.setItem('role', roleVal);
                localStorage.setItem('username', usernameVal);
                localStorage.setItem('fullName', nameVal);
                setToken(tokenVal);
                setRole(uRole);
                setUsername(usernameVal);
                setFullName(nameVal);
                setActiveTab(getInitialTabForRole(uRole));
                setAuthStatus('AUTHENTICATED');
                showToast(`Welcome back, ${nameVal}!`, 'success');
              }}
              onBackToHome={() => setActiveTab('command_center')}
            />
          )}
          {activeTab === 'portal_first_page' && (
            <PortalFirstPage onLoginClick={() => setShowLanding(false)} />
          )}
          {activeTab === 'esg_overview' && (
            <ESGOverview />
          )}

          {/* 16. WORKER PORTAL */}
          {activeTab === 'worker_portal' && (
            <TechnicianPortal
              tasks={workerTasks as any}
              technician={technicians.find((t: any) => t.user_id !== undefined) || null}
              workerName={fullName || username}
              onAcceptTask={handleWorkerAcceptTask}
              onRequestPriceIncrease={async (taskId, cost, workDoneText, whatWasWrongText, productEffectText) => {
                try {
                  const updatedTask = await api.requestPriceIncrease(taskId, cost, workDoneText, whatWasWrongText, productEffectText);
                  showToast('Scope revision submitted. Cost updated!', 'success');
                  const myT = await api.fetchMyTasks();
                  setWorkerTasks(myT as any);
                  loadVillageData(selectedVillageId);
                } catch (err: any) {
                  showToast(err.message || 'Failed to submit scope revision.', 'error');
                }
              }}
              onCompleteTask={handleWorkerCompleteTask}
              onRefresh={async () => {
                try {
                  const myT = await api.fetchMyTasks();
                  setWorkerTasks(myT as any);
                  loadVillageData(selectedVillageId);
                } catch (e) {}
              }}
              showToast={showToast}
            />
          )}



          {/* 17. CRISIS DESK */}
          {activeTab === 'crisis_intelligence' && (
            <CrisisIntelligence villageId={selectedVillageId} assets={assets} />
          )}

          {/* 18. CROSS VILLAGE ANALYTICS */}
          {activeTab === 'cross_analytics' && (
            <CentralGovernance onSelectVillage={setSelectedVillageId} selectedVillageId={selectedVillageId} villages={villages} incidents={incidents} tasks={allTasks} />
          )}

          {/* 19. PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200/90 p-6 sm:p-8 rounded-2xl shadow-xs max-w-xl mx-auto space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t('profile')}</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{t('official_notice')}</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-semibold text-xs sm:text-sm">Legal Full Name:</span>
                  <strong className="text-slate-900 font-bold">{fullName || t('greeting.welcome_back')}</strong>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-semibold text-xs sm:text-sm">User Identifier:</span>
                  <strong className="text-slate-900 font-mono font-bold">{username || 'N/A'}</strong>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-semibold text-xs sm:text-sm">Portal Access Authority:</span>
                  <strong className="text-blue-700 font-bold uppercase">{role === 'admin' ? t('role.admin') : role === 'district' ? t('role.district') : role === 'citizen' ? t('role.citizen') : t('role.worker')}</strong>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="text-emerald-700 font-semibold text-xs sm:text-sm">Account Status:</span>
                  <strong className="text-emerald-800 font-bold">✓ {t('system.operational')}</strong>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 font-semibold text-xs sm:text-sm">Assigned Gram Panchayat:</span>
                  <strong className="text-slate-900 font-bold">{villages.find(v => v.id === selectedVillageId)?.name || 'Piparli'} Panchayat (#{selectedVillageId})</strong>
                </div>
              </div>
            </div>
          )}
          </Suspense>
        </div>

        {/* Government Footer */}
        <GovFooter role={role} onNavigate={(tab) => setActiveTab(tab as Tab)} />

      </main>
    </div>

    {/* Global Command Palette (Ctrl + K) */}
    <CommandPalette
      isOpen={isCommandPaletteOpen}
      onClose={() => setIsCommandPaletteOpen(false)}
      onNavigate={(tab) => {
        setActiveTab(tab as Tab);
        setIsCommandPaletteOpen(false);
      }}
      currentRole={role}
      onLogout={handleLogout}
    />

    {/* Real-time Notification Center Drawer */}
    <NotificationCenter
      isOpen={isNotificationDrawerOpen}
      onClose={() => setIsNotificationDrawerOpen(false)}
      onNavigateTab={(tab) => {
        setActiveTab(tab as Tab);
        setIsNotificationDrawerOpen(false);
      }}
      incidents={incidents}
    />
    </>
    </ErrorBoundary>
  );
}

