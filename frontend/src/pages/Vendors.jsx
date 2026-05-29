import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { Plus, Search, Edit2, Trash2, RefreshCw, X, Check, ChevronDown, ChevronRight, Package, ChevronsDownUp, ChevronsUpDown, ArrowUpDown, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle.js';

// Default column order — can be rearranged by drag & drop
const DEFAULT_COLUMNS = [
  { key: 'status',         labelKey: 'vendors.colStatus' },
  { key: 'name',           labelKey: 'vendors.colName' },
  { key: 'contact',        labelKey: 'vendors.colContact' },
  { key: 'email',          labelKey: 'vendors.colEmail' },
  { key: 'phone',          labelKey: 'vendors.colPhone' },
  { key: 'mobile',         labelKey: 'vendors.colMobile' },
  { key: 'website',        labelKey: 'vendors.colWebsite' },
  { key: 'products',       labelKey: 'vendors.colProducts' },
  { key: 'actions',        labelKey: 'vendors.colActions' },
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
  const { t } = useTranslation();
  const s = STATUS_STYLES[status] || STATUS_STYLES.Inactive;
  const labels = { Active: t('vendors.active'), Pending: t('vendors.pending'), Inactive: t('vendors.inactive') };
  return <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:500, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>{labels[status] || status}</span>;
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
  const { t } = useTranslation();
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {[
          {k:'name',l:`${t('vendors.distributorName')} *`},
          {k:'contact',l:t('vendors.contact')},
          {k:'email',l:t('common.email')},
          {k:'phone',l:t('vendors.phone')},
          {k:'mobile',l:t('vendors.mobile')},
          {k:'website',l:t('vendors.website')},
        ].map(({k,l})=>(
          <div key={k}>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{l}</label>
            <input value={form[k]||''} onChange={e=>set(k,e.target.value)} style={inputStyle}
              placeholder={k==='website' ? 'https://...' : ''}/>
          </div>
        ))}
        <div>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.status')}</label>
          <select value={form.status} onChange={e=>set('status',e.target.value)} style={inputStyle}>
            {[
              { value:'Active',   label: t('vendors.active') },
              { value:'Pending',  label: t('vendors.pending') },
              { value:'Inactive', label: t('vendors.inactive') },
            ].map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.notes')}</label>
        <input value={form.notes||''} onChange={e=>set('notes',e.target.value)} style={inputStyle}/>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
        <button onClick={onCancel} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>{t('common.cancel')}</button>
        <button onClick={()=>onSave(form)} disabled={saving} style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>
          <Check size={15}/> {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || { name:'', category:'', vendor:'', cost:'', customer_price:'', currency:'USD', status:'Active', description:'' });
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const { t } = useTranslation();

  useEffect(() => {
    api.getSystemCategories().then(c => setCategories(c || [])).catch(()=>{});
    api.getSystemManufacturers().then(m => setManufacturers(m || [])).catch(()=>{});
  }, []);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {[{k:'name',l:`${t('vendors.productName')} *`}].map(({k,l})=>(
          <div key={k}>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{l}</label>
            <input value={form[k]||''} onChange={e=>set(k,e.target.value)} style={inputStyle}/>
          </div>
        ))}
        <div>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('vendors.manufacturer')}</label>
          <select value={form.vendor||''} onChange={e=>set('vendor',e.target.value)} style={inputStyle}>
            <option value="">—</option>
            {manufacturers.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('vendors.category')}</label>
          <select value={form.category||''} onChange={e=>set('category',e.target.value)} style={inputStyle}>
            <option value="">—</option>
            {categories.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('vendors.currency')}</label>
          <select value={form.currency} onChange={e=>set('currency',e.target.value)} style={inputStyle}>
            {CURRENCIES.map(c=><option key={c} value={c}>{t(`vendors.currencies.${c}`, { defaultValue: c })}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('vendors.costPrice')}</label>
          <input type="number" value={form.cost||''} onChange={e=>set('cost',e.target.value)} style={inputStyle} placeholder="0.00"/>
        </div>
        <div>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('vendors.customerPrice')}</label>
          <input type="number" value={form.customer_price||''} onChange={e=>set('customer_price',e.target.value)} style={inputStyle} placeholder="0.00"/>
        </div>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.status')}</label>
        <select value={form.status} onChange={e=>set('status',e.target.value)} style={inputStyle}>
          {[
            { value:'Active',   label: t('vendors.active') },
            { value:'Pending',  label: t('vendors.pending') },
            { value:'Inactive', label: t('vendors.inactive') },
          ].map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('vendors.description')}</label>
        <input value={form.description||''} onChange={e=>set('description',e.target.value)} style={inputStyle}/>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
        <button onClick={onCancel} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>{t('common.cancel')}</button>
        <button onClick={()=>onSave(form)} disabled={saving} style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>
          <Check size={15}/> {saving ? t('common.saving') : t('vendors.saveProduct')}
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const isSortable = !['website','actions'].includes(col.key);
  const label = col.labelKey ? t(col.labelKey) : col.label;
  return (
    <th
      draggable
      onDragStart={e => onDragStart(e, col.key)}
      onDragOver={e => { e.preventDefault(); onDragOver(col.key); }}
      onDrop={e => { e.preventDefault(); onDrop(col.key); }}
      onClick={() => isSortable && onSort(col.key)}
      style={{
        padding:'11px 16px', textAlign: isRTL ? 'right' : 'left',
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
        {label}
        {isSortable && <SortIcon field={col.key} sortField={sortField} sortDir={sortDir}/>}
      </span>
    </th>
  );
}

function DistributorRow({ dist, isViewer, open, onToggle, columns, permissions, selected, onSelect, onEditDist, onDeleteDist, onAddProduct, onEditProduct, onDeleteProduct, onOpenDocs }) {
  const productCount = dist.products?.length || 0;
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';

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
      case 'phone':   return <td key={key} style={{ padding:'13px 16px', color:'#6b7280', fontSize:13, direction:'ltr', textAlign: isRTL ? 'right' : 'left' }}>{dist.phone || '—'}</td>;
      case 'mobile':  return <td key={key} style={{ padding:'13px 16px', color:'#6b7280', fontSize:13, direction:'ltr', textAlign: isRTL ? 'right' : 'left' }}>{dist.mobile || '—'}</td>;
      case 'website': return (
        <td key={key} style={{ padding:'13px 16px', fontSize:13 }}>
          {dist.website ? (
            <a href={dist.website.startsWith('http') ? dist.website : `https://${dist.website}`}
              target="_blank" rel="noreferrer"
              style={{ color:'#2563eb', textDecoration:'none', fontSize:12 }}
              onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'}
              onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>
              🔗 {t('vendors.visitSite')}
            </a>
          ) : '—'}
        </td>
      );
      case 'products': return (
        <td key={key} style={{ padding:'13px 16px' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#eff6ff', color:'#2563eb', borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:500 }}>
            <Package size={12}/> {productCount} {t('vendors.products')}
          </span>
        </td>
      );
      case 'actions': return (
        <td key={key} style={{ padding:'13px 16px' }}>
          <div style={{ display:'flex', gap:5 }}>
            {permissions?.can_see_documents !== false && (
              <button onClick={()=>onOpenDocs(dist)} style={{...btnStyle, padding:'4px 10px', background:'#f5f3ff', color:'#7c3aed', border:'1px solid #e9d5ff', fontSize:12}}>
                📄 {t('documents.title')}
              </button>
            )}
            {!isViewer && (
              <>
                <button onClick={()=>onAddProduct(dist)} style={{...btnStyle, padding:'4px 10px', background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', fontSize:12}}>
                  <Plus size={12}/> {t('vendors.addProduct')}
                </button>
                <button onClick={()=>onEditDist(dist)} style={{...btnStyle, padding:'4px 10px', background:'#fff', color:'#2563eb', border:'1px solid #e2e6ed', fontSize:12}}>
                  <Edit2 size={12}/> {t('vendors.edit')}
                </button>
                <button onClick={()=>onDeleteDist(dist)} style={{...btnStyle, padding:'4px 10px', background:'#fff', color:'#dc2626', border:'1px solid #fee2e2', fontSize:12}}>
                  <Trash2 size={12}/>
                </button>
              </>
            )}
          </div>
        </td>
      );
      default: return <td key={key}/>;
    }
  };

  return (
    <>
      <tr style={{ background: selected ? '#eff6ff' : '#fff', borderBottom: open ? 'none' : '1px solid #e2e6ed' }}>
        <td style={{ padding:'13px 8px 13px 12px', width:36 }}>
          <button onClick={onToggle} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', display:'flex', alignItems:'center', padding:2 }}>
            {open ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
          </button>
        </td>
        {!isViewer && (
          <td style={{ padding:'13px 8px', width:32 }}>
            <input type="checkbox" checked={selected} onChange={e=>onSelect(dist.id, e.target.checked)}
              style={{ width:15, height:15, cursor:'pointer', accentColor:'#2563eb' }}/>
          </td>
        )}
        {columns.map(col => renderCell(col.key))}
      </tr>
      {open && (() => {
        const totalCols = columns.length + 1 + (isViewer ? 0 : 1);
        return (
          <>
            <tr style={{ background:'#f0f6ff', borderTop:'2px solid #2563eb', borderBottom:'1px solid #dbeafe' }}>
              <td colSpan={2} style={{ padding:'7px 16px 7px 48px' }}/>
              <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>{t('vendors.colStatus')}</td>
              <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>{t('vendors.productName')}</td>
              <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>{t('vendors.manufacturer')}</td>
              <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>{t('vendors.category')}</td>
              <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>{t('vendors.description')}</td>
              <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>{t('vendors.costPrice')}</td>
              <td style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>{t('vendors.customerPrice')}</td>
              <td colSpan={totalCols - 9} style={{ padding:'7px 16px', fontSize:11, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:1 }}>{t('vendors.colActions')}</td>
            </tr>
            {dist.products?.length === 0 ? (
              <tr style={{ background:'#f8fbff', borderBottom:'2px solid #e2e6ed' }}>
                <td colSpan={totalCols} style={{ padding:'12px 48px', color:'#9ca3af', fontSize:13, fontStyle:'italic' }}>{t('vendors.noProducts')}</td>
              </tr>
            ) : dist.products?.map((p, idx) => (
              <tr key={p.id} style={{
                background: idx % 2 === 0 ? '#f8fbff' : '#f0f6ff',
                borderBottom: idx === (dist.products.length-1) ? '2px solid #bfdbfe' : '1px solid #e8f0fe',
              }}>
                <td style={{ padding:'10px 0 10px 32px', borderInlineStart:'3px solid #2563eb' }} colSpan={2}/>
                <td style={{ padding:'10px 16px' }}><StatusBadge status={p.status}/></td>
                <td style={{ padding:'10px 16px' }}><div style={{ fontWeight:600, color:'#1e40af', fontSize:13 }}>{p.name}</div></td>
                <td style={{ padding:'10px 16px', color:'#374151', fontSize:13 }}>{p.vendor || '—'}</td>
                <td style={{ padding:'10px 16px', color:'#6b7280', fontSize:13 }}>{p.category || '—'}</td>
                <td style={{ padding:'10px 16px', color:'#6b7280', fontSize:13 }}>{p.description || '—'}</td>
                <td style={{ padding:'10px 16px' }}>
                  {permissions?.can_see_cost_price !== false ? (
                    <span style={{ fontWeight:700, color:'#1a1d23', fontVariantNumeric:'tabular-nums', fontSize:14 }}>
                      {formatCost(p.cost, p.currency)}
                    </span>
                  ) : <span style={{ color:'#d1d5db', fontSize:13 }}>—</span>}
                </td>
                <td style={{ padding:'10px 16px' }}>
                  {permissions?.can_see_customer_price !== false ? (
                    <span style={{ fontWeight:700, color:'#16a34a', fontVariantNumeric:'tabular-nums', fontSize:14 }}>
                      {formatCost(p.customer_price, p.currency)}
                    </span>
                  ) : <span style={{ color:'#d1d5db', fontSize:13 }}>—</span>}
                </td>
                <td colSpan={totalCols - 9} style={{ padding:'10px 16px' }}>
                  {!isViewer && (
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={()=>onEditProduct(dist, p)} style={{...btnStyle, padding:'3px 9px', background:'#fff', color:'#2563eb', border:'1px solid #e2e6ed', fontSize:12}}>
                        <Edit2 size={11}/> {t('vendors.edit')}
                      </button>
                      <button onClick={()=>onDeleteProduct(dist, p)} style={{...btnStyle, padding:'3px 9px', background:'#fff', color:'#dc2626', border:'1px solid #fee2e2', fontSize:12}}>
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {dist.notes && (
              <tr style={{ background:'#fffbeb', borderBottom:'2px solid #bfdbfe', borderTop:'1px solid #fde68a' }}>
                <td colSpan={2} style={{ padding:'10px 0 10px 32px', borderInlineStart:'3px solid #d97706' }}/>
                <td colSpan={totalCols - 2} style={{ padding:'10px 16px' }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'#92400e', marginInlineEnd:8 }}>📝 {t('common.notes')}</span>
                  <span style={{ fontSize:13, color:'#78350f' }}>{dist.notes}</span>
                </td>
              </tr>
            )}
          </>
        );
      })()}
    </>
  );
}

function DocumentsPanel({ dist, onClose, isViewer }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const fileRef = useRef(null);
  const token = localStorage.getItem('token');

  const loadDocs = () => {
    setLoading(true);
    api.getDocuments(dist.id).then(d => { setDocs(d); setLoading(false); }).catch(()=>setLoading(false));
  };

  useEffect(() => { loadDocs(); }, [dist.id]);

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Max 10MB.'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await api.uploadDocument(dist.id, {
          name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          data: e.target.result,
        });
        loadDocs();
      } catch(err) { alert(err.message); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document?')) return;
    try { await api.deleteDocument(dist.id, docId); loadDocs(); }
    catch(err) { alert(err.message); }
  };

  const handleDownload = (docId, name) => {
    const url = api.downloadDocument(dist.id, docId);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('Authorization', `Bearer ${token}`);
    // Fetch with auth header
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const burl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = burl; a.download = name; a.click();
        URL.revokeObjectURL(burl);
      });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024*1024) return `${(bytes/1024).toFixed(0)} KB`;
    return `${(bytes/(1024*1024)).toFixed(1)} MB`;
  };

  const getIcon = (mime) => {
    if (!mime) return '📄';
    if (mime.includes('pdf')) return '📕';
    if (mime.includes('word') || mime.includes('document')) return '📘';
    if (mime.includes('sheet') || mime.includes('excel')) return '📗';
    if (mime.includes('image')) return '🖼';
    return '📄';
  };

  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';

  return (
    <div style={{
      position:'fixed', bottom:16,
      right: isRTL ? 'auto' : 16,
      left: isRTL ? 16 : 'auto',
      width:340, maxWidth:'90vw',
      height: minimized ? 'auto' : 480,
      background:'#fff', boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
      zIndex:500, display:'flex', flexDirection:'column',
      borderRadius:12, border:'1px solid #e2e6ed', overflow:'hidden',
      transition:'height 0.2s ease',
    }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', background:'#1a1d23', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>📄 {t('documents.title')}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:1 }}>{dist.name}</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={()=>setMinimized(v=>!v)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', padding:4, fontSize:16, lineHeight:1 }}
              title={minimized ? 'Expand' : 'Minimize'}>
              {minimized ? '▲' : '▼'}
            </button>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', padding:4 }}>
              <X size={16}/>
            </button>
          </div>
        </div>
      </div>

      {/* Upload button - hidden for viewer */}
      {!minimized && (
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2e6ed', flexShrink:0 }}>
        {!isViewer && (
          <>
            <button onClick={()=>fileRef.current?.click()} disabled={uploading}
              style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 16px',
                borderRadius:8, border:'1px dashed #bfdbfe', background:'#f0f7ff', color:'#2563eb',
                fontSize:13, fontWeight:500, cursor:'pointer', justifyContent:'center' }}>
              <Plus size={15}/> {uploading ? t('documents.uploading') : t('documents.upload')}
            </button>
            <input ref={fileRef} type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*"
              style={{ display:'none' }} onChange={e=>{ if(e.target.files[0]) handleUpload(e.target.files[0]); e.target.value=''; }}/>
            <div style={{ fontSize:11, color:'#9ca3af', textAlign:'center', marginTop:6 }}>
              {t('documents.allowedTypes')}
            </div>
          </>
        )}
        {isViewer && (
          <div style={{ fontSize:12, color:'#9ca3af', textAlign:'center', padding:'8px 0' }}>
            {t('documents.viewOnly')}
          </div>
        )}
      </div>
      )}

      {/* Document list */}
      {!minimized && (
      <div style={{ flex:1, overflowY:'auto', padding:'10px 16px' }}>
        {loading ? (
          <div style={{ textAlign:'center', color:'#9ca3af', padding:32, fontSize:13 }}>{t('common.loading')}</div>
        ) : docs.length === 0 ? (
          <div style={{ textAlign:'center', color:'#9ca3af', padding:32, fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📁</div>
            {t('documents.noDocuments')}
          </div>
        ) : docs.map(doc => (
          <div key={doc.id} style={{
            display:'flex', alignItems:'center', gap:10, padding:'12px',
            background:'#f8f9fb', borderRadius:8, border:'1px solid #e2e6ed', marginBottom:8,
          }}>
            <div style={{ fontSize:22, flexShrink:0 }}>{getIcon(doc.mime_type)}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500, color:'#1a1d23', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {doc.name}
              </div>
              <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                {formatSize(doc.size_bytes)} · {new Date(doc.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                {doc.uploaded_by && ` · ${doc.uploaded_by}`}
              </div>
            </div>
            <div style={{ display:'flex', gap:4, flexShrink:0 }}>
              <button onClick={()=>handleDownload(doc.id, doc.name)}
                style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #e2e6ed', background:'#fff', color:'#374151', cursor:'pointer', fontSize:12 }}
                title={t('common.download')}>⬇</button>
              {!isViewer && (
                <button onClick={()=>handleDelete(doc.id)}
                  style={{ padding:'5px 8px', borderRadius:6, border:'1px solid #fee2e2', background:'#fff', color:'#dc2626', cursor:'pointer', fontSize:12 }}
                  title={t('common.delete')}>🗑</button>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Footer */}
      {!minimized && (
      <div style={{ padding:'10px 16px', borderTop:'1px solid #e2e6ed', fontSize:12, color:'#9ca3af', flexShrink:0 }}>
        {docs.length} {t('documents.title').toLowerCase()}
      </div>
      )}
    </div>
  );
}

export default function Vendors() {
  const { user, permissions = { can_see_cost_price: true, can_see_customer_price: true } } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const isViewer = user?.role === 'viewer';
  const { title: pageTitle, subtitle: pageSubtitle } = usePageTitle('vendors', { title: t('vendors.title'), subtitle: t('vendors.subtitle') });
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
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkConfirm, setBulkConfirm] = useState(null);
  const [docsPanel, setDocsPanel] = useState(null);

  const handleSelect = (id, checked) => {
    setSelected(prev => { const n = new Set(prev); checked ? n.add(id) : n.delete(id); return n; });
  };
  const handleSelectAll = (checked) => {
    setSelected(checked ? new Set(sorted.map(d=>d.id)) : new Set());
  };
  const handleBulkDelete = async () => {
    for (const id of selected) { try { await api.deleteVendor(id); } catch {} }
    setSelected(new Set()); setBulkConfirm(null); load();
  };
  const handleBulkStatus = async (status) => {
    for (const id of selected) {
      const dist = sorted.find(d=>d.id===id);
      if (dist) { try { await api.updateVendor(id, {...dist, status}); } catch {} }
    }
    setSelected(new Set()); setBulkConfirm(null); load();
  };

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
  useEffect(() => { 
    api.getSystemCategories().then(cats => {
      if (cats && cats.length > 0) setCategories(cats);
      else api.getCategories().then(setCategories);
    }).catch(() => api.getCategories().then(setCategories)); 
  }, []);

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

  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const fileInputRef = useRef(null);

  const handleImport = async (file) => {
    if (!file) return;
    setImporting(true);
    setShowImportExport(false);
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].replace(/"/g,'').split(',').map(h=>h.trim());
      let distCreated = 0, prodCreated = 0;
      const distMap = {}; // name → id

      // First pass: create distributors
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g)?.map(v=>v.replace(/^"|"$/g,'').replace(/""/g,'"').trim()) || [];
        const row = {};
        headers.forEach((h,idx) => row[h] = vals[idx] || '');
        if (!row['Distributor']) continue;
        if (!distMap[row['Distributor']]) {
          try {
            const res = await api.createVendor({
              name: row['Distributor'],
              status: row['Status'] || 'Active',
              contact: row['Contact'] || '',
              email: row['Email'] || '',
              phone: row['Phone'] || '',
              mobile: row['Mobile'] || '',
              website: row['Website'] || '',
            });
            distMap[row['Distributor']] = res.id;
            distCreated++;
          } catch {}
        }
      }

      // Second pass: create products
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g)?.map(v=>v.replace(/^"|"$/g,'').replace(/""/g,'"').trim()) || [];
        const row = {};
        headers.forEach((h,idx) => row[h] = vals[idx] || '');
        if (!row['Distributor'] || !row['Product']) continue;
        const distId = distMap[row['Distributor']];
        if (!distId) continue;
        try {
          await api.addProduct(distId, {
            name: row['Product'],
            vendor: row['Manufacturer'] || '',
            category: row['Category'] || '',
            cost: row['Cost Price'] || '',
            customer_price: row['Customer Price'] || '',
            currency: row['Currency'] || 'USD',
            status: row['Product Status'] || 'Active',
            description: row['Description'] || '',
          });
          prodCreated++;
        } catch {}
      }

      alert(`Import complete!\n${distCreated} distributors + ${prodCreated} products imported.`);
      load();
    } catch (err) { alert('Import failed: ' + err.message); }
    finally { setImporting(false); }
  };

  return (
    <div style={{ padding:'16px 24px', flex:1, minWidth:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, marginBottom:2, color:'#1a1d23' }}>{pageTitle}</h1>
          <p style={{ color:'#6b7280', fontSize:13 }}>{pageSubtitle}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center', flexWrap:'wrap' }}>
        {!isViewer && (
          <button onClick={()=>setModal({type:'addDist'})} style={{
            display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
            borderRadius:8, border:'none', background:'#1a1d23',
            color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer',
          }}>
            <Plus size={15}/> {t('vendors.addDistributor')}
          </button>
        )}
        <div style={{ position:'relative', flex:1, maxWidth:280 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('vendors.searchPlaceholder')}
            style={{...inputStyle, paddingLeft:34, paddingRight: search ? 32 : 12}}/>
          {search && (
            <button onClick={()=>setSearch('')} style={{
              position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', alignItems:'center',
            }}><X size={14}/></button>
          )}
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{...inputStyle, width:'auto'}}>
          <option value="All Status">{t('vendors.allStatus')}</option>
          {['Active','Pending','Inactive'].map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} style={{...inputStyle, width:'auto'}}>
          <option value="All Categories">{t('vendors.allCategories')}</option>
          {categories.map(c=><option key={c}>{c}</option>)}
        </select>
        <button onClick={load} style={{...btnStyle, background:'#fff', color:'#6b7280', border:'1px solid #e2e6ed', padding:'8px 12px'}}>
          <RefreshCw size={14}/>
        </button>
        <button onClick={allOpen ? collapseAll : expandAll}
          style={{...btnStyle, background:'#fff', color:'#6b7280', border:'1px solid #e2e6ed', padding:'7px 12px', fontSize:12}}>
          {allOpen ? <><ChevronsDownUp size={14}/> {t('vendors.collapseAll')}</> : <><ChevronsUpDown size={14}/> {t('vendors.expandAll')}</>}
        </button>
        <select value={limit} onChange={e=>{ setLimit(Number(e.target.value)); setPage(1); }}
          style={{...inputStyle, width:'auto', fontSize:13}}>
          {[10,25,50].map(n=><option key={n} value={n}>{n} / {t('vendors.perPage')}</option>)}
        </select>
        {!isViewer && (
          <div style={{ position:'relative' }}>
            <button onClick={()=>setShowImportExport(v=>!v)}
              style={{...btnStyle, background:'#fff', color:'#374151', border:'1px solid #e2e6ed', padding:'7px 12px', fontSize:12}}>
              {t('vendors.exportImport')} <ChevronDown size={12} style={{ marginLeft:2 }}/>
            </button>
            {showImportExport && (
              <div style={{
                position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:200,
                background:'#fff', border:'1px solid #e2e6ed', borderRadius:8,
                boxShadow:'0 8px 24px rgba(0,0,0,0.12)', minWidth:160, overflow:'hidden',
              }}>
                <button onClick={async()=>{ setShowImportExport(false); setExporting(true); try { await api.exportCSV(); } catch(e){ alert(e.message); } finally{ setExporting(false); } }}
                  disabled={exporting}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 16px', background:'none', border:'none', fontSize:13, color:'#374151', cursor:'pointer', textAlign: isRTL ? 'right' : 'left' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f4f6f9'}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  ⬇ {t('vendors.exportCSV')}
                </button>
                <div style={{ height:1, background:'#f1f5f9' }}/>
                <button onClick={()=>{ setShowImportExport(false); fileInputRef.current?.click(); }}
                  disabled={importing}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 16px', background:'none', border:'none', fontSize:13, color:'#374151', cursor:'pointer', textAlign: isRTL ? 'right' : 'left' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f4f6f9'}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  ⬆ {t('vendors.importCSV')}
                </button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display:'none' }}
              onChange={e=>{ if(e.target.files[0]) handleImport(e.target.files[0]); e.target.value=''; }}/>
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {selected.size > 0 && !isViewer && (
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, padding:'10px 16px', background:'#eff6ff', borderRadius:8, border:'1px solid #bfdbfe' }}>
          <span style={{ fontSize:13, fontWeight:600, color:'#1d4ed8' }}>{selected.size} selected</span>
          <div style={{ display:'flex', gap:6, marginLeft:8 }}>
            {['Active','Pending','Inactive'].map(s=>(
              <button key={s} onClick={()=>setBulkConfirm({type:'status', status:s})}
                style={{ padding:'5px 12px', borderRadius:6, border:'1px solid #bfdbfe', background:'#fff', color:'#1d4ed8', fontSize:12, cursor:'pointer', fontWeight:500 }}>
                → {s}
              </button>
            ))}
            <button onClick={()=>setBulkConfirm({type:'delete'})}
              style={{ padding:'5px 12px', borderRadius:6, border:'1px solid #fecaca', background:'#fff', color:'#dc2626', fontSize:12, cursor:'pointer', fontWeight:500 }}>
              🗑 Delete
            </button>
          </div>
          <button onClick={()=>setSelected(new Set())} style={{ marginLeft:'auto', background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:12 }}>✕ Clear</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden' }}>
        <div style={{ overflowX:'auto', width:'100%' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14, minWidth:700 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #e2e6ed', background:'#f8f9fb' }} onDragLeave={()=>setDragOver(null)}>
              <th style={{ width:36, padding:'11px 16px' }}/>
              {!isViewer && (
                <th style={{ width:32, padding:'11px 8px' }}>
                  <input type="checkbox"
                    checked={sorted.length > 0 && sorted.every(d=>selected.has(d.id))}
                    onChange={e=>handleSelectAll(e.target.checked)}
                    style={{ width:15, height:15, cursor:'pointer', accentColor:'#2563eb' }}/>
                </th>
              )}
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
                permissions={permissions}
                selected={selected.has(dist.id)}
                onSelect={handleSelect}
                onEditDist={d => setModal({type:'editDist', data:d})}
                onDeleteDist={d => setDeleteConfirm({type:'dist', data:d})}
                onAddProduct={d => setModal({type:'addProduct', dist:d})}
                onEditProduct={(d,p) => setModal({type:'editProduct', dist:d, data:p})}
                onDeleteProduct={(d,p) => setDeleteConfirm({type:'product', dist:d, data:p})}
                onOpenDocs={d => setDocsPanel(d)}
              />
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14 }}>
        <span style={{ fontSize:13, color:'#6b7280' }}>
          {t('vendors.total')}: <strong>{data.total}</strong> {t('vendors.distributor')} · <strong>{totalProducts}</strong> {t('vendors.products')}
        </span>
        <div style={{ display:'flex', gap:4 }}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
            style={{...btnStyle, padding:'5px 10px', background:'#fff', border:'1px solid #e2e6ed', color:page===1?'#d1d5db':'#374151'}}>‹</button>
          {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>setPage(p)} style={{...btnStyle, padding:'5px 12px', border:'1px solid',
              borderColor:p===page?'#1a1d23':'#e2e6ed', background:p===page?'#1a1d23':'#fff', color:p===page?'#fff':'#374151'}}>{p}</button>
          ))}
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}
            style={{...btnStyle, padding:'5px 10px', background:'#fff', border:'1px solid #e2e6ed', color:page>=totalPages?'#d1d5db':'#374151'}}>›</button>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'addDist' && (
        <Modal title={t('vendors.addDistributor')} onClose={()=>setModal(null)} wide>
          <DistributorForm onSave={handleSaveDist} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {modal?.type === 'editDist' && (
        <Modal title={`${t('vendors.editDistributor')} — ${modal.data.name}`} onClose={()=>setModal(null)} wide>
          <DistributorForm initial={modal.data} onSave={handleSaveDist} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {modal?.type === 'addProduct' && (
        <Modal title={`${t('vendors.addProduct')} ${isRTL ? '←' : '→'} ${modal.dist.name}`} onClose={()=>setModal(null)} wide>
          <ProductForm onSave={handleSaveProduct} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {modal?.type === 'editProduct' && (
        <Modal title={`${t('vendors.editProduct')} — ${modal.data.name}`} onClose={()=>setModal(null)} wide>
          <ProductForm initial={modal.data} onSave={handleSaveProduct} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {docsPanel && (
        <DocumentsPanel dist={docsPanel} onClose={()=>setDocsPanel(null)} isViewer={isViewer}/>
      )}

      {bulkConfirm && (
        <Modal title={bulkConfirm.type==='delete' ? 'Delete Selected' : `Change Status to ${bulkConfirm.status}`} onClose={()=>setBulkConfirm(null)}>
          <p style={{ color:'#6b7280', marginBottom:20 }}>
            {bulkConfirm.type==='delete'
              ? `Delete ${selected.size} distributor${selected.size>1?'s':''}? This cannot be undone.`
              : `Change ${selected.size} distributor${selected.size>1?'s':''} to "${bulkConfirm.status}"?`}
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={()=>setBulkConfirm(null)} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>Cancel</button>
            <button onClick={bulkConfirm.type==='delete' ? handleBulkDelete : ()=>handleBulkStatus(bulkConfirm.status)}
              style={{...btnStyle, background: bulkConfirm.type==='delete' ? '#dc2626' : '#1a1d23', color:'#fff'}}>
              Confirm
            </button>
          </div>
        </Modal>
      )}
      {deleteConfirm && (
        <Modal title={t('vendors.confirmDelete')} onClose={()=>setDeleteConfirm(null)}>
          <p style={{ color:'#6b7280', marginBottom:20 }}>
            {t('common.delete')} <strong style={{ color:'#1a1d23' }}>{deleteConfirm.data.name}</strong>?
            {deleteConfirm.type === 'dist' && deleteConfirm.data.products?.length > 0 &&
              <span style={{ display:'block', marginTop:8, color:'#dc2626', fontSize:13 }}>⚠️ {t('vendors.deleteWarning')}</span>
            }
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={()=>setDeleteConfirm(null)} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>{t('common.cancel')}</button>
            <button onClick={handleDelete} style={{...btnStyle, background:'#dc2626', color:'#fff'}}><Trash2 size={14}/> {t('common.delete')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
