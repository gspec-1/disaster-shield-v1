interface Project {
  id: string;
  city: string;
  state: string;
  zip: string;
  peril: string;
}

interface Contractor {
  id: string;
  company_name: string;
  service_areas: string[];
  trades: string[];
  capacity: string;
  calendly_url?: string;
}

interface ScoredContractor extends Contractor {
  score: number;
  reason: string;
}

export function rankContractors(
  project: Project,
  contractors: Contractor[],
  topN: number = 3
): ScoredContractor[] {
  const scored = contractors
    .filter(contractor => contractor.capacity === 'active')
    .map(contractor => {
      let score = 0;
      let reasons: string[] = [];

      // Capacity check (base requirement)
      if (contractor.capacity === 'active') {
        score += 10;
        reasons.push('Available');
      }

      // Trade fit
      const perilTradeMap: Record<string, string[]> = {
        flood: ['water_mitigation', 'rebuild'],
        water: ['water_mitigation', 'mold'],
        wind: ['rebuild', 'roofing'],
        fire: ['rebuild', 'smoke_restoration'],
        mold: ['mold', 'water_mitigation'],
        other: ['rebuild'],
      };

      const relevantTrades = perilTradeMap[project.peril] || ['rebuild'];
      const tradeMatch = contractor.trades.some(trade => 
        relevantTrades.includes(trade)
      );

      if (tradeMatch) {
        score += 20;
        reasons.push('Trade match');
      }

      // Geographic proximity
      const contractorAreas = contractor.service_areas.map(area => area.toLowerCase());
      
      // Exact ZIP match (highest priority)
      if (contractorAreas.includes(project.zip)) {
        score += 30;
        reasons.push('Serves your area');
      } else if (contractorAreas.includes(project.city.toLowerCase())) {
        score += 25;
        reasons.push('Serves your city');
      } else if (contractorAreas.includes(project.state.toLowerCase())) {
        score += 15;
        reasons.push('Serves your state');
      }

      // Calendly bonus
      if (contractor.calendly_url) {
        score += 5;
        reasons.push('Online scheduling');
      }

      return {
        ...contractor,
        score,
        reason: reasons.join(' • '),
      };
    })
    .filter(contractor => contractor.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored;
}