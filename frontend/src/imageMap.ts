// ─── GRAM-X CENTRALIZED IMAGE MAP ───────────────────────────────────────────
// Single source of truth for all portal images.
// Update image paths here to change images across the entire application.
// ─────────────────────────────────────────────────────────────────────────────

import citizenHeroImg   from './assets/images/citizen/hero.jpg';
import workerHeroImg    from './assets/images/worker/hero.jpg';
import adminHeroImg     from './assets/images/admin/hero.jpg';
import collectorHeroImg from './assets/images/collector/hero.jpg';

import waterServiceImg       from './assets/images/common/water.jpg';
import roadServiceImg        from './assets/images/common/road.jpg';
import electricityServiceImg from './assets/images/common/electricity.jpg';
import sanitationServiceImg  from './assets/images/common/sanitation.jpg';

// ─── Semantic Image Map ───────────────────────────────────────────────────────
export const IMAGE_MAP = {
  citizenHero:   citizenHeroImg,
  workerHero:    workerHeroImg,
  adminHero:     adminHeroImg,
  collectorHero: collectorHeroImg,
  serviceWater:       waterServiceImg,
  serviceRoad:        roadServiceImg,
  serviceElectricity: electricityServiceImg,
  serviceSanitation:  sanitationServiceImg,
  serviceDrain:       sanitationServiceImg,
  serviceGeneral:     roadServiceImg,
} as const;

export function getServiceImage(category: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('water') || cat.includes('pump') || cat.includes('jal')) return IMAGE_MAP.serviceWater;
  if (cat.includes('road') || cat.includes('street') || cat.includes('path') || cat.includes('pothole')) return IMAGE_MAP.serviceRoad;
  if (cat.includes('electric') || cat.includes('power') || cat.includes('light')) return IMAGE_MAP.serviceElectricity;
  if (cat.includes('sanit') || cat.includes('toilet') || cat.includes('drain') || cat.includes('waste')) return IMAGE_MAP.serviceSanitation;
  return IMAGE_MAP.serviceRoad;
}

export function getPortalHero(role: string): string {
  switch (role) {
    case 'citizen': return IMAGE_MAP.citizenHero;
    case 'worker':  return IMAGE_MAP.workerHero;
    case 'admin':   return IMAGE_MAP.adminHero;
    case 'district':
    case 'collector': return IMAGE_MAP.collectorHero;
    default: return IMAGE_MAP.adminHero;
  }
}

export function getInitials(name: string): string {
  const parts = (name || 'U').trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0][0] || 'U').toUpperCase();
}

export function getRoleAvatarGradient(role: string): string {
  switch (role) {
    case 'citizen': return 'linear-gradient(135deg, #0284c7, #059669)';
    case 'worker':  return 'linear-gradient(135deg, #d97706, #ea580c)';
    case 'admin':   return 'linear-gradient(135deg, #0f172a, #1e40af)';
    case 'district':
    case 'collector': return 'linear-gradient(135deg, #1e1b4b, #4338ca)';
    default: return 'linear-gradient(135deg, #64748b, #94a3b8)';
  }
}
