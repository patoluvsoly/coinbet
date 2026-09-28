   export type JurisdictionRule = {
     countryCode: string;
     allowed: boolean;
     minAge: number;
     notes: string;
   };

   export const JURISDICTIONS: Record<string, JurisdictionRule> = {
     // TEMPORARY LOCAL TEST ENTRY — revert before any real user touches this.
     DEV_LOCAL: { countryCode: 'DEV_LOCAL', allowed: true, minAge: 18, notes: 'local dev bypass only' },

     US: { countryCode: 'US', allowed: false, minAge: 21, notes: 'Never serve — federal + state gambling law' },
   };

   export function isJurisdictionAllowed(countryCode: string): boolean {
     const rule = JURISDICTIONS[countryCode];
     return !!rule?.allowed;
   }