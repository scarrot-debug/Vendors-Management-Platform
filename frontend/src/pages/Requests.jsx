import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { Plus, X, Check, Trash2, Send, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle.js';

const STATUS_STYLES = {
  Draft:    { bg:'#f1f5f9', color:'#64748b', border:'#e2e8f0' },
  Pending:  { bg:'#fef9c3', color:'#ca8a04', border:'#fde68a' },
  Approved: { bg:'#dcfce7', color:'#16a34a', border:'#bbf7d0' },
  Rejected: { bg:'#fef2f2', color:'#dc2626', border:'#fecaca' },
};

const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:7, border:'1px solid #e2e6ed', background:'#fff', color:'#1a1d23', fontSize:14, outline:'none' };
const btnStyle = { display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:7, border:'none', fontSize:13, fontWeight:500, cursor:'pointer' };

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Draft;
  return <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:600, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>{status}</span>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:12, padding:28, width:'100%', maxWidth: wide ? 680 : 480, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <h2 style={{ fontSize:17, fontWeight:600, color:'#1a1d23' }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RequestForm({ onSave, onCancel, saving }) {
  const [title, setTitle] = useState('');
  const [distributorId, setDistributorId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_name:'', quantity:1, notes:'' }]);
  const [documents, setDocuments] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const fileRef = useRef(null);

  useEffect(() => {
    api.getVendors({ limit: 999 }).then(d => setDistributors(d.distributors || [])).catch(()=>{});
  }, []);

  const addItem = () => setItems(prev => [...prev, { product_name:'', quantity:1, notes:'' }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_,i)=>i!==idx));
  const updateItem = (idx, key, val) => setItems(prev => prev.map((item,i)=>i===idx ? {...item,[key]:val} : item));

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 10*1024*1024) { alert('Max 10MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => setDocuments(prev => [...prev, { name: file.name, mime_type: file.type, size_bytes: file.size, data: e.target.result }]);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!title.trim()) { alert('Title is required'); return; }
    const validItems = items.filter(i => i.product_name.trim());
    onSave({ title, distributor_id: distributorId || null, notes, items: validItems, documents });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Request Title *</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} style={inputStyle} placeholder="e.g. Q2 Software Licenses"/>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Distributor</label>
        <select value={distributorId} onChange={e=>setDistributorId(e.target.value)} style={inputStyle}>
          <option value="">— Select distributor (optional) —</option>
          {distributors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Items */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500 }}>Products / Items</label>
          <button onClick={addItem} style={{ ...btnStyle, padding:'4px 10px', background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', fontSize:12 }}>
            <Plus size={12}/> Add Item
          </button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'10px 12px', background:'#f8f9fb', borderRadius:8, border:'1px solid #e2e6ed' }}>
              <div style={{ flex:2 }}>
                <input value={item.product_name} onChange={e=>updateItem(idx,'product_name',e.target.value)}
                  style={{...inputStyle, fontSize:13}} placeholder="Product name"/>
              </div>
              <div style={{ width:80 }}>
                <input type="number" min="1" value={item.quantity} onChange={e=>updateItem(idx,'quantity',parseInt(e.target.value)||1)}
                  style={{...inputStyle, fontSize:13}} placeholder="Qty"/>
              </div>
              <div style={{ flex:2 }}>
                <input value={item.notes} onChange={e=>updateItem(idx,'notes',e.target.value)}
                  style={{...inputStyle, fontSize:13}} placeholder="Notes (optional)"/>
              </div>
              {items.length > 1 && (
                <button onClick={()=>removeItem(idx)} style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer', padding:'9px 4px' }}><X size={14}/></button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>General Notes</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)}
          style={{...inputStyle, minHeight:80, resize:'vertical'}} placeholder="Any additional notes…"/>
      </div>

      {/* Documents */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500 }}>Attachments (optional)</label>
          <button onClick={()=>fileRef.current?.click()} style={{ ...btnStyle, padding:'4px 10px', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', fontSize:12 }}>
            <Plus size={12}/> Attach File
          </button>
        </div>
        <input ref={fileRef} type="file" style={{ display:'none' }}
          onChange={e=>{ if(e.target.files[0]) handleFile(e.target.files[0]); e.target.value=''; }}/>
        {documents.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {documents.map((doc, idx) => (
              <div key={idx} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:'#f8f9fb', borderRadius:6, border:'1px solid #e2e6ed' }}>
                <span style={{ fontSize:12, flex:1, color:'#374151' }}>📄 {doc.name}</span>
                <span style={{ fontSize:11, color:'#9ca3af' }}>{(doc.size_bytes/1024).toFixed(0)}KB</span>
                <button onClick={()=>setDocuments(prev=>prev.filter((_,i)=>i!==idx))} style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer' }}><X size={13}/></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
        <button onClick={onCancel} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>
          <Check size={15}/> {saving ? 'Saving…' : 'Save Draft'}
        </button>
      </div>
    </div>
  );
}

function RequestDetail({ request, onClose, onRefresh, currentUser }) {
  const canReview = ['admin', 'user'].includes(currentUser?.role);
  const isOwner = request.requested_by === currentUser?.id;
  const [reviewNote, setReviewNote] = useState('');
  const [acting, setActing] = useState(false);
  const [showItems, setShowItems] = useState(true);
  const token = localStorage.getItem('token');

  const handleAction = async (action) => {
    setActing(true);
    try {
      if (action === 'submit') await api.submitRequest(request.id);
      else if (action === 'approve') await api.approveRequest(request.id, { reviewer_notes: reviewNote });
      else if (action === 'reject') await api.rejectRequest(request.id, { reviewer_notes: reviewNote });
      onRefresh(); onClose();
    } catch(err) { alert(err.message); }
    finally { setActing(false); }
  };

  const handleDownload = (docId, name) => {
    const url = api.downloadRequestDoc(request.id, docId);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r=>r.blob()).then(blob=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Header info */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'14px 16px', background:'#f8f9fb', borderRadius:8 }}>
        <div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:3 }}>DISTRIBUTOR</div>
          <div style={{ fontSize:14, fontWeight:500, color:'#1a1d23' }}>{request.distributor_name || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:3 }}>REQUESTED BY</div>
          <div style={{ fontSize:14, fontWeight:500, color:'#1a1d23' }}>{request.requester_name}</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:3 }}>DATE</div>
          <div style={{ fontSize:14, color:'#374151' }}>{new Date(request.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:3 }}>STATUS</div>
          <StatusBadge status={request.status}/>
        </div>
      </div>

      {/* Items */}
      <div>
        <button onClick={()=>setShowItems(v=>!v)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>
          {showItems ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} Products / Items ({request.items?.length || 0})
        </button>
        {showItems && request.items?.length > 0 && (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#f8f9fb', borderBottom:'1px solid #e2e6ed' }}>
                <th style={{ padding:'8px 12px', textAlign: isRTL ? 'right' : 'left', color:'#374151', fontWeight:600 }}>Product</th>
                <th style={{ padding:'8px 12px', textAlign:'center', color:'#374151', fontWeight:600 }}>Qty</th>
                <th style={{ padding:'8px 12px', textAlign: isRTL ? 'right' : 'left', color:'#374151', fontWeight:600 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {request.items.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i < request.items.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding:'8px 12px', color:'#1a1d23', fontWeight:500 }}>{item.product_name}</td>
                  <td style={{ padding:'8px 12px', textAlign:'center', color:'#374151' }}>{item.quantity}</td>
                  <td style={{ padding:'8px 12px', color:'#6b7280' }}>{item.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notes */}
      {request.notes && (
        <div style={{ padding:'12px 14px', background:'#fffbeb', borderRadius:8, border:'1px solid #fde68a' }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#92400e', marginBottom:4 }}>📝 Notes</div>
          <div style={{ fontSize:13, color:'#78350f' }}>{request.notes}</div>
        </div>
      )}

      {/* Documents */}
      {request.documents?.length > 0 && (
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>📎 Attachments</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {request.documents.map(doc => (
              <div key={doc.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f8f9fb', borderRadius:6, border:'1px solid #e2e6ed' }}>
                <span style={{ fontSize:13, flex:1, color:'#374151' }}>📄 {doc.name}</span>
                <span style={{ fontSize:11, color:'#9ca3af' }}>{doc.size_bytes ? `${(doc.size_bytes/1024).toFixed(0)}KB` : ''}</span>
                <button onClick={()=>handleDownload(doc.id, doc.name)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e6ed', background:'#fff', color:'#374151', cursor:'pointer', fontSize:12 }}>⬇</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviewer notes */}
      {request.reviewer_notes && (
        <div style={{ padding:'12px 14px', background: request.status==='Approved' ? '#f0fdf4' : '#fef2f2', borderRadius:8, border:`1px solid ${request.status==='Approved' ? '#bbf7d0' : '#fecaca'}` }}>
          <div style={{ fontSize:12, fontWeight:600, color: request.status==='Approved' ? '#16a34a' : '#dc2626', marginBottom:4 }}>
            {request.status==='Approved' ? '✅' : '❌'} Reviewer Notes — {request.reviewer_name}
          </div>
          <div style={{ fontSize:13, color:'#374151' }}>{request.reviewer_notes}</div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8, flexWrap:'wrap' }}>
        {/* Submit (owner, draft) */}
        {isOwner && request.status === 'Draft' && (
          <button onClick={()=>handleAction('submit')} disabled={acting} style={{...btnStyle, background:'#2563eb', color:'#fff'}}>
            <Send size={14}/> Submit for Approval
          </button>
        )}

        {/* Approve/Reject (reviewer, pending) */}
        {canReview && request.status === 'Pending' && (
          <>
            <div style={{ width:'100%' }}>
              <textarea value={reviewNote} onChange={e=>setReviewNote(e.target.value)}
                style={{...inputStyle, minHeight:60, resize:'vertical'}} placeholder="Reviewer notes (optional)…"/>
            </div>
            <button onClick={()=>handleAction('reject')} disabled={acting} style={{...btnStyle, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca'}}>
              ❌ Reject
            </button>
            <button onClick={()=>handleAction('approve')} disabled={acting} style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>
              ✅ Approve
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Requests() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const { title: pageTitle, subtitle: pageSubtitle } = usePageTitle('requests', { title: t('requests.title'), subtitle: t('requests.subtitle') });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const load = async () => {
    setLoading(true);
    try { setRequests(await api.getRequests()); }
    catch(e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await api.createRequest(form);
      setModal(null); load();
      showToast('Request created successfully');
    } catch(e) { showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (req) => {
    if (!confirm(`Delete "${req.title}"?`)) return;
    try { await api.deleteRequest(req.id); load(); showToast('Request deleted'); }
    catch(e) { showToast(e.message, 'error'); }
  };

  const openDetail = async (req) => {
    try {
      const full = await api.getRequest(req.id);
      setDetail(full);
    } catch(e) { showToast(e.message, 'error'); }
  };

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);

  return (
    <div style={{ padding:'16px 24px', flex:1 }}>
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:2000, background: toast.type==='error'?'#fef2f2':'#f0fdf4', border:`1px solid ${toast.type==='error'?'#fecaca':'#bbf7d0'}`, color: toast.type==='error'?'#dc2626':'#16a34a', padding:'12px 20px', borderRadius:9, fontSize:14, fontWeight:500, boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>{toast.msg}</div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, marginBottom:2, color:'#1a1d23' }}>{t('requests.title')}</h1>
          <p style={{ color:'#6b7280', fontSize:13 }}>{t('requests.subtitle')}</p>
        </div>
        <button onClick={()=>setModal('new')} style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>
          <Plus size={15}/> {t('requests.newRequest')}
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {['All','Draft','Pending','Approved','Rejected'].map(s => (
          <button key={s} onClick={()=>setFilter(s)} style={{ padding:'5px 14px', borderRadius:6, border:'1px solid', fontSize:13, cursor:'pointer', fontWeight: filter===s ? 600 : 400, borderColor: filter===s ? '#1a1d23' : '#e2e6ed', background: filter===s ? '#1a1d23' : '#fff', color: filter===s ? '#fff' : '#374151' }}>
            {s === 'All' ? t('common.all') : t(`requests.status.${s.toLowerCase()}`)} {s==='All' ? `(${requests.length})` : `(${requests.filter(r=>r.status===s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #e2e6ed', background:'#f8f9fb' }}>
              {[t('requests.requestTitle'),t('vendors.distributor'),t('common.name'),t('common.date'),t('common.status'),t('common.actions')].map(h=>(
                <th key={h} style={{ padding:'11px 16px', textAlign: isRTL ? 'right' : 'left', color:'#374151', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>{t('common.loading')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>{t('requests.noRequests')}</td></tr>
            ) : filtered.map((req, i) => (
              <tr key={req.id} style={{ borderBottom: i<filtered.length-1 ? '1px solid #f1f5f9' : 'none' }}
                onMouseEnter={e=>e.currentTarget.style.background='#f8f9fb'}
                onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                <td style={{ padding:'12px 16px' }}>
                  <button onClick={()=>openDetail(req)} style={{ background:'none', border:'none', color:'#1e40af', cursor:'pointer', fontSize:14, fontWeight:600, padding:0, textAlign: isRTL ? 'right' : 'left' }}>
                    {req.title}
                  </button>
                </td>
                <td style={{ padding:'12px 16px', color:'#374151' }}>{req.distributor_name || '—'}</td>
                <td style={{ padding:'12px 16px', color:'#374151' }}>{req.requester_name}</td>
                <td style={{ padding:'12px 16px', color:'#9ca3af', fontSize:13 }}>
                  {new Date(req.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                </td>
                <td style={{ padding:'12px 16px' }}><StatusBadge status={req.status}/></td>
                <td style={{ padding:'12px 16px' }}>
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={()=>openDetail(req)} style={{...btnStyle, padding:'4px 10px', background:'#fff', color:'#2563eb', border:'1px solid #e2e6ed', fontSize:12}}>
                      View
                    </button>
                    {req.status === 'Draft' && req.requested_by === user?.id && (
                      <button onClick={()=>handleDelete(req)} style={{...btnStyle, padding:'4px 8px', background:'#fff', color:'#dc2626', border:'1px solid #fee2e2', fontSize:12}}>
                        <Trash2 size={12}/>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'new' && (
        <Modal title="New Purchase Request" onClose={()=>setModal(null)} wide>
          <RequestForm onSave={handleCreate} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}

      {detail && (
        <Modal title={detail.title} onClose={()=>setDetail(null)} wide>
          <RequestDetail request={detail} onClose={()=>setDetail(null)} onRefresh={load} currentUser={user}/>
        </Modal>
      )}
    </div>
  );
}
