'use client';

import { useEffect, useState } from 'react';
import { isJurisdictionAllowed } from '@/config/jurisdictions';

type ComplianceState = { status: 'checking' | 'blocked' | 'needs_kyc' | 'clear' };

export function ComplianceGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ComplianceState>({ status: 'checking' });

  useEffect(() => {
    async function check() {
      const geoRes = await fetch('/api/compliance/geo').then((r) => r.json());
      if (!isJurisdictionAllowed(geoRes.countryCode)) {
        setState({ status: 'blocked' });
        return;
      }
      const kycRes = await fetch('/api/compliance/kyc-status').then((r) => r.json());
      if (kycRes.status !== 'verified') {
        setState({ status: 'needs_kyc' });
        return;
      }
      setState({ status: 'clear' });
    }
    check();
  }, []);

  if (state.status === 'checking') return <div>Checking eligibility…</div>;
  if (state.status === 'blocked') return <div>This service is not available in your region.</div>;
  if (state.status === 'needs_kyc') {
    return (
      <div>
        <p>Identity verification required before you can continue.</p>
        <a href="/kyc">Start verification</a>
      </div>
    );
  }
  return <>{children}</>;
}