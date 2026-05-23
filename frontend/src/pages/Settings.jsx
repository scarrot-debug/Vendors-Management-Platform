import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { Plus, Edit2, Trash2, KeyRound, Check, X, Shield, Eye, User, History } from 'lucide-react';

const ROLE_STYLES = {
  admin:  { bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe', icon: Shield },
  user:   { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0', icon: User },
  viewer: { bg:'#f8f9fb', color:'#64748b', border:'#e2e8f0', icon: Eye },
};

const ACTION_STYLES = {
  CREATE: { bg:'#f0fdf4', color:'#16a34a', label:'Created' },
  UPDATE: { bg:'#eff6ff', color:'#2563eb', label:'Updated' },
  DELETE: { bg:'#fef2f2', color:'#dc2626', label:'Deleted' },
};

const inputStyle = {
  width:'100%', padding:'9px 12px', borderRadius:7,
  border:'1px solid #e2e6ed', background:'#fff',
  color:'#1a1d23', fontSize:14, outline:'none',
};
const btnStyle = {
  display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
  borderRadius:7, border:'none', fontSize:13, fontWeight:500, cursor:'pointer',
};

function RoleBadge({ role }) {
  const s = ROLE_STYLES[role] || ROLE_STYLES.viewer;
  const Icon = s.icon;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:500, background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      <Icon size={11}/> {role}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:12, padding:28, width:440, boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <h2 style={{ fontSize:17, fontWeight:600, color:'#1a1d23' }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function UserForm({ initial, onSave, onCancel, saving, isEdit }) {
  const [form, setForm] = useState(initial || { username:'', email:'', password:'', role:'viewer' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Username *</label>
        <input value={form.username||''} onChange={e=>set('username',e.target.value)} style={inputStyle} autoComplete="off"/>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Email *</label>
        <input type="email" value={form.email||''} onChange={e=>set('email',e.target.value)} style={inputStyle} autoComplete="off"/>
      </div>
      {!isEdit && (
        <div>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Password *</label>
          <input type="password" value={form.password||''} onChange={e=>set('password',e.target.value)} style={inputStyle} autoComplete="new-password"/>
        </div>
      )}
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Role</label>
        <select value={form.role} onChange={e=>set('role',e.target.value)} style={inputStyle}>
          <option value="admin">Admin — full access</option>
          <option value="user">User — can edit</option>
          <option value="viewer">Viewer — read only</option>
        </select>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
        <button onClick={onCancel} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>Cancel</button>
        <button onClick={()=>onSave(form)} disabled={saving} style={{...btnStyle, background:'#2563eb', color:'#fff'}}>
          <Check size={15}/> {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
        </button>
      </div>
    </div>
  );
}

function ResetPasswordForm({ user, onSave, onCancel, saving }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm && password !== confirm;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <p style={{ fontSize:13, color:'#6b7280', marginBottom:4 }}>
        Reset password for <strong style={{ color:'#1a1d23' }}>{user.username}</strong>
      </p>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>New Password *</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" placeholder="Min. 6 characters"/>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Confirm Password *</label>
        <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
          style={{...inputStyle, borderColor: mismatch ? '#ef4444' : '#e2e6ed'}} placeholder="Repeat password"/>
        {mismatch && <p style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>Passwords do not match</p>}
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
        <button onClick={onCancel} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>Cancel</button>
        <button onClick={()=>!mismatch && password.length>=6 && onSave(password)} disabled={saving||mismatch||password.length<6}
          style={{...btnStyle, background: password.length>=6&&!mismatch ? '#2563eb' : '#e2e6ed', color:'#fff'}}>
          <KeyRound size={15}/> {saving ? 'Saving…' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
}

function HistorySection() {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    api.getHistory({ page, limit }).then(d => {
      setHistory(d.history || []);
      setTotal(d.total || 0);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden', marginTop:24 }}>
      <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e6ed', background:'#f8f9fb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1d23', marginBottom:2, display:'flex', alignItems:'center', gap:8 }}>
            <History size={16} color="#2563eb"/> Change History
          </h2>
          <p style={{ fontSize:13, color:'#6b7280' }}>Track all changes made to the system</p>
        </div>
        <span style={{ fontSize:13, color:'#6b7280' }}>{total} records</span>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ borderBottom:'1px solid #e2e6ed', background:'#fafafa' }}>
            {['Date & Time','User','Action','Type','Name'].map(h=>(
              <th key={h} style={{ padding:'10px 20px', textAlign:'left', color:'#374151', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>Loading…</td></tr>
          ) : history.length === 0 ? (
            <tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>No history yet</td></tr>
          ) : history.map((h, i) => {
            const s = ACTION_STYLES[h.action] || ACTION_STYLES.UPDATE;
            return (
              <tr key={h.id} style={{ borderBottom: i < history.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                <td style={{ padding:'11px 20px', color:'#6b7280', whiteSpace:'nowrap' }}>
                  {new Date(h.created_at).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                </td>
                <td style={{ padding:'11px 20px', fontWeight:500, color:'#1a1d23' }}>{h.username || 'System'}</td>
                <td style={{ padding:'11px 20px' }}>
                  <span style={{ display:'inline-block', padding:'2px 9px', borderRadius:5, fontSize:11, fontWeight:600, background:s.bg, color:s.color }}>
                    {s.label}
                  </span>
                </td>
                <td style={{ padding:'11px 20px', color:'#6b7280', textTransform:'capitalize' }}>{h.entity_type}</td>
                <td style={{ padding:'11px 20px', color:'#374151' }}>{h.entity_name}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div style={{ padding:'12px 20px', borderTop:'1px solid #f1f5f9', display:'flex', gap:4, justifyContent:'flex-end' }}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
            style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e6ed', background:'#fff', cursor:'pointer', color: page===1?'#d1d5db':'#374151' }}>‹</button>
          {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>setPage(p)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid', borderColor:p===page?'#2563eb':'#e2e6ed', background:p===page?'#2563eb':'#fff', color:p===page?'#fff':'#374151', cursor:'pointer' }}>{p}</button>
          ))}
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}
            style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e6ed', background:'#fff', cursor:'pointer', color:page>=totalPages?'#d1d5db':'#374151' }}>›</button>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try { setUsers(await api.getUsers()); }
    catch { showToast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSaveUser = async (form) => {
    setSaving(true);
    try {
      if (modal.type === 'add') await api.createUser(form);
      else await api.updateUser(modal.data.id, form);
      setModal(null); load();
      showToast(modal.type === 'add' ? 'User created successfully' : 'User updated successfully');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleResetPassword = async (password) => {
    setSaving(true);
    try {
      await api.resetPassword(modal.data.id, password);
      setModal(null);
      showToast('Password reset successfully');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.deleteUser(deleteConfirm.id);
      setDeleteConfirm(null); load();
      showToast('User deleted');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div style={{ padding:32, flex:1 }}>
      {toast && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:2000,
          background: toast.type==='error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${toast.type==='error' ? '#fecaca' : '#bbf7d0'}`,
          color: toast.type==='error' ? '#dc2626' : '#16a34a',
          padding:'12px 20px', borderRadius:9, fontSize:14, fontWeight:500,
          boxShadow:'0 4px 16px rgba(0,0,0,0.1)',
        }}>{toast.msg}</div>
      )}

      <h1 style={{ fontSize:24, fontWeight:700, marginBottom:4, color:'#1a1d23' }}>Settings</h1>
      <p style={{ color:'#6b7280', fontSize:14, marginBottom:28 }}>System configuration and user management</p>

      {/* User Management */}
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e6ed', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8f9fb' }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1d23', marginBottom:2 }}>User Management</h2>
            <p style={{ fontSize:13, color:'#6b7280' }}>Add, edit or remove system users</p>
          </div>
          {isAdmin && (
            <button onClick={()=>setModal({type:'add'})} style={{...btnStyle, background:'#2563eb', color:'#fff', boxShadow:'0 2px 8px rgba(37,99,235,0.25)'}}>
              <Plus size={15}/> Add User
            </button>
          )}
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #e2e6ed', background:'#fafafa' }}>
              {['Username','Email','Role','Created','Actions'].map(h => (
                <th key={h} style={{ padding:'10px 20px', textAlign:'left', color:'#374151', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>Loading…</td></tr>
            ) : users.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: i < users.length-1 ? '1px solid #f1f5f9' : 'none', background: u.username===currentUser?.username ? '#fafeff' : '#fff' }}
                onMouseEnter={e=>e.currentTarget.style.background='#f8f9fb'}
                onMouseLeave={e=>e.currentTarget.style.background=u.username===currentUser?.username?'#fafeff':'#fff'}
              >
                <td style={{ padding:'13px 20px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <div style={{
                      width:32, height:32, borderRadius:'50%',
                      background: u.role==='admin' ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : u.role==='user' ? 'linear-gradient(135deg,#34d399,#16a34a)' : 'linear-gradient(135deg,#94a3b8,#64748b)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:13, fontWeight:700, color:'#fff', flexShrink:0,
                    }}>{u.username[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight:600, color:'#1a1d23' }}>{u.username}</div>
                      {u.username===currentUser?.username && <div style={{ fontSize:11, color:'#2563eb' }}>You</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding:'13px 20px', color:'#6b7280' }}>{u.email}</td>
                <td style={{ padding:'13px 20px' }}><RoleBadge role={u.role}/></td>
                <td style={{ padding:'13px 20px', color:'#9ca3af', fontSize:13 }}>
                  {new Date(u.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                </td>
                <td style={{ padding:'13px 20px' }}>
                  {isAdmin && (
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={()=>setModal({type:'edit', data:u})} style={{...btnStyle, padding:'5px 11px', background:'#fff', color:'#2563eb', border:'1px solid #e2e6ed', fontSize:12}}>
                        <Edit2 size={12}/> Edit
                      </button>
                      <button onClick={()=>setModal({type:'reset', data:u})} style={{...btnStyle, padding:'5px 11px', background:'#fff', color:'#d97706', border:'1px solid #fde68a', fontSize:12}}>
                        <KeyRound size={12}/> Reset
                      </button>
                      {u.username!==currentUser?.username && (
                        <button onClick={()=>setDeleteConfirm(u)} style={{...btnStyle, padding:'5px 9px', background:'#fff', color:'#dc2626', border:'1px solid #fee2e2', fontSize:12}}>
                          <Trash2 size={12}/>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding:'12px 24px', borderTop:'1px solid #f1f5f9', background:'#fafafa', display:'flex', gap:20 }}>
          <span style={{ fontSize:12, color:'#9ca3af' }}>Roles:</span>
          {Object.keys(ROLE_STYLES).map(role=><RoleBadge key={role} role={role}/>)}
          <span style={{ fontSize:12, color:'#9ca3af', marginLeft:'auto' }}>{users.length} user{users.length!==1?'s':''}</span>
        </div>
      </div>

      {/* History */}
      <HistorySection/>

      {/* Modals */}
      {modal?.type==='add' && (
        <Modal title="Add New User" onClose={()=>setModal(null)}>
          <UserForm onSave={handleSaveUser} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {modal?.type==='edit' && (
        <Modal title={`Edit User — ${modal.data.username}`} onClose={()=>setModal(null)}>
          <UserForm initial={modal.data} isEdit onSave={handleSaveUser} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {modal?.type==='reset' && (
        <Modal title="Reset Password" onClose={()=>setModal(null)}>
          <ResetPasswordForm user={modal.data} onSave={handleResetPassword} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {deleteConfirm && (
        <Modal title="Confirm Delete" onClose={()=>setDeleteConfirm(null)}>
          <p style={{ color:'#6b7280', marginBottom:20 }}>
            Delete user <strong style={{ color:'#1a1d23' }}>{deleteConfirm.username}</strong>? This action cannot be undone.
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
