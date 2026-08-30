import React, { useState } from 'react';
import {
  ChevronRight, ExternalLink, Home, Info, AlertTriangle,
  CheckCircle2, XCircle, X, ArrowRight, Globe, Phone, Shield
} from 'lucide-react';
import type { UserRole } from '../types';
import { useLanguage } from '../i18n';

// ─── Types ────────────────────────────────────────────────
type Tab = string;

// ─── 1. ANNOUNCEMENT TICKER ────────────────────────────────
const DEFAULT_NOTICES = [
  '📢 सूचना / NOTICE — GRAM-X Digital Governance Platform is live across all Gram Panchayats.',
  '🔧 Field technicians: Ensure all completed work orders are submitted with evidence for GP fund disbursement.',
  '💧 जल जीवन मिशन — Citizens can track water infrastructure repair status online.',
  '📋 All infrastructure complaints are SLA-tracked and audited. Response time: 48 hours.',
  '🇮🇳 National Jal Jeevan Mission — हर घर जल | Digital Rural Governance Initiative.',
];

export function AnnouncementTicker({
  notices = DEFAULT_NOTICES,
}: {
  notices?: string[];
}) {
  const items = notices.length > 0 ? notices : DEFAULT_NOTICES;
  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="gov-ticker-bar" role="marquee" aria-label="Government announcements">
      <div className="gov-ticker-label" aria-hidden="true">
        <span>📢</span>
        <span>सूचना</span>
      </div>
      <div className="gov-ticker-track">
        <div className="gov-ticker-content">
          {doubled.map((msg, i) => (
            <span key={i} className="gov-ticker-item">{msg}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 2. GOVERNMENT INFO BAR ────────────────────────────────
export function GovernmentInfoBar({
  onHelpline,
}: {
  onHelpline?: () => void;
}) {
  return (
    <div className="gov-info-bar">
      <div className="gov-info-left">
        <span className="gov-info-item gov-info-primary">Government of India</span>
        <span className="gov-info-sep" aria-hidden="true">|</span>
        <span className="gov-info-item">Digital Governance</span>
        <span className="gov-info-sep" aria-hidden="true">|</span>
        <span className="gov-info-item">Rural Infrastructure</span>
        <span className="gov-info-sep gov-info-sep-mobile-hide" aria-hidden="true">|</span>
        <span className="gov-info-item gov-info-mobile-hide">Panchayati Raj Department</span>
      </div>
      <div className="gov-info-right">
        <span className="gov-info-item gov-info-mobile-hide">
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span className="gov-info-sep gov-info-mobile-hide" aria-hidden="true">•</span>
        <button
          className="gov-info-helpline"
          onClick={onHelpline}
          aria-label="Helpline number 1800-212-GRAMX"
        >
          <Phone size={10} aria-hidden="true" />
          1800-212-GRAMX
        </button>
        <span className="gov-info-sep" aria-hidden="true">•</span>
        <span className="gov-info-status">
          <span className="gov-info-dot" aria-hidden="true" />
          ONLINE
        </span>
      </div>
    </div>
  );
}

// ─── 3. BREADCRUMB ─────────────────────────────────────────
type BreadcrumbItem = { label: string; tab?: Tab };

const BREADCRUMB_MAP: Record<string, BreadcrumbItem[]> = {
  village_dashboard:     [{ label: 'Home', tab: 'village_dashboard' }, { label: 'District Governance', tab: 'village_dashboard' }, { label: 'Village Dashboard' }],
  ground_reality:        [{ label: 'Home', tab: 'village_dashboard' }, { label: 'District Governance' }, { label: 'Alert Registry' }],
  gis_map:               [{ label: 'Home', tab: 'village_dashboard' }, { label: 'District Governance' }, { label: 'GIS Operations Map' }],
  incidents:             [{ label: 'Home', tab: 'village_dashboard' }, { label: 'District Governance' }, { label: 'Problem Diagnosis' }],
  prediction_future:     [{ label: 'Home', tab: 'village_dashboard' }, { label: 'District Governance' }, { label: 'Smart Dispatch Desk' }],
  money_budget:          [{ label: 'Home', tab: 'village_dashboard' }, { label: 'Budget & Treasury' }],
  asset_intel:           [{ label: 'Home', tab: 'village_dashboard' }, { label: 'District Governance' }, { label: 'Asset Intelligence' }],
  resource_opt:          [{ label: 'Home', tab: 'village_dashboard' }, { label: 'District Governance' }, { label: 'Resource Intelligence' }],
  project_intel:         [{ label: 'Home', tab: 'village_dashboard' }, { label: 'District Governance' }, { label: 'Project Verification' }],
  data_intelligence:     [{ label: 'Home', tab: 'village_dashboard' }, { label: 'District Governance' }, { label: 'Data Quality' }],
  responsible_ai:        [{ label: 'Home', tab: 'village_dashboard' }, { label: 'District Governance' }, { label: 'Responsible AI' }],
  crisis_intelligence:   [{ label: 'Home', tab: 'village_dashboard' }, { label: 'Crisis Command' }],
  citizen_portal:        [{ label: 'Home', tab: 'citizen_portal' }, { label: 'Citizen Services' }],
  worker_portal:         [{ label: 'Home', tab: 'worker_portal' }, { label: 'Field Operations' }, { label: 'My Tasks' }],
  command_center:        [{ label: 'Home', tab: 'command_center' }, { label: 'District Command Centre' }],
  equity_intel:          [{ label: 'Home', tab: 'command_center' }, { label: 'Infrastructure Health' }],
  audit_accountability:  [{ label: 'Home', tab: 'command_center' }, { label: 'Budget Overview' }],
  cross_analytics:       [{ label: 'Home', tab: 'command_center' }, { label: 'Cross-Village Analytics' }],
  profile:               [{ label: 'Home' }, { label: 'My Profile' }],
};

export function Breadcrumb({
  activeTab,
  onNavigate,
}: {
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
}) {
  const items = BREADCRUMB_MAP[activeTab];
  if (!items || items.length <= 1) return null;

  return (
    <nav className="gov-breadcrumb" aria-label="Breadcrumb navigation">
      <ol className="gov-breadcrumb-list">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="gov-breadcrumb-item">
              {!isLast && item.tab ? (
                <button
                  className="gov-breadcrumb-link"
                  onClick={() => onNavigate(item.tab!)}
                  aria-label={`Navigate to ${item.label}`}
                >
                  {idx === 0 && <Home size={11} aria-hidden="true" />}
                  {item.label}
                </button>
              ) : isLast ? (
                <span className="gov-breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <span className="gov-breadcrumb-static">{item.label}</span>
              )}
              {!isLast && (
                <ChevronRight size={11} className="gov-breadcrumb-sep" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── 4. PAGE TITLE + EYEBROW ───────────────────────────────
const PAGE_TITLE_MAP: Record<string, { eyebrow: string; title: string; description?: string }> = {
  village_dashboard:    { eyebrow: 'DISTRICT GOVERNANCE', title: 'Village Dashboard', description: 'Monitor infrastructure, services and field operations across the Panchayat.' },
  ground_reality:       { eyebrow: 'OPERATIONS', title: 'Alert Registry', description: 'Live view of active infrastructure problems requiring immediate attention.' },
  gis_map:              { eyebrow: 'SPATIAL INTELLIGENCE', title: 'GIS Operations Map', description: 'Geographic overview of assets, incidents and field teams.' },
  incidents:            { eyebrow: 'PROBLEM DIAGNOSIS', title: 'Incident Management', description: 'Analyse, prioritise and resolve infrastructure failures with AI-assisted diagnosis.' },
  prediction_future:    { eyebrow: 'DISPATCH', title: 'Smart Dispatch Desk', description: 'Assign field technicians to active complaints and optimise response time.' },
  money_budget:         { eyebrow: 'FINANCE', title: 'Budget & Treasury', description: 'GP fund allocation, expenditure tracking and payout disbursements.' },
  asset_intel:          { eyebrow: 'INFRASTRUCTURE', title: 'Asset Intelligence', description: 'Health monitoring, sensor telemetry and maintenance history for all village assets.' },
  resource_opt:         { eyebrow: 'RESOURCES', title: 'Resource Intelligence', description: 'Reuse, renovation and optimisation recommendations for public infrastructure.' },
  project_intel:        { eyebrow: 'PROJECTS', title: 'Project Verification', description: 'Track physical and functional progress of ongoing development projects.' },
  data_intelligence:    { eyebrow: 'DATA QUALITY', title: 'Command Centre', description: 'Data completeness, anomaly detection and audit trail oversight.' },
  responsible_ai:       { eyebrow: 'GOVERNANCE', title: 'Responsible AI', description: 'Fairness, transparency and accountability of AI-assisted decisions.' },
  crisis_intelligence:  { eyebrow: 'CRISIS COMMAND', title: 'Emergency Operations', description: 'Multi-agency crisis coordination for critical infrastructure failures.' },
  citizen_portal:       { eyebrow: 'CITIZEN SERVICES', title: 'My Services', description: 'Report issues, track complaints and verify repair completion.' },
  worker_portal:        { eyebrow: 'FIELD OPERATIONS', title: 'My Assigned Tasks', description: 'Manage active work orders and submit completion evidence.' },
  command_center:       { eyebrow: 'DISTRICT COMMAND', title: 'Command Centre', description: 'District-level oversight of all Panchayat infrastructure and services.' },
  equity_intel:         { eyebrow: 'INFRASTRUCTURE', title: 'Health Overview', description: 'Asset reliability and service equity across the district.' },
  audit_accountability: { eyebrow: 'ACCOUNTABILITY', title: 'Budget Overview', description: 'Consolidated budget, expenditure and fund utilisation summary.' },
  cross_analytics:      { eyebrow: 'ANALYTICS', title: 'Cross-Village Comparison', description: 'Compare infrastructure performance and service delivery across villages.' },
  profile:              { eyebrow: 'ACCOUNT', title: 'My Profile', description: 'Authenticated session details and access credentials.' },
};

export function PageTitle({ activeTab }: { activeTab: Tab }) {
  const info = PAGE_TITLE_MAP[activeTab];
  if (!info) return null;
  return (
    <div className="gov-page-title">
      <span className="gov-page-eyebrow">{info.eyebrow}</span>
      <h1 className="gov-page-h1">{info.title}</h1>
      {info.description && (
        <p className="gov-page-desc">{info.description}</p>
      )}
    </div>
  );
}

// ─── 5. GOVERNMENT NOTICE ──────────────────────────────────
type NoticeType = 'info' | 'warning' | 'success' | 'critical';

interface GovNoticeProps {
  type: NoticeType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const NOTICE_CONFIG: Record<NoticeType, { icon: React.ReactNode; className: string }> = {
  info:     { icon: <Info size={15} aria-hidden="true" />,           className: 'gov-notice-info' },
  warning:  { icon: <AlertTriangle size={15} aria-hidden="true" />,  className: 'gov-notice-warning' },
  success:  { icon: <CheckCircle2 size={15} aria-hidden="true" />,   className: 'gov-notice-success' },
  critical: { icon: <XCircle size={15} aria-hidden="true" />,        className: 'gov-notice-critical' },
};

export function GovNotice({ type, title, message, actionLabel, onAction, dismissible, onDismiss }: GovNoticeProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const cfg = NOTICE_CONFIG[type];
  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`gov-notice ${cfg.className}`} role="alert" aria-live="polite">
      <div className="gov-notice-icon">{cfg.icon}</div>
      <div className="gov-notice-body">
        <div className="gov-notice-title">{title}</div>
        <div className="gov-notice-message">{message}</div>
        {actionLabel && onAction && (
          <button className="gov-notice-action" onClick={onAction}>
            {actionLabel}
            <ArrowRight size={12} className="gov-arrow-icon" aria-hidden="true" />
          </button>
        )}
      </div>
      {dismissible && (
        <button
          className="gov-notice-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss this notice"
        >
          <X size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// ─── 6. QUICK LINKS (Role-specific, internal) ──────────────
interface QuickLink {
  label: string;
  tab: Tab;
  icon: string;
}

const QUICK_LINKS: Partial<Record<UserRole, QuickLink[]>> = {
  citizen: [
    { label: 'Dashboard',      tab: 'citizen_portal',  icon: '🏠' },
    { label: 'My Complaints',  tab: 'citizen_portal',  icon: '📋' },
    { label: 'Track Repair',   tab: 'citizen_portal',  icon: '🔍' },
    { label: 'Profile',        tab: 'profile',         icon: '👤' },
  ],
  worker: [
    { label: 'My Tasks',       tab: 'worker_portal',   icon: '🔧' },
    { label: 'Profile',        tab: 'profile',         icon: '👤' },
  ],
  admin: [
    { label: 'Dashboard',      tab: 'village_dashboard', icon: '🏠' },
    { label: 'Complaints',     tab: 'incidents',          icon: '📋' },
    { label: 'GIS Map',        tab: 'gis_map',            icon: '🗺️' },
    { label: 'Budget',         tab: 'money_budget',       icon: '💰' },
    { label: 'Dispatch',       tab: 'prediction_future',  icon: '🚀' },
    { label: 'Projects',       tab: 'project_intel',      icon: '🏗️' },
  ],
  district: [
    { label: 'Command',        tab: 'command_center',      icon: '🏗️' },
    { label: 'Overview',       tab: 'village_dashboard',   icon: '📊' },
    { label: 'Crisis',         tab: 'crisis_intelligence', icon: '🚨' },
    { label: 'Analytics',      tab: 'cross_analytics',     icon: '📈' },
    { label: 'Profile',        tab: 'profile',             icon: '👤' },
  ],
  super_admin: [
    { label: 'Dashboard',      tab: 'village_dashboard',   icon: '🏠' },
    { label: 'Analytics',      tab: 'cross_analytics',     icon: '📈' },
    { label: 'Profile',        tab: 'profile',             icon: '👤' },
  ],
};

const EXTERNAL_LINKS = [
  { label: 'India.gov.in',     href: 'https://india.gov.in',          title: 'National Portal of India' },
  { label: 'Digital India',    href: 'https://digitalindia.gov.in',   title: 'Digital India Programme' },
  { label: 'MyGov',            href: 'https://www.mygov.in',          title: 'Citizen Engagement Platform' },
  { label: 'PM India',         href: 'https://www.pmindia.gov.in',    title: 'Prime Minister\'s Office' },
];

export function SidebarQuickLinks({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate: (tab: Tab) => void;
}) {
  const links = QUICK_LINKS[role] || [];

  return (
    <div className="gov-quicklinks">
      <div className="gov-quicklinks-title">Quick Links</div>
      <div className="gov-quicklinks-grid">
        {links.map(link => (
          <button
            key={link.tab + link.label}
            className="gov-quicklink-btn"
            onClick={() => onNavigate(link.tab)}
            aria-label={`Go to ${link.label}`}
          >
            <span className="gov-quicklink-icon" aria-hidden="true">{link.icon}</span>
            <span className="gov-quicklink-label">{link.label}</span>
          </button>
        ))}
      </div>

      <div className="gov-ext-links">
        <div className="gov-ext-links-title">
          <Globe size={10} aria-hidden="true" />
          Official Links
        </div>
        {EXTERNAL_LINKS.map(link => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="gov-ext-link"
            title={link.title}
            aria-label={`${link.label} — opens in new tab`}
          >
            {link.label}
            <ExternalLink size={10} className="gov-ext-icon" aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── 7. FOOTER ─────────────────────────────────────────────
export function GovFooter({
  onNavigate,
  role,
}: {
  onNavigate: (tab: Tab) => void;
  role: UserRole;
}) {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  const footerLinks: Array<{ label: string; tab: Tab }> = role === 'citizen'
    ? [
        { label: t('nav.citizen_portal'), tab: 'citizen_portal' },
        { label: t('profile'),            tab: 'profile' },
      ]
    : role === 'worker'
    ? [
        { label: t('nav.my_tasks'), tab: 'worker_portal' },
        { label: t('profile'),      tab: 'profile' },
      ]
    : role === 'district'
    ? [
        { label: t('nav.dashboard'),                 tab: 'command_center' },
        { label: t('collector.district_overview'),  tab: 'village_dashboard' },
        { label: t('profile'),                      tab: 'profile' },
      ]
    : [
        { label: t('nav.dashboard'),       tab: 'village_dashboard' },
        { label: t('nav.incidents'),       tab: 'incidents' },
        { label: t('nav.budget_treasury'), tab: 'money_budget' },
        { label: t('profile'),             tab: 'profile' },
      ];

  return (
    <footer className="gov-footer">
      {/* Tricolour accent */}
      <div className="gov-footer-tricolour" aria-hidden="true">
        <div style={{ background: '#FF9933' }} />
        <div style={{ background: '#ffffff' }} />
        <div style={{ background: '#138808' }} />
      </div>

      <div className="gov-footer-inner">
        {/* Brand */}
        <div className="gov-footer-brand">
          <div className="gov-footer-logo">
            <span aria-hidden="true">🇮🇳</span>
            <strong>GRAM-X</strong>
          </div>
          <p className="gov-footer-tagline">
            Grassroots Resource, Action &amp; Intelligence Network<br />
            Digital Rural Governance Platform
          </p>
        </div>

        {/* Internal links */}
        <div className="gov-footer-section">
          <div className="gov-footer-section-title">Quick Links</div>
          {footerLinks.map(lnk => (
            <button
              key={lnk.tab}
              className="gov-footer-link"
              onClick={() => onNavigate(lnk.tab)}
            >
              {lnk.label}
            </button>
          ))}
        </div>

        {/* External links */}
        <div className="gov-footer-section">
          <div className="gov-footer-section-title">Official Resources</div>
          {EXTERNAL_LINKS.slice(0, 3).map(lnk => (
            <a
              key={lnk.href}
              href={lnk.href}
              target="_blank"
              rel="noopener noreferrer"
              className="gov-footer-ext-link"
              title={lnk.title}
              aria-label={`${lnk.label} — opens in new tab`}
            >
              {lnk.label}
              <ExternalLink size={10} className="gov-ext-icon" aria-hidden="true" />
            </a>
          ))}
        </div>

        {/* Legal */}
        <div className="gov-footer-section">
          <div className="gov-footer-section-title">Compliance</div>
          <span className="gov-footer-legal-item">Privacy Policy</span>
          <span className="gov-footer-legal-item">Accessibility</span>
          <span className="gov-footer-legal-item">Terms of Use</span>
        </div>
      </div>

      <div className="gov-footer-bottom">
        <Shield size={11} aria-hidden="true" />
        <span>© {year} GRAM-X — Digital Governance Platform</span>
        <span className="gov-footer-nic">
          Ref: National Informatics Centre — MeitY, Government of India
        </span>
      </div>
    </footer>
  );
}
