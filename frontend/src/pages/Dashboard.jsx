import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Users, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVendors({ limit: 100 }).then(d => { setVendors(d.distributors || []); setLoading(false); });
  }, []);

  const active   = vendors.filter(v => v.status === 'Active').length;
  const pending  = vendors.filter(v => v.status === 'Pending').length;
  const inactive = vendors.filter(v => v.status === 'Inactive').length;

  const stats = [
    { label: 'Total Vendors', value: vendors.length, icon: Users,        color: '#2563eb', bg: '#eff6ff', iconBg: '#dbeafe' },
    { label: 'Active',        value: active,          icon: CheckCircle,  color: '#16a34a', bg: '#f0fdf4', iconBg: '#dcfce7' },
    { label: 'Pending',       value: pending,         icon: Clock,        color: '#d97706', bg: '#fffbeb', iconBg: '#fef3c7' },
    { label: 'Inactive',      value: inactive,        icon: XCircle,      color: '#dc2626', bg: '#fef2f2', iconBg: '#fee2e2' },
  ];

  const categories = vendors.reduce((acc, d) => {
    (d.products || []).forEach(p => {
      if (p.category) acc[p.category] = (acc[p.category] || 0) + 1;
    });
    return acc;
  }, {});

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: '#1a1d23' }}>Dashboard</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Overview of your vendor ecosystem</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map(({ label, value, icon: Icon, color, bg, iconBg }) => (
          <div key={label} style={{
            background: '#fff', border: '1px solid #e2e6ed',
            borderRadius: 10, padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, color }}>
              {loading ? '–' : value}
            </div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div style={{ background: '#fff', border: '1px solid #e2e6ed', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#1a1d23' }}>
          <TrendingUp size={16} color="#2563eb" /> Vendors by Category
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Object.entries(categories).map(([cat, count]) => {
            const pct = vendors.length ? (count / vendors.length) * 100 : 0;
            return (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: '#374151' }}>
                  <span>{cat}</span>
                  <span style={{ color: '#6b7280' }}>{count} vendor{count !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                    borderRadius: 99, transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
