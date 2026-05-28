import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

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

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:12, padding:28, width:'100%', maxWidth:640, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <h2 style={{ fontSize:17, fontWeight:600, color:'#1a1d23' }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ApprovalDetail({ request, onClose, onRefresh }) {
  const [reviewNote, setReviewNote] = useState('');
  const [acting, setActing] = useState(false);
  const [showItems, setShowItems] = useState(true);
  const token = localStorage.getItem('token');

  const handleAction = async (action) => {
    setActing(true);
    try {
      if (action === 'approve') await api.approveRequest(request.id, { reviewer_notes: reviewNote });
      else await api.rejectRequest(request.id, { reviewer_notes: reviewNote });
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
      {/* Info */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'14px 16px', background:'#f8f9fb', borderRadius:8 }}>
        <div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:3 }}>DISTRIBUTOR</div>
          <div style={{ fontSize:14, fontWeight:500 }}>{request.distributor_name || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:3 }}>REQUESTED BY</div>
          <div style={{ fontSize:14, fontWeight:500 }}>{request.requester_name}</div>
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
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, border:'1px solid #e2e6ed', borderRadius:8, overflow:'hidden' }}>
            <thead>
              <tr style={{ background:'#f8f9fb', borderBottom:'1px solid #e2e6ed' }}>
                <th style={{ padding:'8px 12px', textAlign:'left', color:'#374151', fontWeight:600 }}>Product</th>
                <th style={{ padding:'8px 12px', textAlign:'center', color:'#374151', fontWeight:600 }}>Qty</th>
                <th style={{ padding:'8px 12px', textAlign:'left', color:'#374151', fontWeight:600 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {request.items.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i < request.items.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding:'8px 12px', color:'#1a1d23', fontWeight:500 }}>{item.product_name}</td>
                  <td style={{ padding:'8px 12px', textAlign:'center' }}>{item.quantity}</td>
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

      {/* Attachments */}
      {request.documents?.length > 0 && (
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>📎 Attachments</div>
          {request.documents.map(doc => (
            <div key={doc.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f8f9fb', borderRadius:6, border:'1px solid #e2e6ed', marginBottom:6 }}>
              <span style={{ fontSize:13, flex:1 }}>📄 {doc.name}</span>
              <button onClick={()=>handleDownload(doc.id, doc.name)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e6ed', background:'#fff', color:'#374151', cursor:'pointer', fontSize:12 }}>⬇</button>
            </div>
          ))}
        </div>
      )}

      {/* Approve/Reject */}
      {request.status === 'Pending' && (
        <div style={{ borderTop:'1px solid #e2e6ed', paddingTop:16 }}>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:6 }}>Reviewer Notes</label>
          <textarea value={reviewNote} onChange={e=>setReviewNote(e.target.value)}
            style={{...inputStyle, minHeight:70, resize:'vertical', marginBottom:12}} placeholder="Add notes before approving or rejecting…"/>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={()=>handleAction('reject')} disabled={acting}
              style={{...btnStyle, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca'}}>
              ❌ Reject
            </button>
            <button onClick={()=>handleAction('approve')} disabled={acting}
              style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>
              ✅ Approve
            </button>
          </div>
        </div>
      )}

      {/* Already reviewed */}
      {request.reviewer_notes && (
        <div style={{ padding:'12px 14px', background: request.status==='Approved' ? '#f0fdf4' : '#fef2f2', borderRadius:8, border:`1px solid ${request.status==='Approved' ? '#bbf7d0' : '#fecaca'}` }}>
          <div style={{ fontSize:12, fontWeight:600, color: request.status==='Approved' ? '#16a34a' : '#dc2626', marginBottom:4 }}>
            {request.status==='Approved' ? '✅' : '❌'} {request.reviewer_name} — {new Date(request.reviewed_at).toLocaleDateString('en-GB')}
          </div>
          <div style={{ fontSize:13, color:'#374151' }}>{request.reviewer_notes}</div>
        </div>
      )}
    </div>
  );
}

export default function Approvals() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('Pending');
  const [toast, setToast] = useState(null);

  const canReview = ['admin', 'user'].includes(user?.role);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const load = async () => {
    setLoading(true);
    try { setRequests(await api.getRequests()); }
    catch(e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (req) => {
    try { setDetail(await api.getRequest(req.id)); }
    catch(e) { showToast(e.message, 'error'); }
  };

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r=>r.status==='Pending').length;

  if (!canReview) {
    return (
      <div style={{ padding:'16px 24px', flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', color:'#9ca3af' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
          <div style={{ fontSize:16, fontWeight:600, color:'#374151' }}>Access Restricted</div>
          <div style={{ fontSize:14, marginTop:4 }}>Only Admin and User roles can review approvals.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:'16px 24px', flex:1 }}>
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:2000, background: toast.type==='error'?'#fef2f2':'#f0fdf4', border:`1px solid ${toast.type==='error'?'#fecaca':'#bbf7d0'}`, color: toast.type==='error'?'#dc2626':'#16a34a', padding:'12px 20px', borderRadius:9, fontSize:14, fontWeight:500, boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>{toast.msg}</div>
      )}

      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:2 }}>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#1a1d23' }}>Approvals</h1>
          {pendingCount > 0 && (
            <span style={{ background:'#dc2626', color:'#fff', borderRadius:12, padding:'2px 8px', fontSize:12, fontWeight:700 }}>{pendingCount}</span>
          )}
        </div>
        <p style={{ color:'#6b7280', fontSize:13 }}>Review and approve purchase requests</p>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {['Pending','All','Approved','Rejected'].map(s => (
          <button key={s} onClick={()=>setFilter(s)} style={{ padding:'5px 14px', borderRadius:6, border:'1px solid', fontSize:13, cursor:'pointer', fontWeight: filter===s ? 600 : 400, borderColor: filter===s ? '#1a1d23' : '#e2e6ed', background: filter===s ? '#1a1d23' : '#fff', color: filter===s ? '#fff' : '#374151' }}>
            {s} ({s==='All' ? requests.length : requests.filter(r=>r.status===s).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #e2e6ed', background:'#f8f9fb' }}>
              {['Title','Distributor','Requested By','Date','Status','Action'].map(h=>(
                <th key={h} style={{ padding:'11px 16px', textAlign:'left', color:'#374151', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>No requests found</td></tr>
            ) : filtered.map((req, i) => (
              <tr key={req.id} style={{ borderBottom: i<filtered.length-1 ? '1px solid #f1f5f9' : 'none', background: req.status==='Pending' ? '#fffdf0' : '#fff' }}
                onMouseEnter={e=>e.currentTarget.style.background='#f8f9fb'}
                onMouseLeave={e=>e.currentTarget.style.background=req.status==='Pending'?'#fffdf0':'#fff'}>
                <td style={{ padding:'12px 16px' }}>
                  <button onClick={()=>openDetail(req)} style={{ background:'none', border:'none', color:'#1e40af', cursor:'pointer', fontSize:14, fontWeight:600, padding:0 }}>
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
                  <button onClick={()=>openDetail(req)} style={{ padding:'4px 12px', borderRadius:6, border:`1px solid ${req.status==='Pending'?'#fde68a':'#e2e6ed'}`, background: req.status==='Pending'?'#fffbeb':'#fff', color: req.status==='Pending'?'#ca8a04':'#374151', cursor:'pointer', fontSize:12, fontWeight: req.status==='Pending'?600:400 }}>
                    {req.status === 'Pending' ? '⏳ Review' : 'View'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <Modal title={detail.title} onClose={()=>setDetail(null)}>
          <ApprovalDetail request={detail} onClose={()=>setDetail(null)} onRefresh={load}/>
        </Modal>
      )}
    </div>
  );
}
