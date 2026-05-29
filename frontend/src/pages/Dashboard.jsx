import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Users, CheckCircle, Clock, XCircle, TrendingUp, Package, DollarSign, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle.js';

function formatCurrency(val) {
  if (!val) return '$0';
  return '$' + parseFloat(val).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function BarChart({ data, colorFn, valueLabel }) {
  if (!data.length) return <div style={{ color:'#9ca3af', fontSize:13, padding:'16px 0' }}>No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {data.map(({ label, value, count }) => (
        <div key={label}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5, color:'#374151' }}>
            <span style={{ fontWeight:500 }}>{label}</span>
            <span style={{ color:'#6b7280' }}>
              {valueLabel === 'cost' ? formatCurrency(value) : value}
              {count !== undefined && <span style={{ marginLeft:6, color:'#9ca3af' }}>({count})</span>}
            </span>
          </div>
          <div style={{ height:8, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
            <div style={{
              height:'100%', width:`${(value/max)*100}%`,
              background: colorFn ? colorFn(label) : 'linear-gradient(90deg,#2563eb,#3b82f6)',
              borderRadius:99, transition:'width 0.6s ease',
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) return null;
  let offset = 0;
  const cx = size/2, cy = size/2, r = size*0.38, stroke = size*0.18;
  const circumference = 2 * Math.PI * r;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:20 }}>
      <svg width={size} height={size} style={{ flexShrink:0 }}>
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circumference}
              style={{ transition:'all 0.5s ease' }}
            />
          );
          offset += pct;
          return el;
        })}
        <text x={cx} y={cy+5} textAnchor="middle" fontSize={size*0.18} fontWeight={700} fill="#1a1d23">{total}</text>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display:'flex', alignItems:'center', gap:7, fontSize:13 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:seg.color, flexShrink:0 }}/>
            <span style={{ color:'#374151' }}>{seg.label}</span>
            <span style={{ color:'#9ca3af', marginLeft:'auto', paddingLeft:12 }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { title: pageTitle, subtitle: pageSubtitle } = usePageTitle('dashboard', { title: t('dashboard.title'), subtitle: t('dashboard.subtitle') });

  useEffect(() => {
    api.getVendors({ limit: 200 }).then(d => {
      setDistributors(d.distributors || []);
      setLoading(false);
    });
  }, []);

  const allProducts = distributors.flatMap(d => (d.products || []).map(p => ({ ...p, distributorName: d.name })));

  const active   = distributors.filter(v => v.status === 'Active').length;
  const pending  = distributors.filter(v => v.status === 'Pending').length;
  const inactive = distributors.filter(v => v.status === 'Inactive').length;
  const totalProducts = allProducts.length;
  const totalCost = allProducts.reduce((s, p) => s + (parseFloat(p.cost) || 0), 0);

  const stats = [
    { label: t('dashboard.totalDistributors'), value: distributors.length, icon: Users,        color:'#2563eb', bg:'#eff6ff' },
    { label: t('dashboard.activeDistributors'), value: active,              icon: CheckCircle,  color:'#16a34a', bg:'#f0fdf4' },
    { label: t('dashboard.pendingDistributors'), value: pending,            icon: Clock,        color:'#d97706', bg:'#fffbeb' },
    { label: t('dashboard.inactiveDistributors'), value: inactive,          icon: XCircle,      color:'#dc2626', bg:'#fef2f2' },
    { label: t('dashboard.totalProducts'),     value: totalProducts,        icon: Package,      color:'#7c3aed', bg:'#f5f3ff' },
    { label: t('dashboard.totalCost'),         value: formatCurrency(totalCost), icon: DollarSign, color:'#0891b2', bg:'#ecfeff', isText:true },
  ];

  // Cost by category
  const byCat = {};
  allProducts.forEach(p => {
    if (!p.category) return;
    byCat[p.category] = (byCat[p.category] || 0) + (parseFloat(p.cost) || 0);
  });
  const catData = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([label,value])=>({ label, value }));

  // Cost by distributor
  const byDist = {};
  distributors.forEach(d => {
    const cost = (d.products||[]).reduce((s,p)=>s+(parseFloat(p.cost)||0),0);
    if (cost > 0) byDist[d.name] = cost;
  });
  const distData = Object.entries(byDist).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,value])=>({ label, value }));

  // Products by category (count)
  const prodByCat = {};
  allProducts.forEach(p => { if (p.category) prodByCat[p.category] = (prodByCat[p.category]||0)+1; });
  const prodCatData = Object.entries(prodByCat).sort((a,b)=>b[1]-a[1]).map(([label,value])=>({ label, value }));

  // Status donut
  const statusSegments = [
    { label: t('dashboard.active'),   value:active,  color:'#22c55e' },
    { label: t('dashboard.pending'),  value:pending, color:'#f59e0b' },
    { label: t('dashboard.inactive'), value:inactive,color:'#94a3b8' },
  ].filter(s=>s.value>0);

  // Products per distributor
  const prodByDist = distributors.map(d=>({ label:d.name, value:d.products?.length||0 }))
    .filter(x=>x.value>0).sort((a,b)=>b.value-a.value).slice(0,8);

  const COLORS = ['#2563eb','#7c3aed','#0891b2','#16a34a','#d97706','#dc2626','#6366f1','#ec4899'];

  if (loading) return (
    <div style={{ padding:32, display:'flex', alignItems:'center', justifyContent:'center', flex:1 }}>
      <span style={{ color:'#9ca3af' }}>{t('common.loading')}</span>
    </div>
  );

  return (
    <div style={{ padding:'16px 24px', flex:1 }}>
      <h1 style={{ fontSize:24, fontWeight:700, marginBottom:4, color:'#1a1d23' }}>{pageTitle}</h1>
      <p style={{ color:'#6b7280', fontSize:14, marginBottom:24 }}>{pageSubtitle}</p>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:14, marginBottom:24 }}>
        {stats.map(({ label, value, icon:Icon, color, bg, isText }) => (
          <div key={label} style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <span style={{ fontSize:12, color:'#6b7280', fontWeight:500, lineHeight:1.3 }}>{label}</span>
              <div style={{ width:32, height:32, borderRadius:8, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={16} color={color}/>
              </div>
            </div>
            <div style={{ fontSize: isText ? 18 : 28, fontWeight:700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Status donut */}
        <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, padding:22, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:'#1a1d23', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
            <BarChart2 size={15} color="#2563eb"/> {t('dashboard.distributorStatus')}
          </h2>
          <DonutChart segments={statusSegments} size={130}/>
        </div>

        {/* Products per distributor */}
        <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, padding:22, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:'#1a1d23', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
            <Package size={15} color="#7c3aed"/> {t('dashboard.productsPerDistributor')}
          </h2>
          <BarChart data={prodByDist} colorFn={(_, i) => COLORS[prodByDist.findIndex(x=>x.label===_) % COLORS.length]} valueLabel="count"/>
        </div>
      </div>

      {/* Row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Cost by category */}
        <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, padding:22, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:'#1a1d23', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
            <DollarSign size={15} color="#0891b2"/> {t('dashboard.costByCategory')}
          </h2>
          <BarChart data={catData} colorFn={()=>'linear-gradient(90deg,#0891b2,#06b6d4)'} valueLabel="cost"/>
        </div>

        {/* Cost by distributor */}
        <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, padding:22, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:'#1a1d23', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
            <TrendingUp size={15} color="#16a34a"/> {t('dashboard.costByDistributor')}
          </h2>
          <BarChart data={distData} colorFn={()=>'linear-gradient(90deg,#16a34a,#22c55e)'} valueLabel="cost"/>
        </div>
      </div>

      {/* Row 3 — products by category count */}
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, padding:22, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize:15, fontWeight:600, color:'#1a1d23', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
          <TrendingUp size={15} color="#2563eb"/> {t('dashboard.productsByCategory')}
        </h2>
        <BarChart data={prodCatData} colorFn={()=>'linear-gradient(90deg,#2563eb,#3b82f6)'} valueLabel="count"/>
      </div>
    </div>
  );
}
