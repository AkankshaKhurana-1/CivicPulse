import { DependencyLink, Incident } from '../types';

export interface ChainNode {
  incident: Incident;
  depth: number;
  relationFromParent?: string;
  explanation?: string;
}

export function buildDependencyChain(
  rootIncidentId: string,
  allIncidents: Incident[],
  links: DependencyLink[]
): ChainNode[] {
  const root = allIncidents.find(i => i.id === rootIncidentId);
  if (!root) return [];

  const chain: ChainNode[] = [{ incident: root, depth: 0 }];
  const visited = new Set<string>([rootIncidentId]);

  function expandChildren(currentId: string, currentDepth: number) {
    const childLinks = links.filter(l => l.parent_incident_id === currentId);
    for (const link of childLinks) {
      if (visited.has(link.child_incident_id)) continue;
      visited.add(link.child_incident_id);

      const childIncident = allIncidents.find(i => i.id === link.child_incident_id);
      if (childIncident) {
        chain.push({
          incident: childIncident,
          depth: currentDepth + 1,
          relationFromParent: link.relation_type,
          explanation: link.explanation,
        });
        expandChildren(childIncident.id, currentDepth + 1);
      }
    }
  }

  expandChildren(rootIncidentId, 0);
  return chain;
}
