export type PersonaRole = 'moderator' | 'petitioner' | 'resident' | 'council_member';

export type PersonaArchetype =
  | 'concerned_parent'
  | 'environmental_activist'
  | 'property_owner'
  | 'local_business_owner'
  | 'fiscal_conservative'
  | 'longtime_resident';

export interface Persona {
  id: string;
  name: string;
  role: PersonaRole;
  archetype?: PersonaArchetype;
  age?: number;
  occupation: string;
  background: string;
  speaking_style: string;
  primary_concern: string;
  secondary_concerns: string[];
  intensity: number;
  color: string;
}
