'use client';

import { useState } from 'react';

export default function KycPage() {
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!idFront || !idBack || !selfie) {
      setError('all three files are required');
      return;
    }
    setStatus('submitting');
    setError('');

    const formData = new FormData();
    formData.append('idFront', idFront);
    formData.append('idBack', idBack);
    formData.append('selfie', selfie);

    const res = await fetch('/api/kyc/submit', { method: 'POST', body: formData });
    if (res.ok) {
      setStatus('done');
    } else {
      const data = await res.json();
      setError(data.error ?? 'submission failed');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return <main style={{ padding: 40 }}>Submitted. An admin will review your documents shortly.</main>;
  }

  return (
    <main style={{ padding: 40, maxWidth: 400 }}>
      <h1>Identity verification</h1>
      <form onSubmit={submit}>
        <div>
          <label>ID front</label><br />
          <input type="file" accept="image/*" onChange={(e) => setIdFront(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <label>ID back</label><br />
          <input type="file" accept="image/*" onChange={(e) => setIdBack(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <label>Selfie</label><br />
          <input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] ?? null)} />
        </div>
        <button type="submit" disabled={status === 'submitting'} style={{ marginTop: 10 }}>
          {status === 'submitting' ? 'Submitting…' : 'Submit'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  );
}