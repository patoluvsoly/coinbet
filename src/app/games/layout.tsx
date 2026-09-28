import { ComplianceGate } from '@/components/ComplianceGate';

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <ComplianceGate>{children}</ComplianceGate>;
}