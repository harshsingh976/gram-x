import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React framework — always tiny, loaded for all roles
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Lucide icons — shared UI library
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-ui';
          }
          // Leaflet map (only admin/collector use the map heavily)
          if (id.includes('node_modules') && (id.includes('leaflet') || id.includes('react-leaflet'))) {
            return 'vendor-maps';
          }
          // Recharts and charting math
          if (id.includes('node_modules') && (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor') || id.includes('decimal.js'))) {
            return 'vendor-charts';
          }
          // Citizen-only portal code
          if (
            id.includes('CitizenExperience') ||
            id.includes('CitizenPortal') ||
            id.includes('ComplaintOnboarding') ||
            id.includes('CitizenLanding')
          ) {
            return 'portal-citizen';
          }
          // Worker-only portal code
          if (
            id.includes('TechnicianPortal') ||
            id.includes('WorkerLanding')
          ) {
            return 'portal-worker';
          }
          // Admin portal code
          if (
            id.includes('AdminPortal') ||
            id.includes('CentralGovernance') ||
            id.includes('AdminLanding')
          ) {
            return 'portal-admin';
          }
          // Collector/District portal code
          if (
            id.includes('CollectorPortal') ||
            id.includes('CollectorLanding')
          ) {
            return 'portal-collector';
          }
          // 3D / Digital Twin heavy visualisation code
          if (
            id.includes('DigitalTwinViewer') ||
            id.includes('Landing3DScene')
          ) {
            return 'chunk-3d';
          }
          // Governance, AI & Audit Intelligence
          if (
            id.includes('AuditAccountability') ||
            id.includes('ResponsibleAI') ||
            id.includes('DataIntelligence') ||
            id.includes('ESGOverview')
          ) {
            return 'chunk-governance';
          }
          // Finance Treasury Budget
          if (id.includes('MoneyBudget')) {
            return 'chunk-finance';
          }
          // Assets, Resources & Projects
          if (
            id.includes('AssetIntel') ||
            id.includes('ResourceIntel') ||
            id.includes('ProjectIntel')
          ) {
            return 'chunk-assets';
          }
          // Predictions, GIS Reality & Crisis Command
          if (
            id.includes('PredictionFuture') ||
            id.includes('ProblemIntel') ||
            id.includes('CrisisIntelligence') ||
            id.includes('EquityIntel') ||
            id.includes('GroundReality')
          ) {
            return 'chunk-prediction-crisis';
          }
        }
      }
    }
  }
})

