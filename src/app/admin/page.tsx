'use client';

import { useEffect, useState } from 'react';

type Record = {
  id: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
};

export default function AdminKycPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [records, setRecords] = useState<Record[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  async function loadRecords() {
    const res = await fetch('/api/admin/kyc');
    if (res.ok) setRecords((await res.json()).records);
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      loadRecords();
    } else {
      setLoginError((await res.json()).error ?? 'login failed');
    }
  }

  async function decide(id: string, decision: 'verified' | 'rejected') {
    await fetch(`/api/admin/kyc/${id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, note }),
    });
    setNote('');
    setSelectedId(null);
    loadRecords();
  }

  useEffect(() => {
    fetch('/api/admin/kyc').then((res) => {
      if (res.ok) {
        setAuthed(true);
        loadRecords();
      }
    });
  }, []);

  if (!authed) {
    return (
      <main style={{ padding: 40, maxWidth: 400 }}>
        <h1>Admin login</h1>
        <form onSubmit={login}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
          />
          <button type="submit">Log in</button>
        </form>
        {loginError && <p style={{ color: 'red' }}>{loginError}</p>}
      </main>
    );
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>KYC submissions</h1>
      <table cellPadding={8}>
        <thead>
          <tr><th>ID</th><th>Status</th><th>Submitted</th><th></th></tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>{r.id.slice(0, 8)}</td>
              <td>{r.status}</td>
              <td>{new Date(r.submittedAt).toLocaleString()}</td>
              <td><button onClick={() => setSelectedId(r.id)}>Review</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedId && (
        <div style={{ marginTop: 20, border: '1px solid #ccc', padding: 20 }}>
          <h2>Review {selectedId.slice(0, 8)}</h2>
          <div style={{ display: 'flex', gap: 16 }}>
            <img src={`/api/admin/kyc/${selectedId}/document/idFront`} width={200} alt="ID front" />
            <img src={`/api/admin/kyc/${selectedId}/document/idBack`} width={200} alt="ID back" />
            <img src={`/api/admin/kyc/${selectedId}/document/selfie`} width={200} alt="Selfie" />
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Review note (optional)"
            style={{ width: '100%', marginTop: 10 }}
          />
          <div style={{ marginTop: 10 }}>
            <button onClick={() => decide(selectedId, 'verified')}>Approve</button>{' '}
            <button onClick={() => decide(selectedId, 'rejected')}>Reject</button>
          </div>
        </div>
      )}
    </main>
  );
}