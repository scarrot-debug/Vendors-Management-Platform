import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client.js';
import { useAuth, SESSION_OPTIONS } from '../hooks/useAuth.jsx';
import { Plus, Edit2, Trash2, KeyRound, Check, X, Shield, Eye, User, History, Clock, Image, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

function AddUserWizard({ onSave, onCancel, saving }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ username:'', email:'', password:'', role:'viewer', first_name:'', last_name:'', mobile:'' });
  const [perms, setPerms] = useState({
    can_see_cost_price: true, can_see_customer_price: true, can_see_documents: true,
    can_access_dashboard: true, can_access_vendors: true, can_access_catalog: true,
    can_access_requests: true, can_access_approvals: true,
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const { t } = useTranslation();

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:22 }}>
        {[{n:1,label:t('settings.stepDetails')},{n:2,label:t('settings.stepPermissions')}].map(({n,label}) => (
          <div key={n} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background: step>=n ? '#1a1d23' : '#e2e6ed', color: step>=n ? '#fff' : '#9ca3af', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600 }}>{n}</div>
            <span style={{ fontSize:13, color: step>=n ? '#1a1d23' : '#9ca3af', fontWeight: step===n ? 600 : 400 }}>{label}</span>
            {n < 2 && <div style={{ width:32, height:1, background: step>n ? '#1a1d23' : '#e2e6ed' }}/>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.firstName')}</label>
              <input value={form.first_name||''} onChange={e=>set('first_name',e.target.value)} style={inputStyle} autoComplete="off"/>
            </div>
            <div>
              <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.lastName')}</label>
              <input value={form.last_name||''} onChange={e=>set('last_name',e.target.value)} style={inputStyle} autoComplete="off"/>
            </div>
          </div>
          <div>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('auth.username')} *</label>
            <input value={form.username||''} onChange={e=>set('username',e.target.value)} style={inputStyle} autoComplete="off"/>
          </div>
          <div>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.email')} *</label>
            <input type="email" value={form.email||''} onChange={e=>set('email',e.target.value)} style={inputStyle} autoComplete="off"/>
          </div>
          <div>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.mobile')}</label>
            <input value={form.mobile||''} onChange={e=>set('mobile',e.target.value)} style={inputStyle} placeholder="+972 50 000 0000"/>
          </div>
          <div>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('auth.password')} *</label>
            <input type="password" value={form.password||''} onChange={e=>set('password',e.target.value)} style={inputStyle} autoComplete="new-password"/>
          </div>
          <div>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.role')}</label>
            <select value={form.role} onChange={e=>set('role',e.target.value)} style={inputStyle}>
              <option value="admin">Admin — full access</option>
              <option value="user">User — can edit</option>
              <option value="viewer">Viewer — read only</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
            <button onClick={onCancel} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>{t('common.cancel')}</button>
            <button onClick={()=>{ if(!form.username||!form.email||!form.password){ alert(`${t('auth.username')}, ${t('common.email')} ${t('auth.password')}`); return; } setStep(2); }}
              style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>
              {t('common.next')} →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', letterSpacing:0.5 }}>{t('settings.permissions.fieldVisibility')}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { key:'can_see_cost_price', label:t('settings.permissions.costPrice'), desc:t('settings.permissions.costPriceDesc') },
              { key:'can_see_customer_price', label:t('settings.permissions.customerPrice'), desc:t('settings.permissions.customerPriceDesc') },
              { key:'can_see_documents', label:t('settings.permissions.documents'), desc:t('settings.permissions.documentsDesc') },
            ].map(({ key, label, desc }) => (
              <label key={key} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, border:'1px solid #e2e6ed', cursor:'pointer', background: perms[key] ? '#f0fdf4' : '#fafafa' }}>
                <input type="checkbox" checked={perms[key]??true} onChange={e=>setPerms(p=>({...p,[key]:e.target.checked}))} style={{ width:15, height:15 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:'#1a1d23' }}>{label}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>{desc}</div>
                </div>
                <span style={{ fontSize:12, fontWeight:600, color: perms[key] ? '#16a34a' : '#9ca3af' }}>{perms[key] ? t('settings.permissions.visible') : t('settings.permissions.hidden')}</span>
              </label>
            ))}
          </div>

          <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', letterSpacing:0.5 }}>{t('settings.permissions.pageAccess')}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { key:'can_access_dashboard', label:t('nav.dashboard'), icon:'📊' },
              { key:'can_access_vendors', label:t('nav.vendors'), icon:'🏢' },
              { key:'can_access_catalog', label:t('nav.catalog'), icon:'📚' },
              { key:'can_access_requests', label:t('nav.requests'), icon:'📋' },
              { key:'can_access_approvals', label:t('nav.approvals'), icon:'✅' },
            ].map(({ key, label, icon }) => (
              <label key={key} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:8, border:'1px solid #e2e6ed', cursor:'pointer', background: perms[key]!==false ? '#f0fdf4' : '#fef2f2' }}>
                <input type="checkbox" checked={perms[key]!==false} onChange={e=>setPerms(p=>({...p,[key]:e.target.checked}))} style={{ width:15, height:15 }}/>
                <span style={{ fontSize:14 }}>{icon}</span>
                <span style={{ fontSize:13, color:'#1a1d23', fontWeight:500 }}>{label}</span>
              </label>
            ))}
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
            <button onClick={()=>setStep(1)} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>← {t('common.back')}</button>
            <button onClick={()=>onSave(form, perms)} disabled={saving} style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>
              {saving ? t('common.creating') : t('settings.createUser')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditUserForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || { username:'', email:'', role:'viewer', first_name:'', last_name:'', mobile:'' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const { t } = useTranslation();
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.firstName')}</label>
          <input value={form.first_name||''} onChange={e=>set('first_name',e.target.value)} style={inputStyle} autoComplete="off"/>
        </div>
        <div>
          <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.lastName')}</label>
          <input value={form.last_name||''} onChange={e=>set('last_name',e.target.value)} style={inputStyle} autoComplete="off"/>
        </div>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('auth.username')} *</label>
        <input value={form.username||''} onChange={e=>set('username',e.target.value)} style={inputStyle} autoComplete="off"/>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.email')} *</label>
        <input type="email" value={form.email||''} onChange={e=>set('email',e.target.value)} style={inputStyle} autoComplete="off"/>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.mobile')}</label>
        <input value={form.mobile||''} onChange={e=>set('mobile',e.target.value)} style={inputStyle} placeholder="+972 50 000 0000"/>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.role')}</label>
        <select value={form.role} onChange={e=>set('role',e.target.value)} style={inputStyle}>
          <option value="admin">Admin — full access</option>
          <option value="user">User — can edit</option>
          <option value="viewer">Viewer — read only</option>
        </select>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
        <button onClick={onCancel} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>{t('common.cancel')}</button>
        <button onClick={()=>onSave(form)} disabled={saving} style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>
          <Check size={15}/> {saving ? t('common.saving') : t('settings.saveChanges')}
        </button>
      </div>
    </div>
  );
}

function ResetPasswordForm({ user, onSave, onCancel, saving }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm && password !== confirm;
  const { t } = useTranslation();
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <p style={{ fontSize:13, color:'#6b7280', marginBottom:4 }}>
        {t('settings.resetPasswordTitle')} — <strong style={{ color:'#1a1d23' }}>{user.username}</strong>
      </p>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('settings.newPassword')} *</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" placeholder={t('settings.passwordMinChars')}/>
      </div>
      <div>
        <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('settings.confirmPassword')} *</label>
        <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
          style={{...inputStyle, borderColor: mismatch ? '#ef4444' : '#e2e6ed'}} placeholder={t('settings.passwordRepeat')}/>
        {mismatch && <p style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>{t('profile.passwordMismatch')}</p>}
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
        <button onClick={onCancel} style={{...btnStyle, background:'#f4f6f9', color:'#6b7280'}}>{t('common.cancel')}</button>
        <button onClick={()=>!mismatch && password.length>=6 && onSave(password)} disabled={saving||mismatch||password.length<6}
          style={{...btnStyle, background: password.length>=6&&!mismatch ? '#1a1d23' : '#e2e6ed', color:'#fff'}}>
          <KeyRound size={15}/> {saving ? t('common.saving') : t('settings.resetPasswordTitle')}
        </button>
      </div>
    </div>
  );
}

function PermissionsModal({ user, onClose }) {
  const [perms, setPerms] = useState({
    can_see_cost_price: true, can_see_customer_price: true, can_see_documents: true,
    can_access_dashboard: true, can_access_vendors: true, can_access_catalog: true,
    can_access_requests: true, can_access_approvals: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    api.getUserPermissions(user.id).then(p => { setPerms(p); setLoading(false); });
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    try { await api.updateUserPermissions(user.id, perms); onClose(); }
    catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const isAdmin = user.role === 'admin';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:12, padding:28, width:500, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1d23' }}>{t('settings.permissions.title')} — {user.username}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}><X size={20}/></button>
        </div>

        {loading ? <div style={{ textAlign:'center', color:'#9ca3af', padding:20 }}>{t('common.loading')}</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {isAdmin && (
              <div style={{ padding:'10px 14px', background:'#eff6ff', borderRadius:8, border:'1px solid #bfdbfe', fontSize:13, color:'#1d4ed8' }}>
                {t('settings.permissions.adminNote')}
              </div>
            )}

            {/* Field Permissions */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', letterSpacing:0.5, marginBottom:10 }}>{t('settings.permissions.fieldVisibility')}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { key:'can_see_cost_price', label:t('settings.permissions.costPrice'), desc:t('settings.permissions.costPriceDesc') },
                  { key:'can_see_customer_price', label:t('settings.permissions.customerPrice'), desc:t('settings.permissions.customerPriceDesc') },
                  { key:'can_see_documents', label:t('settings.permissions.documents'), desc:t('settings.permissions.documentsDesc') },
                ].map(({ key, label, desc }) => (
                  <label key={key} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, border:'1px solid #e2e6ed', cursor: isAdmin ? 'not-allowed' : 'pointer', background: perms[key] ? '#f0fdf4' : '#fafafa', opacity: isAdmin ? 0.6 : 1 }}>
                    <input type="checkbox" checked={perms[key] ?? true} onChange={e => !isAdmin && setPerms(p=>({...p,[key]:e.target.checked}))}
                      disabled={isAdmin} style={{ width:15, height:15, cursor:'pointer' }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:'#1a1d23' }}>{label}</div>
                      <div style={{ fontSize:12, color:'#6b7280' }}>{desc}</div>
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color: perms[key] ? '#16a34a' : '#9ca3af' }}>
                      {perms[key] ? t('settings.permissions.visible') : t('settings.permissions.hidden')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Page Access */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', letterSpacing:0.5, marginBottom:10 }}>{t('settings.permissions.pageAccess')}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { key:'can_access_dashboard', label:t('nav.dashboard'), icon:'📊' },
                  { key:'can_access_vendors', label:t('nav.vendors'), icon:'🏢' },
                  { key:'can_access_catalog', label:t('nav.catalog'), icon:'📚' },
                  { key:'can_access_requests', label:t('nav.requests'), icon:'📋' },
                  { key:'can_access_approvals', label:t('nav.approvals'), icon:'✅' },
                ].map(({ key, label, icon }) => (
                  <label key={key} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, border:'1px solid #e2e6ed', cursor: isAdmin ? 'not-allowed' : 'pointer', background: perms[key] !== false ? '#f0fdf4' : '#fef2f2', opacity: isAdmin ? 0.6 : 1 }}>
                    <input type="checkbox" checked={perms[key] !== false} onChange={e => !isAdmin && setPerms(p=>({...p,[key]:e.target.checked}))}
                      disabled={isAdmin} style={{ width:15, height:15, cursor:'pointer' }}/>
                    <span style={{ fontSize:16 }}>{icon}</span>
                    <div style={{ flex:1, fontWeight:600, fontSize:13, color:'#1a1d23' }}>{label}</div>
                    <span style={{ fontSize:12, fontWeight:600, color: perms[key] !== false ? '#16a34a' : '#dc2626' }}>
                      {perms[key] !== false ? t('settings.permissions.access') : t('settings.permissions.blocked')}
                    </span>
                  </label>
                ))}
                {/* Settings - always locked */}
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, border:'1px solid #e2e6ed', background:'#f8f9fb', opacity:0.5 }}>
                  <input type="checkbox" checked={false} disabled style={{ width:15, height:15 }}/>
                  <span style={{ fontSize:16 }}>⚙️</span>
                  <div style={{ flex:1, fontWeight:600, fontSize:13, color:'#1a1d23' }}>{t('nav.settings')}</div>
                  <span style={{ fontSize:12, color:'#9ca3af' }}>{t('settings.permissions.settingsAdminOnly')}</span>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:7, border:'1px solid #e2e6ed', background:'#f4f6f9', color:'#6b7280', cursor:'pointer', fontSize:13 }}>{t('common.skip')}</button>
              <button onClick={handleSave} disabled={saving||isAdmin} style={{ padding:'8px 16px', borderRadius:7, border:'none', background: isAdmin ? '#e2e6ed' : '#1a1d23', color:'#fff', cursor: isAdmin ? 'not-allowed' : 'pointer', fontSize:13, fontWeight:500 }}>
                {saving ? t('common.saving') : t('settings.permissions.title')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ManufacturersSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSystemManufacturers().then(m => { setItems(m || []); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  const save = async (list) => {
    setSaving(true);
    try { await api.setSystemManufacturers(list); setItems(list); } catch(e){ alert(e.message); }
    finally { setSaving(false); }
  };

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    await save([...items, newItem.trim()]);
    setNewItem('');
  };

  const handleDelete = async (idx) => save(items.filter((_,i)=>i!==idx));

  const handleEdit = async (idx) => {
    if (!editVal.trim()) return;
    await save(items.map((c,i)=>i===idx ? editVal.trim() : c));
    setEditIdx(null);
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden', marginTop:24 }}>
      <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e6ed', background:'#f8f9fb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1d23', marginBottom:2 }}>Manufacturers</h2>
          <p style={{ fontSize:13, color:'#6b7280' }}>Manage manufacturer list used in products</p>
        </div>
        <span style={{ fontSize:13, color:'#6b7280' }}>{items.length} manufacturers</span>
      </div>
      <div style={{ padding:'16px 24px' }}>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <input value={newItem} onChange={e=>setNewItem(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleAdd()}
            placeholder="New manufacturer name…"
            style={{...inputStyle, flex:1}}/>
          <button onClick={handleAdd} disabled={saving||!newItem.trim()}
            style={{ padding:'8px 16px', borderRadius:7, border:'none', background:'#1a1d23', color:'#fff', fontSize:13, cursor:'pointer', fontWeight:500 }}>
            Add
          </button>
        </div>
        {loading ? <div style={{ color:'#9ca3af', fontSize:13 }}>Loading…</div> :
          items.length === 0 ? <div style={{ color:'#9ca3af', fontSize:13, fontStyle:'italic' }}>No manufacturers yet</div> :
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {items.map((item, idx) => (
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
                    <span style={{ flex:1, fontSize:14, color:'#1a1d23' }}>{item}</span>
                    <button onClick={()=>{setEditIdx(idx);setEditVal(item);}} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid #e2e6ed', background:'#fff', color:'#2563eb', fontSize:12, cursor:'pointer' }}>Edit</button>
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
  const { t } = useTranslation();

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
            <History size={16} color="#2563eb"/> {t('settings.changeHistory')}
          </h2>
          <p style={{ fontSize:13, color:'#6b7280' }}>{t('settings.changeHistoryDesc')}</p>
        </div>
        <span style={{ fontSize:13, color:'#6b7280' }}>{total} {t('settings.records')}</span>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ borderBottom:'1px solid #e2e6ed', background:'#fafafa' }}>
            {[t('settings.colHistDate'), t('settings.colHistUser'), t('settings.colHistAction'), t('settings.colHistType'), t('common.name')].map(h=>(
              <th key={h} style={{ padding:'10px 20px', textAlign: isRTL ? 'right' : 'left', color:'#374151', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>Loading…</td></tr>
          ) : history.length === 0 ? (
            <tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>{t('settings.noHistory')}</td></tr>
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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
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

  const handleSaveUser = async (form, perms) => {
    setSaving(true);
    try {
      if (modal.type === 'add') {
        const newUser = await api.createUser(form);
        if (perms && newUser?.id) {
          await api.updateUserPermissions(newUser.id, perms);
        }
        setModal(null); load();
        showToast('User created successfully');
      } else {
        await api.updateUser(modal.data.id, form);
        setModal(null); load();
        showToast('User updated successfully');
      }
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

      <h1 style={{ fontSize:24, fontWeight:700, marginBottom:4, color:'#1a1d23' }}>{t('settings.title')}</h1>
      <p style={{ color:'#6b7280', fontSize:14, marginBottom:28 }}>{t('settings.subtitle')}</p>

      {/* User Management */}
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e6ed', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8f9fb' }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1d23', marginBottom:2, display:'flex', alignItems:'center', gap:8 }}>
              <User size={16} color="#2563eb"/> {t('settings.userManagement')}
            </h2>
            <p style={{ fontSize:13, color:'#6b7280' }}>{t('settings.userManagementDesc')}</p>
          </div>
          {isAdmin && (
            <button onClick={()=>setModal({type:'add'})} style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>              <Plus size={15}/> {t('settings.addUser')}
            </button>
          )}
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #e2e6ed', background:'#fafafa' }}>
              {['', t('settings.colFirstName'), t('settings.colLastName'), t('settings.colUsername'), t('settings.colEmail'), t('settings.colRole'), t('common.date'), t('settings.colActions')].map(h => (
                <th key={h} style={{ padding:'10px 16px', textAlign: isRTL ? 'right' : 'left', color:'#374151', fontWeight:600, fontSize:12, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'#9ca3af' }}>{t('common.loading')}</td></tr>
            ) : users.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: i < users.length-1 ? '1px solid #f1f5f9' : 'none', background: u.username===currentUser?.username ? '#fafeff' : '#fff' }}
                onMouseEnter={e=>e.currentTarget.style.background='#f8f9fb'}
                onMouseLeave={e=>e.currentTarget.style.background=u.username===currentUser?.username?'#fafeff':'#fff'}
              >
                {/* Avatar */}
                <td style={{ padding:'13px 16px', width:52 }}>
                  <div style={{
                    width:36, height:36, borderRadius:'50%',
                    background: u.role==='admin' ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : u.role==='user' ? 'linear-gradient(135deg,#34d399,#16a34a)' : 'linear-gradient(135deg,#94a3b8,#64748b)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:14, fontWeight:700, color:'#fff', flexShrink:0, position:'relative',
                  }}>
                    {u.username[0].toUpperCase()}
                    {u.username===currentUser?.username && (
                      <div style={{ position:'absolute', bottom:-2, right:-2, width:12, height:12, background:'#2563eb', borderRadius:'50%', border:'2px solid #fff' }}/>
                    )}
                  </div>
                </td>
                {/* First Name */}
                <td style={{ padding:'13px 16px', color:'#1a1d23', fontWeight:500 }}>{u.first_name || <span style={{ color:'#d1d5db' }}>—</span>}</td>
                {/* Last Name */}
                <td style={{ padding:'13px 16px', color:'#1a1d23', fontWeight:500 }}>{u.last_name || <span style={{ color:'#d1d5db' }}>—</span>}</td>
                {/* Username */}
                <td style={{ padding:'13px 16px' }}>
                  <div style={{ fontWeight:600, color:'#374151' }}>{u.username}</div>
                </td>
                <td style={{ padding:'13px 16px', color:'#6b7280' }}>{u.email}</td>
                <td style={{ padding:'13px 16px' }}><RoleBadge role={u.role}/></td>
                <td style={{ padding:'13px 16px', color:'#9ca3af', fontSize:13 }}>
                  {new Date(u.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                </td>
                <td style={{ padding:'13px 16px' }}>
                  {isAdmin && (
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={()=>setModal({type:'edit', data:u})} style={{...btnStyle, padding:'5px 11px', background:'#fff', color:'#2563eb', border:'1px solid #e2e6ed', fontSize:12}}>
                        <Edit2 size={12}/> {t('common.edit')}
                      </button>
                      <button onClick={()=>setPermissionsUser(u)} style={{...btnStyle, padding:'5px 11px', background:'#fff', color:'#7c3aed', border:'1px solid #e9d5ff', fontSize:12}}>
                        🔒 {t('settings.colRole')}
                      </button>
                      <button onClick={()=>setModal({type:'reset', data:u})} style={{...btnStyle, padding:'5px 11px', background:'#fff', color:'#d97706', border:'1px solid #fde68a', fontSize:12}}>
                        <KeyRound size={12}/> {t('settings.resetPasswordTitle')}
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
          <span style={{ fontSize:12, color:'#9ca3af' }}>{t('settings.colRole')}:</span>
          {Object.keys(ROLE_STYLES).map(role=><RoleBadge key={role} role={role}/>)}
          <span style={{ fontSize:12, color:'#9ca3af', marginLeft:'auto' }}>{users.length} {t('settings.colUser') || 'users'}</span>
        </div>
      </div>

      {/* Logo Settings */}
      {isAdmin && (
        <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden', marginTop:24 }}>
          <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e6ed', background:'#f8f9fb' }}>
            <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1d23', marginBottom:2, display:'flex', alignItems:'center', gap:8 }}>
              <Image size={16} color="#2563eb"/> {t('settings.sidebarLogo')}
            </h2>
            <p style={{ fontSize:13, color:'#6b7280' }}>{t('settings.sidebarLogoDesc')}</p>
          </div>
          <div style={{ padding:'20px 24px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:24, marginBottom:20 }}>
              {/* Current logo preview */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <div style={{ background:'#1a1d23', borderRadius:8, padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'center', minWidth:140, minHeight:52 }}>
                  {logo ? (
                    <img src={logo} alt="Current logo" style={{ maxHeight:32, maxWidth:120, objectFit:'contain' }}/>
                  ) : (
                    <img src="https://www.one1.co.il/wp-content/uploads/2024/11/dark_logo.webp" alt={t('settings.defaultLogo')} style={{ maxHeight:32, maxWidth:120, objectFit:'contain' }}/>
                  )}
                </div>
                <span style={{ fontSize:11, color:'#9ca3af' }}>{logo ? t('settings.customLogo') : t('settings.defaultLogo')}</span>
              </div>
              {/* Actions */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <button onClick={()=>logoFileRef.current?.click()} disabled={logoUploading}
                  style={{...btnStyle, background:'#1a1d23', color:'#fff', fontSize:13}}>
                  <Upload size={14}/> {logoUploading ? t('common.upload') : logo ? t('settings.logoChange') : t('settings.uploadLogo')}
                </button>
                {logo && (
                  <button onClick={async()=>{ setLogoUploading(true); await updateLogo(''); setLogoUploading(false); }}
                    style={{...btnStyle, background:'#fff', color:'#dc2626', border:'1px solid #fee2e2', fontSize:13}}>
                    <Trash2 size={14}/> {t('settings.removeLogo')}
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
              <div style={{ fontWeight:600, color:'#374151', marginBottom:6 }}>{t('settings.logoGuidelinesTitle')}</div>
              <div>• <strong>{t('settings.logoGuidelinesFormats')}</strong></div>
              <div>• <strong>{t('settings.logoGuidelinesSize')}</strong></div>
              <div>• <strong>{t('settings.logoGuidelinesDimensions')}</strong></div>
              <div>• <strong>{t('settings.logoGuidelinesBackground')}</strong></div>
              <div>• <strong>{t('settings.logoGuidelinesNote')}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Session Timeout Settings */}
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden', marginTop:24 }}>
        <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e6ed', background:'#f8f9fb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1d23', marginBottom:2, display:'flex', alignItems:'center', gap:8 }}>
              <Clock size={16} color="#2563eb"/> {t('settings.sessionTimeout')}
            </h2>
            <p style={{ fontSize:13, color:'#6b7280' }}>{t('settings.sessionTimeoutDesc')}</p>
          </div>
        </div>
        <div style={{ padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontSize:14, color:'#374151', fontWeight:500 }}>{t('settings.autoLogoutAfter')}</span>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {SESSION_OPTIONS.map(opt => {
              const timeKeys = { 15:'min15', 30:'min30', 45:'min45', 60:'hour1', 120:'hour2', 180:'hour3', 0:'never' };
              const label = t(`settings.times.${timeKeys[opt.value]}`, { defaultValue: opt.label });
              return (
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
                {label}
              </button>
              );
            })}
          </div>
        </div>
      </div>

      {permissionsUser && (
        <PermissionsModal user={permissionsUser} onClose={()=>setPermissionsUser(null)}/>
      )}

      {/* History */}
      <HistorySection/>

      {/* Modals */}
      {modal?.type==='add' && (
        <Modal title={t('settings.addUser')} onClose={()=>setModal(null)}>
          <AddUserWizard onSave={handleSaveUser} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {modal?.type==='edit' && (
        <Modal title={`${t('settings.editUser')} — ${modal.data.username}`} onClose={()=>setModal(null)}>
          <EditUserForm initial={modal.data} onSave={handleSaveUser} onCancel={()=>setModal(null)} saving={saving}/>
        </Modal>
      )}
      {modal?.type==='reset' && (
        <Modal title={t('settings.resetPasswordTitle')} onClose={()=>setModal(null)}>
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
