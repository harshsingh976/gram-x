import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'vendor-maps';
          }
          // Citizen-only portal code
          if (
            id.includes('/components/CitizenExperience') ||
            id.includes('/components/CitizenPortal') ||
            id.includes('/components/ComplaintOnboarding') ||
            id.includes('/components/landings/CitizenLanding')
          ) {
            return 'portal-citizen';
          }
          // Worker-only portal code
          if (
            id.includes('/components/TechnicianPortal') ||
            id.includes('/components/landings/WorkerLanding')
          ) {
            return 'portal-worker';
          }
          // Admin portal code
          if (
            id.includes('/components/AdminPortal') ||
            id.includes('/components/CentralGovernance') ||
            id.includes('/components/landings/AdminLanding')
          ) {
            return 'portal-admin';
          }
          // Collector/District portal code
          if (
            id.includes('/components/CollectorPortal') ||
            id.includes('/components/landings/CollectorLanding')
          ) {
            return 'portal-collector';
          }
          // 3D / Digital Twin heavy visualisation code
          if (
            id.includes('/components/DigitalTwinViewer') ||
            id.includes('/components/Landing3DScene')
          ) {
            return 'chunk-3d';
          }
          // Analytics / intelligence modules
          if (
            id.includes('/components/GroundReality') ||
            id.includes('/components/ProblemIntel') ||
            id.includes('/components/PredictionFuture') ||
            id.includes('/components/MoneyBudget') ||
            id.includes('/components/ResourceIntel') ||
            id.includes('/components/AssetIntel') ||
            id.includes('/components/ProjectIntel') ||
            id.includes('/components/EquityIntel') ||
            id.includes('/components/AuditAccountability') ||
            id.includes('/components/CrisisIntelligence') ||
            id.includes('/components/DataIntelligence') ||
            id.includes('/components/ResponsibleAI')
          ) {
            return 'chunk-analytics';
          }
        }
      }
    }
  }
})

