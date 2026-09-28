import { ComplianceGate } from '@/components/ComplianceGate';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <main>
      <ComplianceGate>
        <ConnectButton />
      </ComplianceGate>
    </main>
  );
}