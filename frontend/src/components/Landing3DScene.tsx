import React, { useState, useEffect, useRef, useMemo } from "react";
import { Box, Layers, Activity, Droplets, Zap, Compass, Shield, CheckCircle2, AlertCircle, X, ExternalLink } from "lucide-react";
import { useLanguage } from "../i18n";

export type PortalSceneRole = "citizen" | "worker" | "admin" | "collector";

interface Node3D {
  id: string;
  name: string;
  category: string;
  icon: string;
  x: number;
  y: number;
  z: number;
  status: "optimal" | "active" | "watch" | "critical";
  color: string;
  publicMetric: string;
  details: string;
}

interface Landing3DSceneProps {
  role: PortalSceneRole;
  height?: number | string;
  className?: string;
  onNodeSelect?: (node: Node3D) => void;
}

export default function Landing3DScene({
  role,
  height = 360,
  className = "",
  onNodeSelect,
}: Landing3DSceneProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node3D | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node3D | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Public-Safe 3D Nodes for each role
  const nodes: Node3D[] = useMemo(() => {
    switch (role) {
      case "citizen":
        return [
          {
            id: "cit-water-1",
            name: `${t("category.water")} #104`,
            category: t("category.water"),
            icon: "💧",
            x: -80,
            y: 0,
            z: -40,
            status: "optimal",
            color: "#0284c7",
            publicMetric: "99.2% Flow Uptime",
            details: "Jal Jeevan Mission Solar Powered Water Pumping Substation (Piparli GP).",
          },
          {
            id: "cit-road-1",
            name: `${t("category.roads")} #12`,
            category: t("category.roads"),
            icon: "🛣️",
            x: 60,
            y: 0,
            z: -30,
            status: "active",
            color: "#d97706",
            publicMetric: "48h SLA Active",
            details: "Village Main Link Road Surface Maintenance & Drainage Route.",
          },
          {
            id: "cit-power-1",
            name: `${t("category.power")} #88`,
            category: t("category.power"),
            icon: "⚡",
            x: -20,
            y: 0,
            z: 50,
            status: "optimal",
            color: "#16a34a",
            publicMetric: "24x7 Solar LED",
            details: "Panchayat Public Streetlight Grid & Automated Solar Controller.",
          },
          {
            id: "cit-hall-1",
            name: `${t("brand.title")} ${t("role.citizen")}`,
            category: t("brand.badge"),
            icon: "🏛️",
            x: 90,
            y: 0,
            z: 40,
            status: "optimal",
            color: "#4f46e5",
            publicMetric: "Public Desk Open",
            details: "Gram Panchayat Citizen Services & Grievance Lodgement Kiosk.",
          },
        ];

      case "worker":
        return [
          {
            id: "wrk-dispatch-1",
            name: `${t("worker.tab_active")} #WO-802`,
            category: t("nav.smart_dispatch"),
            icon: "🔧",
            x: -90,
            y: 0,
            z: -30,
            status: "active",
            color: "#ea580c",
            publicMetric: "SLA: 18h Left",
            details: "Submersible Pump Motor Coil Inspection & Overhaul Task.",
          },
          {
            id: "wrk-gps-1",
            name: `${t("nav.gps_navigation")} Waypoint`,
            category: t("nav.gps_navigation"),
            icon: "📍",
            x: 20,
            y: 0,
            z: -60,
            status: "optimal",
            color: "#0284c7",
            publicMetric: "2.4 km Route",
            details: "Optimized Multi-Stop Field Route Navigation Vector.",
          },
          {
            id: "wrk-proof-1",
            name: `${t("worker.upload_proof")}`,
            category: t("nav.audit_ledger"),
            icon: "📷",
            x: 80,
            y: 0,
            z: 20,
            status: "optimal",
            color: "#16a34a",
            publicMetric: "SHA-256 Verified",
            details: "Photographic Evidence Checkpoint & GPS EXIF Telemetry Validator.",
          },
          {
            id: "wrk-pay-1",
            name: `${t("nav.my_earnings")} Vault`,
            category: t("kpi.funds_disbursed"),
            icon: "💰",
            x: -30,
            y: 0,
            z: 60,
            status: "optimal",
            color: "#84cc16",
            publicMetric: "Instant Payout",
            details: "Automated Digital Payout Gateway with Gram Panchayat Escrow.",
          },
        ];

      case "admin":
        return [
          {
            id: "adm-piparli",
            name: "Piparli Panchayat Node",
            category: t("role.admin"),
            icon: "🏛️",
            x: -80,
            y: 0,
            z: -40,
            status: "optimal",
            color: "#2563eb",
            publicMetric: "96.4% SLA Score",
            details: "Integrated Local Governance Stream & Citizen Grievance Desk.",
          },
          {
            id: "adm-ramnagar",
            name: "Ramnagar Node",
            category: t("role.admin"),
            icon: "🏘️",
            x: 70,
            y: 0,
            z: -50,
            status: "watch",
            color: "#eab308",
            publicMetric: "3 Requests Pending",
            details: "Active Technician Dispatch & Scope Review Monitoring.",
          },
          {
            id: "adm-dispatch",
            name: `${t("admin.dispatch_desk")}`,
            category: t("nav.smart_dispatch"),
            icon: "🤖",
            x: -10,
            y: 0,
            z: 20,
            status: "optimal",
            color: "#059669",
            publicMetric: "AI Triage Active",
            details: "Autonomous Skill-Matching & Workload Load Balancing Engine.",
          },
          {
            id: "adm-audit",
            name: `${t("nav.audit_ledger")}`,
            category: t("nav.audit_ledger"),
            icon: "🔐",
            x: 60,
            y: 0,
            z: 60,
            status: "optimal",
            color: "#7c3aed",
            publicMetric: "100% Chain Intact",
            details: "SHA-256 Tamper-Evident State Machine Audit Chain.",
          },
        ];

      case "collector":
        return [
          {
            id: "col-raisen-grid",
            name: "Raisen District Macro Mesh",
            category: t("role.district"),
            icon: "🌏",
            x: 0,
            y: 0,
            z: -60,
            status: "optimal",
            color: "#4f46e5",
            publicMetric: "5 Panchayats Live",
            details: "Unified Multi-Panchayat Asset & Grievance Telemetry Network.",
          },
          {
            id: "col-hydraulic",
            name: `${t("collector.digital_twin_title")}`,
            category: t("category.water"),
            icon: "💧",
            x: -90,
            y: 0,
            z: 20,
            status: "optimal",
            color: "#0284c7",
            publicMetric: "4.2 Bar Mean",
            details: "EPANET Physics-Informed Digital Twin Hydraulic Surge Simulator.",
          },
          {
            id: "col-clusters",
            name: `${t("collector.recurring_clusters_title")}`,
            category: t("nav.problem_intel"),
            icon: "📈",
            x: 80,
            y: 0,
            z: -10,
            status: "watch",
            color: "#f59e0b",
            publicMetric: "Low Risk Cluster",
            details: "Spatial DBSCAN Recurring Problem Cluster Identification Engine.",
          },
          {
            id: "col-directive",
            name: `${t("collector.issue_directive_btn")}`,
            category: t("role.district_desc"),
            icon: "📝",
            x: 10,
            y: 0,
            z: 60,
            status: "optimal",
            color: "#10b981",
            publicMetric: "Executive Relay",
            details: "Binding Administrative Directive Dispatch to Panchayat Secretaries.",
          },
        ];
    }
  }, [role, t]);

  // Viewport intersection observer to save CPU/GPU when scrolled away
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.1 });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Mouse Parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setMouseOffset({ x, y });
  };

  // Interactive 3D Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let angle = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2 + mouseOffset.x;
      const cy = h / 2 + mouseOffset.y;

      // Draw 3D Isometric Grid Plate
      const gridSize = 7;
      const step = 28;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
      ctx.lineWidth = 1;

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

      // Draw Flowing Connections Between Nodes
      ctx.lineWidth = 2;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const x1 = cx + n1.x * 1.8;
          const y1 = cy + n1.z * 1.2;
          const x2 = cx + n2.x * 1.8;
          const y2 = cy + n2.z * 1.2;

          ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Flowing Energy Packet Animation
          const progress = ((angle * 0.8 + (i + j) * 0.3) % 1);
          const px = x1 + (x2 - x1) * progress;
          const py = y1 + (y2 - y1) * progress;

          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render 3D Pillars & Nodes
      nodes.forEach((n) => {
        const sx = cx + n.x * 1.8;
        const sy = cy + n.z * 1.2;
        const isHovered = hoveredNode?.id === n.id;
        const isSelected = selectedNode?.id === n.id;

        // Ground Ripple Aura
        const pulse = Math.sin(angle * 2 + n.x) * 3;
        ctx.strokeStyle = isSelected ? "#38bdf8" : (isHovered ? "#60a5fa" : n.color);
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 18 + pulse, 10 + pulse * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 3D Pillar Body
        const pillarHeight = isHovered || isSelected ? 36 : 28;
        const baseWidth = 14;

        // Pillar Side Shading
        const grad = ctx.createLinearGradient(sx - baseWidth, sy, sx + baseWidth, sy);
        grad.addColorStop(0, "rgba(15, 23, 42, 0.85)");
        grad.addColorStop(0.5, n.color);
        grad.addColorStop(1, "rgba(15, 23, 42, 0.95)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(sx - baseWidth, sy);
        ctx.lineTo(sx - baseWidth, sy - pillarHeight);
        ctx.lineTo(sx + baseWidth, sy - pillarHeight);
        ctx.lineTo(sx + baseWidth, sy);
        ctx.closePath();
        ctx.fill();

        // Pillar Top Cap
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.ellipse(sx, sy - pillarHeight, baseWidth, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Icon Bubble Floating on Top
        const floatY = sy - pillarHeight - 14 + Math.sin(angle * 3 + n.z) * 3;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(sx, floatY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Emoji Label
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.icon, sx, floatY + 1);

        // Node Title Tag (HTML-safe text)
        ctx.font = "bold 10px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#0f172a";
        ctx.fillText(n.name, sx, sy + 18);
      });

      angle += 0.03;
      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [nodes, isVisible, mouseOffset, hoveredNode, selectedNode]);

  // Click on Canvas to Select Node
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cx = canvas.width / 2 + mouseOffset.x;
    const cy = canvas.height / 2 + mouseOffset.y;

    // Find closest node
    let closest: Node3D | null = null;
    let minDist = 35;

    nodes.forEach(n => {
      const sx = cx + n.x * 1.8;
      const sy = cy + n.z * 1.2 - 20;
      const dist = Math.hypot(clickX - sx, clickY - sy);
      if (dist < minDist) {
        minDist = dist;
        closest = n;
      }
    });

    setSelectedNode(closest);
    if (closest && onNodeSelect) onNodeSelect(closest);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-md ${className}`}
      style={{
        height,
        background: "radial-gradient(ellipse at 50% 30%, #f8fafc 0%, #edf2f7 100%)",
      }}
    >
      {/* Top 3D Header Bar */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/90 border border-slate-200 shadow-sm backdrop-blur-sm text-[10px] font-bold text-slate-700 uppercase tracking-wider">
          <Activity size={12} className="text-emerald-500 animate-pulse" />
          <span>Interactive 3D Digital Twin • {role.toUpperCase()}</span>
        </div>
        <span className="text-[10px] font-semibold text-slate-400">Click nodes for public telemetry</span>
      </div>

      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        width={720}
        height={typeof height === "number" ? height : 360}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-pointer"
        style={{ display: "block" }}
      />

      {/* Selected Node Telemetry Modal (Public Safe) */}
      {selectedNode && (
        <div
          role="dialog"
          aria-label="Node telemetry"
          className="absolute bottom-4 left-4 right-4 max-w-sm bg-white/95 border border-slate-200/90 rounded-xl p-4 shadow-xl backdrop-blur-md z-20 transition-all anim-fade-up"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 bg-slate-100 rounded-lg">{selectedNode.icon}</span>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">{selectedNode.name}</h4>
                <span className="text-[10px] font-semibold text-slate-500">{selectedNode.category}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
              aria-label="Close telemetry view"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed">{selectedNode.details}</p>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[10px] font-bold">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ● {selectedNode.publicMetric}
            </span>
            <span className="text-slate-400">Public Telemetry Verified</span>
          </div>
        </div>
      )}
    </div>
  );
}
