import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { Plus, Search, Edit2, Trash2, RefreshCw, X, Check, ChevronDown, ChevronRight, Package, ChevronsDownUp, ChevronsUpDown, ArrowUpDown, GripVertical } from 'lucide-react';

// Default column order — can be rearranged by drag & drop
const DEFAULT_COLUMNS = [
  { key: 'status',   label: 'Status' },
  { key: 'name',     label: 'Distributor Name' },
  { key: 'contact',  label: 'Contact' },
  { key: 'email',    label: 'Email' },
  { key: 'phone',    label: 'Phone' },
  { key: 'mobile',   label: 'Mobile' },
  { key: 'website',  label: 'Website' },
  { key: 'products', label: 'Products' },
  { key: 'actions',  label: 'Actions' },
];

const STATUS_STYLES = {
  Active:   { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0' },
  Pending:  { bg: '#fef9c3', color: '#ca8a04', border: '#fde68a' },
  Inactive: { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
};

const CURRENCIES = ['USD','EUR','ILS','GBP'];

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 7,
  border: '1px solid #e2e6ed', background: '#fff',
  color: '#1a1d23', fontSize: 14, outline: 'none',
};
const btnStyle = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
  borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Inactive;
  return <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:500, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>{status}</span>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:12, padding:28, width: wide ? 580 : 480, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h2 style={{ fontSize:17, fontWeight:600, color:'#1a1d23' }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DistributorForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || { name:'', contact:'', email:'', phone:'', mobile:'', website:'', status:'Active', notes:'' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {[
          {k:'name',l:'Distributor Name *'},
          {k:'contact',l:'Contact Person'},
          {k:'email',l:'Email'},
          {k:'phone',l:'Phone'},
          {k:'mobile',l:'Mobile'},
          {k:'website',l:'Website'},
        ].map(({k,l})=>(
          <div key={k}>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{l}</label>
            <input value={form[k]||''} onChange={e=>set(k,e.target.value)} style={inputStyle}
              placeholder={k==='website' ? 'https://...' : ''}/>
          </div>
        ))}
        <div>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Status</label>
          <select value={form.status} onChange={e=>set('status',e.target.value)} style={inputStyle}>
            {['Active','Pending','Inactive'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Notes</label>
        <input value={form.notes||''} onChange={e=>set('notes',e.target.value)} style={inputStyle}/>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
        <button onClick={onCancel} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>Cancel</button>
        <button onClick={()=>onSave(form)} disabled={saving} style={{...btnStyle, background:'#2563eb', color:'#fff'}}>
          <Check size={15}/> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || { name:'', category:'', vendor:'', cost:'', currency:'USD', status:'Active', description:'' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {[{k:'name',l:'Product Name *'},{k:'vendor',l:'Manufacturer'},{k:'category',l:'Category'}].map(({k,l})=>(
          <div key={k}>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{l}</label>
            <input value={form[k]||''} onChange={e=>set(k,e.target.value)} style={inputStyle}/>
          </div>
        ))}
        <div>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Cost</label>
          <div style={{ display:'flex', gap:6 }}>
            <input type="number" value={form.cost||''} onChange={e=>set('cost',e.target.value)} style={{...inputStyle, flex:1}} placeholder="0.00"/>
            <select value={form.currency} onChange={e=>set('currency',e.target.value)} style={{...inputStyle, width:80}}>
              {CURRENCIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Status</label>
        <select value={form.status} onChange={e=>set('status',e.target.value)} style={inputStyle}>
          {['Active','Pending','Inactive'].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Description</label>
        <input value={form.description||''} onChange={e=>set('description',e.target.value)} style={inputStyle}/>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
        <button onClick={onCancel} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>Cancel</button>
        <button onClick={()=>onSave(form)} disabled={saving} style={{...btnStyle, background:'#2563eb', color:'#fff'}}>
          <Check size={15}/> {saving ? 'Saving…' : 'Save Product'}
        </button>
      </div>
    </div>
  );
}

function formatCost(cost, currency) {
  if (!cost && cost !== 0) return '—';
  const symbols = { USD:'$', EUR:'€', ILS:'₪', GBP:'£' };
  const sym = symbols[currency] || currency + ' ';
  return `${sym}${parseFloat(cost).toLocaleString('en-US', { minimumFractionDigits:0, maximumFractionDigits:2 })}`;
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ArrowUpDown size={12} style={{ opacity:0.3, marginLeft:4 }}/>;
  return sortDir === 'asc'
    ? <ChevronDown size={12} style={{ marginLeft:4, color:'#2563eb' }}/>
    : <ChevronDown size={12} style={{ marginLeft:4, color:'#2563eb', transform:'rotate(180deg)' }}/>;
}

function DraggableHeader({ col, sortField, sortDir, onSort, onDragStart, onDragOver, onDrop, isDragOver }) {
  const isSortable = !['website','actions'].includes(col.key);
  return (
    <th
      draggable
      onDragStart={e => onDragStart(e, col.key)}
      onDragOver={e => { e.preventDefault(); onDragOver(col.key); }}
      onDrop={e => { e.preventDefault(); onDrop(col.key); }}
      onClick={() => isSortable && onSort(col.key)}
      style={{
        padding:'11px 16px', textAlign:'left',
        color: sortField===col.key ? '#2563eb' : '#374151',
        fontWeight:600, fontSize:13,
        cursor: isSortable ? 'pointer' : 'default',
        userSelect:'none', whiteSpace:'nowrap',
        background: isDragOver ? '#eff6ff' : '#f8f9fb',
        borderLeft: isDragOver ? '2px solid #2563eb' : '2px solid transparent',
        transition:'background 0.15s',
      }}
    >
      <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
        <GripVertical size={12} style={{ opacity:0.3, cursor:'grab' }}/>
        {col.label}
        {isSortable && <SortIcon field={col.key} sortField={sortField} sortDir={sortDir}/>}
      </span>
    </th>
  );
}

function DistributorRow({ dist, isViewer, open, onToggle, columns, onEditDist, onDeleteDist, onAddProduct, onEditProduct, onDeleteProduct }) {
  const productCount = dist.products?.length || 0;

  const renderCell = (key) => {
    switch(key) {
      case 'status': return <td key={key} style={{ padding:'13px 12px' }}><StatusBadge status={dist.status}/></td>;
      case 'name': return (
        <td key={key} style={{ padding:'13px 16px', fontWeight:700, color:'#1a1d23', fontSize:14 }}>
          {dist.website
            ? <a href={dist.website.startsWith('http') ? dist.website : `https://${dist.website}`} target="_blank" rel="noreferrer"
                style={{ color:'#1a1d23', textDecoration:'none' }}
                onMouseEnter={e=>e.currentTarget.style.color='#2563eb'} onMouseLeave={e=>e.currentTarget.style.color='#1a1d23'}>
                {dist.name}
              </a>
            : dist.name}
        </td>
      );
      case 'contact': return <td key={key} style={{ padding:'13px 16px', color:'#374151' }}>{dist.contact || '—'}</td>;
      case 'email':   return <td key={key} style={{ padding:'13px 16px', color:'#6b7280', fontSize:13 }}>{dist.email || '—'}</td>;
      case 'phone':   return <td key={key} style={{ padding:'13px 16px', color:'#6b7280', fontSize:13 }}>{dist.phone || '—'}</td>;
      case 'mobile':  return <td key={key} style={{ padding:'13px 16px', color:'#6b7280', fontSize:13 }}>{dist.mobile || '—'}</td>;
      case 'website': return (
        <td key={key} style={{ padding:'13px 16px', fontSize:13 }}>
          {dist.website ? (
            <a href={dist.website.startsWith('http') ? dist.website : `https://${dist.website}`}
              target="_blank" rel="noreferrer"
              style={{ color:'#2563eb', textDecoration:'none', fontSize:12 }}
              onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'}
              onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>
              🔗 Visit
            </a>
          ) : '—'}
        </td>
      );
      case 'products': return (
        <td key={key} style={{ padding:'13px 16px' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#eff6ff', color:'#2563eb', borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:500 }}>
            <Package size={12}/> {productCount} product{productCount !== 1 ? 's' : ''}
          </span>
        </td>
      );
      case 'actions': return (
        <td key={key} style={{ padding:'13px 16px' }}>
          {!isViewer && (
            <div style={{ display:'flex', gap:5 }}>
              <button onClick={()=>onAddProduct(dist)} style={{...btnStyle, padding:'4px 10px', background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', fontSize:12}}>
                <Plus size={12}/> Product
              </button>
              <button onClick={()=>onEditDist(dist)} style={{...btnStyle, padding:'4px 10px', background:'#fff', color:'#2563eb', border:'1px solid #e2e6ed', fontSize:12}}>
                <Edit2 size={12}/> Edit
              </button>
              <button onClick={()=>onDeleteDist(dist)} style={{...btnStyle, padding:'4px 10px', background:'#fff', color:'#dc2626', border:'1px solid #fee2e2', fontSize:12}}>
                <Trash2 size={12}/>
              </button>
            </div>
          )}
        </td>
      );
      default: return <td key={key}/>;
    }
  };

  return (
    <>
      <tr style={{ background:'#fff', borderBottom: open ? 'none' : '1px solid #e2e6ed' }}>
        <td style={{ padding:'13px 12px 13px 16px', width:36 }}>
          <button onClick={onToggle} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', display:'flex', alignItems:'center', padding:2 }}>
            {open ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
          </button>
        </td>
        {columns.map(col => renderCell(col.key))}
      </tr>
      {open && (
        <>
          <tr style={{ background:'#f0f6ff', borderTop:'2px solid #2563eb', borderBottom:'1px solid #dbeafe' }}>
            <td colSpan={2} style={{ padding:'7px 16px 7px 48px' }}/>
            <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>Status</td>
            <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>Product Name</td>
            <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>Manufacturer</td>
            <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>Category</td>
            <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>Description</td>
            <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>Cost</td>
            <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>Actions</td>
          </tr>
          {dist.products?.length === 0 ? (
            <tr style={{ background:'#f8fbff', borderBottom:'2px solid #e2e6ed' }}>
              <td colSpan={10} style={{ padding:'12px 48px', color:'#9ca3af', fontSize:13, fontStyle:'italic' }}>No products for this distributor</td>
            </tr>
          ) : dist.products?.map((p, idx) => (
            <tr key={p.id} style={{
              background: idx % 2 === 0 ? '#f8fbff' : '#f0f6ff',
              borderBottom: idx === (dist.products.length-1) ? '2px solid #bfdbfe' : '1px solid #e8f0fe',
            }}>
              <td style={{ padding:'10px 0 10px 32px', borderLeft:'3px solid #2563eb' }} colSpan={2}/>
              <td style={{ padding:'10px 16px' }}><StatusBadge status={p.status}/></td>
              <td style={{ padding:'10px 16px' }}><div style={{ fontWeight:600, color:'#1e40af', fontSize:13 }}>{p.name}</div></td>
              <td style={{ padding:'10px 16px', color:'#374151', fontSize:13 }}>{p.vendor || '—'}</td>
              <td style={{ padding:'10px 16px', color:'#6b7280', fontSize:13 }}>{p.category || '—'}</td>
              <td style={{ padding:'10px 16px', color:'#6b7280', fontSize:13 }}>{p.description || '—'}</td>
              <td style={{ padding:'10px 16px' }}>
                <span style={{ fontWeight:700, color:'#1a1d23', fontVariantNumeric:'tabular-nums', fontSize:14 }}>
                  {formatCost(p.cost, p.currency)}
                </span>
              </td>
              <td style={{ padding:'10px 16px' }}>
                {!isViewer && (
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={()=>onEditProduct(dist, p)} style={{...btnStyle, padding:'3px 9px', background:'#fff', color:'#2563eb', border:'1px solid #e2e6ed', fontSize:12}}>
                      <Edit2 size={11}/> Edit
                    </button>
                    <button onClick={()=>onDeleteProduct(dist, p)} style={{...btnStyle, padding:'3px 9px', background:'#fff', color:'#dc2626', border:'1px solid #fee2e2', fontSize:12}}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </>
      )}
    </>
  );
}

export default function Vendors() {
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';
  const [data, setData] = useState({ distributors: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [openRows, setOpenRows] = useState(new Set());
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [limit, setLimit] = useState(25);
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [categories, setCategories] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [dragOver, setDragOver] = useState(null);
  const dragKey = useRef(null);

  const handleDragStart = (e, key) => { dragKey.current = key; };
  const handleDragOver = (key) => { setDragOver(key); };
  const handleDrop = (targetKey) => {
    if (!dragKey.current || dragKey.current === targetKey) { setDragOver(null); return; }
    setColumns(prev => {
      const cols = [...prev];
      const fromIdx = cols.findIndex(c => c.key === dragKey.current);
      const toIdx = cols.findIndex(c => c.key === targetKey);
      const [moved] = cols.splice(fromIdx, 1);
      cols.splice(toIdx, 0, moved);
      return cols;
    });
    dragKey.current = null;
    setDragOver(null);
  };

  const toggleRow = (id) => setOpenRows(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (statusFilter !== 'All Status') params.status = statusFilter;
      if (search) params.search = search;
      if (categoryFilter !== 'All Categories') params.category = categoryFilter;
      const res = await api.getVendors(params);
      setData(res);
    } finally { setLoading(false); }
  }, [page, statusFilter, search, categoryFilter, limit]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter]);
  useEffect(() => { api.getCategories().then(setCategories); }, []);

  // Client-side sort
  const sorted = [...(data.distributors || [])].sort((a, b) => {
    let av = a[sortField] ?? '';
    let bv = b[sortField] ?? '';
    if (sortField === 'products') { av = a.products?.length || 0; bv = b.products?.length || 0; }
    if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
    return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const totalProducts = (data.distributors || []).reduce((sum, d) => sum + (d.products?.length || 0), 0);
  const allOpen = sorted.length > 0 && sorted.every(d => openRows.has(d.id));

  const expandAll = () => setOpenRows(new Set(sorted.map(d => d.id)));
  const collapseAll = () => setOpenRows(new Set());

  const handleSaveDist = async (form) => {
    setSaving(true);
    try {
      if (modal.type === 'addDist') await api.createVendor(form);
      else await api.updateVendor(modal.data.id, form);
      setModal(null); load();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleSaveProduct = async (form) => {
    setSaving(true);
    try {
      if (modal.type === 'addProduct') await api.addProduct(modal.dist.id, form);
      else await api.updateProduct(modal.dist.id, modal.data.id, form);
      setModal(null); load();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      if (deleteConfirm.type === 'dist') await api.deleteVendor(deleteConfirm.data.id);
      else await api.deleteProduct(deleteConfirm.dist.id, deleteConfirm.data.id);
      setDeleteConfirm(null); load();
    } catch (err) { alert(err.message); }
  };

  const totalPages = Math.ceil(data.total / limit);

  return (
    <div style={{ padding:32, flex:1 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, marginBottom:4, color:'#1a1d23' }}>Vendors Management Platform</h1>
          <p style={{ color:'#6b7280', fontSize:14 }}>Manage your distributors and products</p>
        </div>
        {!isViewer && (
          <button onClick={()=>setModal({type:'addDist'})} style={{
            display:'flex', alignItems:'center', gap:6, padding:'9px 18px',
            borderRadius:8, border:'none', background:'#2563eb',
            color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer',
            boxShadow:'0 2px 8px rgba(37,99,235,0.3)',
          }}>
            <Plus size={16}/> Add
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, maxWidth:280 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search distributor…"
            style={{...inputStyle, paddingLeft:34, paddingRight: search ? 32 : 12}}/>
          {search && (
            <button onClick={()=>setSearch('')} style={{
              position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', alignItems:'center',
            }}><X size={14}/></button>
          )}
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{...inputStyle, width:'auto'}}>
          <option>All Status</option>
          {['Active','Pending','Inactive'].map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} style={{...inputStyle, width:'auto'}}>
          <option>All Categories</option>
          {categories.map(c=><option key={c}>{c}</option>)}
        </select>
        <button onClick={load} style={{...btnStyle, background:'#fff', color:'#6b7280', border:'1px solid #e2e6ed', padding:'8px 12px'}}>
          <RefreshCw size={14}/>
        </button>
        <button onClick={allOpen ? collapseAll : expandAll}
          style={{...btnStyle, background:'#fff', color:'#6b7280', border:'1px solid #e2e6ed', padding:'7px 12px', fontSize:12}}>
          {allOpen ? <><ChevronsDownUp size={14}/> Collapse All</> : <><ChevronsUpDown size={14}/> Expand All</>}
        </button>
        <select value={limit} onChange={e=>{ setLimit(Number(e.target.value)); setPage(1); }}
          style={{...inputStyle, width:'auto', fontSize:13}}>
          {[10,25,50].map(n=><option key={n} value={n}>{n} / page</option>)}
        </select>
        {!isViewer && (
          <button onClick={async()=>{ setExporting(true); try { await api.exportCSV(); } catch(e){ alert(e.message); } finally{ setExporting(false); } }}
            disabled={exporting}
            style={{...btnStyle, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', padding:'7px 12px', fontSize:12}}>
            {exporting ? 'Exporting…' : '⬇ Export CSV'}
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #e2e6ed', background:'#f8f9fb' }} onDragLeave={()=>setDragOver(null)}>
              <th style={{ width:36, padding:'11px 16px' }}/>
              {columns.map(col => (
                <DraggableHeader
                  key={col.key}
                  col={col}
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  isDragOver={dragOver === col.key}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length+1} style={{ padding:40, textAlign:'center', color:'#9ca3af' }}>Loading…</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={columns.length+1} style={{ padding:40, textAlign:'center', color:'#9ca3af' }}>No distributors found</td></tr>
            ) : sorted.map(dist => (
              <DistributorRow
                key={dist.id}
                dist={dist}
                isViewer={isViewer}
                open={openRows.has(dist.id)}
                onToggle={() => toggleRow(dist.id)}
                columns={columns}
                onEditDist={d => setModal({type:'editDist', data:d})}
                onDeleteDist={d => setDeleteConfirm({type:'dist', data:d})}
                onAddProduct={d => setModal({type:'addProduct', dist:d})}
                onEditProduct={(d,p) => setModal({type:'editProduct', dist:d, data:p})}
                onDeleteProduct={(d,p) => setDeleteConfirm({type:'product', dist:d, data:p})}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14 }}>
        <span style={{ fontSize:13, color:'#6b7280' }}>
          Total: <strong>{data.total}</strong> distributors · <strong>{totalProducts}</strong> products
        </span>
        <div style={{ display:'flex', gap:4 }}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
            style={{...btnStyle, padding:'5px 10px', background:'#fff', border:'1px solid #e2e6ed', color:page===1?'#d1d5db':'#374151'}}>‹</button>
          {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>setPage(p)} style={{...btnStyle, padding:'5px 12px', border:'1px solid',
              borderColor:p===page?'#2563eb':'#e2e6ed', background:p===page?'#2563eb':'#fff', color:p===page?'#fff':'#374151'}}>{p}</button>
          ))}
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}
            style={{...btnStyle, padding:'5px 10px', background:'#fff', border:'1px solid #e2e6ed', color:page>=totalPages?'#d1d5db':'#374151'}}>›</button>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'addDist' && (
        <Modal title="Add New Distributor" onClose={()=>setModal(null)} wide>
          <DistributorForm onSave={handleSaveDist} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {modal?.type === 'editDist' && (
        <Modal title={`Edit Distributor — ${modal.data.name}`} onClose={()=>setModal(null)} wide>
          <DistributorForm initial={modal.data} onSave={handleSaveDist} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {modal?.type === 'addProduct' && (
        <Modal title={`Add Product → ${modal.dist.name}`} onClose={()=>setModal(null)} wide>
          <ProductForm onSave={handleSaveProduct} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {modal?.type === 'editProduct' && (
        <Modal title={`Edit Product — ${modal.data.name}`} onClose={()=>setModal(null)} wide>
          <ProductForm initial={modal.data} onSave={handleSaveProduct} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {deleteConfirm && (
        <Modal title="Confirm Delete" onClose={()=>setDeleteConfirm(null)}>
          <p style={{ color:'#6b7280', marginBottom:20 }}>
            Delete <strong style={{ color:'#1a1d23' }}>{deleteConfirm.data.name}</strong>?
            {deleteConfirm.type === 'dist' && deleteConfirm.data.products?.length > 0 &&
              <span style={{ display:'block', marginTop:8, color:'#dc2626', fontSize:13 }}>⚠️ All products of this distributor will also be deleted.</span>
            }
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={()=>setDeleteConfirm(null)} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>Cancel</button>
            <button onClick={handleDelete} style={{...btnStyle, background:'#dc2626', color:'#fff'}}><Trash2 size={14}/> Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
