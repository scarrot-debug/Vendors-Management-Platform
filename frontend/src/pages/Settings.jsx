import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client.js';
import { useAuth, SESSION_OPTIONS } from '../hooks/useAuth.jsx';
import { Plus, Edit2, Trash2, KeyRound, Check, X, Shield, Eye, User, History, Clock, Image, Upload } from 'lucide-react';

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
  const [form, setForm] = useState(initial || { username:'', email:'', password:'', role:'viewer', first_name:'', last_name:'', mobile:'' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>First Name</label>
          <input value={form.first_name||''} onChange={e=>set('first_name',e.target.value)} style={inputStyle} autoComplete="off"/>
        </div>
        <div>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Last Name</label>
          <input value={form.last_name||''} onChange={e=>set('last_name',e.target.value)} style={inputStyle} autoComplete="off"/>
        </div>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Username *</label>
        <input value={form.username||''} onChange={e=>set('username',e.target.value)} style={inputStyle} autoComplete="off"/>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Email *</label>
        <input type="email" value={form.email||''} onChange={e=>set('email',e.target.value)} style={inputStyle} autoComplete="off"/>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>Mobile</label>
        <input value={form.mobile||''} onChange={e=>set('mobile',e.target.value)} style={inputStyle} placeholder="+972 50 000 0000"/>
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
        <button onClick={()=>onSave(form)} disabled={saving} style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>
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
          style={{...btnStyle, background: password.length>=6&&!mismatch ? '#1a1d23' : '#e2e6ed', color:'#fff'}}>
          <KeyRound size={15}/> {saving ? 'Saving…' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
}

function PermissionsModal({ user, onClose }) {
  const [perms, setPerms] = useState({ can_see_cost_price: true, can_see_customer_price: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getUserPermissions(user.id).then(p => {
      setPerms(p);
      setLoading(false);
    });
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateUserPermissions(user.id, perms);
      onClose();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:12, padding:28, width:420, boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1d23' }}>Field Permissions — {user.username}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}><X size={20}/></button>
        </div>
        {loading ? <div style={{ textAlign:'center', color:'#9ca3af', padding:20 }}>Loading…</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <p style={{ fontSize:13, color:'#6b7280' }}>Choose which price fields this user can see:</p>
            {[
              { key:'can_see_cost_price', label:'Cost Price', desc:'Purchase/cost price of products' },
              { key:'can_see_customer_price', label:'Customer Price', desc:'Selling price to customers' },
            ].map(({ key, label, desc }) => (
              <label key={key} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:8, border:'1px solid #e2e6ed', cursor:'pointer', background: perms[key] ? '#f0fdf4' : '#fafafa' }}>
                <input type="checkbox" checked={perms[key]} onChange={e => setPerms(p => ({...p, [key]: e.target.checked}))}
                  style={{ width:16, height:16, cursor:'pointer' }}/>
                <div>
                  <div style={{ fontWeight:600, fontSize:14, color:'#1a1d23' }}>{label}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>{desc}</div>
                </div>
                <span style={{ marginLeft:'auto', fontSize:12, fontWeight:600, color: perms[key] ? '#16a34a' : '#9ca3af' }}>
                  {perms[key] ? 'Visible ✓' : 'Hidden'}
                </span>
              </label>
            ))}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:7, border:'1px solid #e2e6ed', background:'#f4f6f9', color:'#6b7280', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding:'8px 16px', borderRadius:7, border:'none', background:'#1a1d23', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:500 }}>
                {saving ? 'Saving…' : 'Save Permissions'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSystemCategories().then(c => { setCategories(c); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  const save = async (cats) => {
    setSaving(true);
    try { await api.setSystemCategories(cats); setCategories(cats); } catch(e){ alert(e.message); }
    finally { setSaving(false); }
  };

  const handleAdd = async () => {
    if (!newCat.trim()) return;
    const updated = [...categories, newCat.trim()];
    await save(updated);
    setNewCat('');
  };

  const handleDelete = async (idx) => {
    const updated = categories.filter((_,i)=>i!==idx);
    await save(updated);
  };

  const handleEdit = async (idx) => {
    if (!editVal.trim()) return;
    const updated = categories.map((c,i)=>i===idx ? editVal.trim() : c);
    await save(updated);
    setEditIdx(null);
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden', marginTop:24 }}>
      <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e6ed', background:'#f8f9fb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1d23', marginBottom:2 }}>Categories</h2>
          <p style={{ fontSize:13, color:'#6b7280' }}>Manage product categories used across the system</p>
        </div>
        <span style={{ fontSize:13, color:'#6b7280' }}>{categories.length} categories</span>
      </div>
      <div style={{ padding:'16px 24px' }}>
        {/* Add new */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <input value={newCat} onChange={e=>setNewCat(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleAdd()}
            placeholder="New category name…"
            style={{...inputStyle, flex:1}}/>
          <button onClick={handleAdd} disabled={saving||!newCat.trim()}
            style={{ padding:'8px 16px', borderRadius:7, border:'none', background:'#1a1d23', color:'#fff', fontSize:13, cursor:'pointer', fontWeight:500 }}>
            Add
          </button>
        </div>
        {/* List */}
        {loading ? <div style={{ color:'#9ca3af', fontSize:13 }}>Loading…</div> :
          categories.length === 0 ? <div style={{ color:'#9ca3af', fontSize:13, fontStyle:'italic' }}>No categories yet</div> :
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {categories.map((cat, idx) => (
              <div key={idx} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f8f9fb', borderRadius:7, border:'1px solid #e2e6ed' }}>
                {editIdx === idx ? (
                  <>
                    <input value={editVal} onChange={e=>setEditVal(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&handleEdit(idx)}
                      style={{...inputStyle, flex:1, padding:'5px 10px'}} autoFocus/>
                    <button onClick={()=>handleEdit(idx)} style={{ padding:'5px 12px', borderRadius:6, border:'none', background:'#1a1d23', color:'#fff', fontSize:12, cursor:'pointer' }}>Save</button>
                    <button onClick={()=>setEditIdx(null)} style={{ padding:'5px 12px', borderRadius:6, border:'1px solid #e2e6ed', background:'#fff', color:'#6b7280', fontSize:12, cursor:'pointer' }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex:1, fontSize:14, color:'#1a1d23' }}>{cat}</span>
                    <button onClick={()=>{setEditIdx(idx);setEditVal(cat);}} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e6ed', background:'#fff', color:'#2563eb', fontSize:12, cursor:'pointer' }}>Edit</button>
                    <button onClick={()=>handleDelete(idx)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #fee2e2', background:'#fff', color:'#dc2626', fontSize:12, cursor:'pointer' }}>Delete</button>
                  </>
                )}
              </div>
            ))}
          </div>
        }
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
            <button key={p} onClick={()=>setPage(p)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid', borderColor:p===page?'#1a1d23':'#e2e6ed', background:p===page?'#1a1d23':'#fff', color:p===page?'#fff':'#374151', cursor:'pointer' }}>{p}</button>
          ))}
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}
            style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e6ed', background:'#fff', cursor:'pointer', color:page>=totalPages?'#d1d5db':'#374151' }}>›</button>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { user: currentUser, sessionTimeout, updateSessionTimeout, logo, updateLogo } = useAuth();
  const logoFileRef = useRef(null);
  const [permissionsUser, setPermissionsUser] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
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
    <div style={{ padding:'16px 24px', flex:1 }}>
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
            <button onClick={()=>setModal({type:'add'})} style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>              <Plus size={15}/> Add User
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
                      <button onClick={()=>setPermissionsUser(u)} style={{...btnStyle, padding:'5px 11px', background:'#fff', color:'#7c3aed', border:'1px solid #e9d5ff', fontSize:12}}>
                        🔒 Role
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

      {/* Logo Settings */}
      {isAdmin && (
        <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden', marginTop:24 }}>
          <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e6ed', background:'#f8f9fb' }}>
            <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1d23', marginBottom:2, display:'flex', alignItems:'center', gap:8 }}>
              <Image size={16} color="#2563eb"/> Sidebar Logo
            </h2>
            <p style={{ fontSize:13, color:'#6b7280' }}>Customize the logo displayed in the sidebar</p>
          </div>
          <div style={{ padding:'20px 24px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:24, marginBottom:20 }}>
              {/* Current logo preview */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <div style={{ background:'#1a1d23', borderRadius:8, padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'center', minWidth:140, minHeight:52 }}>
                  {logo ? (
                    <img src={logo} alt="Current logo" style={{ maxHeight:32, maxWidth:120, objectFit:'contain' }}/>
                  ) : (
                    <img src="https://www.one1.co.il/wp-content/uploads/2024/11/dark_logo.webp" alt="Default logo" style={{ maxHeight:32, maxWidth:120, objectFit:'contain' }}/>
                  )}
                </div>
                <span style={{ fontSize:11, color:'#9ca3af' }}>{logo ? 'Custom logo' : 'Default logo'}</span>
              </div>
              {/* Actions */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <button onClick={()=>logoFileRef.current?.click()} disabled={logoUploading}
                  style={{...btnStyle, background:'#1a1d23', color:'#fff', fontSize:13}}>
                  <Upload size={14}/> {logoUploading ? 'Uploading…' : logo ? 'Change Logo' : 'Upload Logo'}
                </button>
                {logo && (
                  <button onClick={async()=>{ setLogoUploading(true); await updateLogo(''); setLogoUploading(false); }}
                    style={{...btnStyle, background:'#fff', color:'#dc2626', border:'1px solid #fee2e2', fontSize:13}}>
                    <Trash2 size={14}/> Remove Logo
                  </button>
                )}
                <input ref={logoFileRef} type="file" accept=".png,.jpg,.jpeg,.webp,.svg" style={{ display:'none' }}
                  onChange={async e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 500 * 1024) { alert('File too large. Max 500KB.'); return; }
                    setLogoUploading(true);
                    const reader = new FileReader();
                    reader.onload = async ev => {
                      await updateLogo(ev.target.result);
                      setLogoUploading(false);
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
            {/* Guidelines */}
            <div style={{ background:'#f8f9fb', border:'1px solid #e2e6ed', borderRadius:8, padding:'12px 16px', fontSize:12, color:'#6b7280' }}>
              <div style={{ fontWeight:600, color:'#374151', marginBottom:6 }}>📋 Logo Guidelines</div>
              <div>• <strong>Formats:</strong> PNG, JPG, JPEG, WebP, SVG</div>
              <div>• <strong>Max size:</strong> 500KB</div>
              <div>• <strong>Recommended dimensions:</strong> 160×40px or similar wide format</div>
              <div>• <strong>Background:</strong> Transparent or dark — logo appears on dark sidebar</div>
              <div>• <strong>Note:</strong> Same image is used for both expanded and collapsed sidebar</div>
            </div>
          </div>
        </div>
      )}

      {/* Session Timeout Settings */}
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden', marginTop:24 }}>
        <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e6ed', background:'#f8f9fb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1d23', marginBottom:2, display:'flex', alignItems:'center', gap:8 }}>
              <Clock size={16} color="#2563eb"/> Session Timeout
            </h2>
            <p style={{ fontSize:13, color:'#6b7280' }}>Auto logout after inactivity</p>
          </div>
        </div>
        <div style={{ padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontSize:14, color:'#374151', fontWeight:500 }}>Auto logout after:</span>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {SESSION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateSessionTimeout(opt.value)}
                style={{
                  padding:'7px 14px', borderRadius:7, fontSize:13, fontWeight:500, cursor:'pointer',
                  border: sessionTimeout === opt.value ? 'none' : '1px solid #e2e6ed',
                  background: sessionTimeout === opt.value ? '#1a1d23' : '#fff',
                  color: sessionTimeout === opt.value ? '#fff' : '#374151',
                  transition:'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {permissionsUser && (
        <PermissionsModal user={permissionsUser} onClose={()=>setPermissionsUser(null)}/>
      )}

      {/* Categories Management */}
      <CategoriesSection/>

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
