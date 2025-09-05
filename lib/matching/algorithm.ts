interface Project {
  id: string;
  city: string;
  state: string;
  zip: string;
  peril: string;
  incident_at: string;
  preferred_date: string;
}

interface Contractor {
  id: string;
  user_id: string;
  company_name: string;
  service_areas: string[];
  trades: string[];
  capacity: string;
  calendly_url?: string;
}

interface ScoredContractor extends Contractor {
  score: number;
  reasons: string[];
}

export function scoreContractors(
  project: Project,
  contractors: Contractor[]
): ScoredContractor[] {
  return contractors
    .filter(contractor => contractor.capacity === 'active')
    .map(contractor => {
      let score = 0;
      const reasons: string[] = [];

      // Base availability score
      score += 10;
      reasons.push('Available');

      // Trade specialization scoring
      const perilTradeMap: Record<string, string[]> = {
        flood: ['water_mitigation', 'rebuild'],
        water: ['water_mitigation', 'mold'],
        wind: ['rebuild', 'roofing'],
        fire: ['rebuild', 'smoke_restoration'],
        mold: ['mold', 'water_mitigation'],
        other: ['rebuild'],
      };

      const relevantTrades = perilTradeMap[project.peril] || ['rebuild'];
      const hasRelevantTrade = contractor.trades.some(trade => 
        relevantTrades.includes(trade)
      );

      if (hasRelevantTrade) {
        score += 25;
        reasons.push('Specialized in ' + project.peril + ' damage');
      }

      // Geographic proximity scoring
      const contractorAreas = contractor.service_areas.map(area => area.toLowerCase());
      
      if (contractorAreas.includes(project.zip)) {
        score += 30;
        reasons.push('Serves your ZIP code');
      } else if (contractorAreas.includes(project.city.toLowerCase())) {
        score += 25;
        reasons.push('Serves your city');
      } else if (contractorAreas.includes(project.state.toLowerCase())) {
        score += 15;
        reasons.push('Serves your state');
      }

      // Urgency bonus for recent incidents
      const incidentDate = new Date(project.incident_at);
      const daysSinceIncident = Math.floor(
        (Date.now() - incidentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceIncident <= 1) {
        score += 10;
        reasons.push('Emergency response available');
      } else if (daysSinceIncident <= 3) {
        score += 5;
        reasons.push('Quick response available');
      }

      // Scheduling compatibility
      const preferredDate = new Date(project.preferred_date);
      const daysUntilPreferred = Math.floor(
        (preferredDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilPreferred >= 1 && daysUntilPreferred <= 7) {
        score += 5;
        reasons.push('Available for preferred date');
      }

      // Online scheduling bonus
      if (contractor.calendly_url) {
        score += 5;
        reasons.push('Online scheduling available');
      }

      return {
        ...contractor,
        score,
        reasons,
      };
    })
    .filter(contractor => contractor.score > 0) // Accept any contractor with positive score
    .sort((a, b) => b.score - a.score);
}

export function selectTopContractors(
  scoredContractors: ScoredContractor[],
  maxCount: number = 3
): ScoredContractor[] {
  return scoredContractors.slice(0, maxCount);
}