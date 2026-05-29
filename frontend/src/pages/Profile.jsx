import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../api/client.js';
import { Check, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const inputStyle = {
  width:'100%', padding:'9px 12px', borderRadius:7,
  border:'1px solid #e2e6ed', background:'#fff',
  color:'#1a1d23', fontSize:14, outline:'none',
};
const btnStyle = {
  display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
  borderRadius:7, border:'none', fontSize:13, fontWeight:500, cursor:'pointer',
};

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [form, setForm] = useState({ first_name:'', last_name:'', mobile:'', email:'' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [password, setPassword] = useState({ current:'', new:'', confirm:'' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api.getMyProfile?.().then(p => setForm(p)).catch(()=>{});
  }, []);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateMyProfile?.(form);
      showToast('Profile updated successfully');
    } catch(e){ showToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (password.new !== password.confirm) { showToast('Passwords do not match', 'error'); return; }
    if (password.new.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    setSavingPw(true);
    try {
      await api.changeMyPassword?.({ current: password.current, new: password.new });
      setPassword({ current:'', new:'', confirm:'' });
      showToast('Password changed successfully');
    } catch(e){ showToast(e.message, 'error'); }
    finally { setSavingPw(false); }
  };

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

      <h1 style={{ fontSize:20, fontWeight:700, marginBottom:2, color:'#1a1d23' }}>{t('profile.title')}</h1>
      <p style={{ color:'#6b7280', fontSize:13, marginBottom:24 }}>{t('profile.subtitle')}</p>

      {/* Avatar */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28 }}>
        <div style={{
          width:64, height:64, borderRadius:'50%',
          background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:24, fontWeight:700, color:'#fff',
        }}>{user?.username?.[0]?.toUpperCase()}</div>
        <div>
          <div style={{ fontSize:16, fontWeight:600, color:'#1a1d23' }}>{user?.username}</div>
          <div style={{ fontSize:13, color:'#6b7280', textTransform:'capitalize' }}>{user?.role}</div>
        </div>
      </div>

      {/* Personal info */}
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, padding:24, marginBottom:20 }}>
        <h2 style={{ fontSize:15, fontWeight:600, color:'#1a1d23', marginBottom:18 }}>{t('profile.personalInfo')}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('profile.firstName')}</label>
            <input value={form.first_name||''} onChange={e=>setForm(f=>({...f,first_name:e.target.value}))} style={inputStyle} placeholder="John"/>
          </div>
          <div>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('profile.lastName')}</label>
            <input value={form.last_name||''} onChange={e=>setForm(f=>({...f,last_name:e.target.value}))} style={inputStyle} placeholder="Doe"/>
          </div>
          <div>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('common.email')}</label>
            <input type="email" value={form.email||''} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={inputStyle}/>
          </div>
          <div>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('profile.mobile')}</label>
            <input value={form.mobile||''} onChange={e=>setForm(f=>({...f,mobile:e.target.value}))} style={inputStyle} placeholder="+972 50 000 0000"/>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button onClick={handleSave} disabled={saving} style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>
            <Check size={15}/> {saving ? t('common.saving') : t('profile.saveChanges')}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, padding:24 }}>
        <h2 style={{ fontSize:15, fontWeight:600, color:'#1a1d23', marginBottom:18 }}>{t('profile.changePassword')}</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:400 }}>
          <div>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('profile.currentPassword')}</label>
            <input type="password" value={password.current} onChange={e=>setPassword(p=>({...p,current:e.target.value}))} style={inputStyle}/>
          </div>
          <div>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('profile.newPassword')}</label>
            <input type="password" value={password.new} onChange={e=>setPassword(p=>({...p,new:e.target.value}))} style={inputStyle} placeholder={t('settings.passwordMinChars')}/>
          </div>
          <div>
            <label style={{ fontSize:13, color:'#374151', fontWeight:500, display:'block', marginBottom:5 }}>{t('profile.confirmPassword')}</label>
            <input type="password" value={password.confirm} onChange={e=>setPassword(p=>({...p,confirm:e.target.value}))}
              style={{...inputStyle, borderColor: password.confirm && password.new !== password.confirm ? '#ef4444' : '#e2e6ed'}}/>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button onClick={handlePasswordChange} disabled={savingPw} style={{...btnStyle, background:'#1a1d23', color:'#fff'}}>
              {savingPw ? t('common.saving') : t('profile.changePassword')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
