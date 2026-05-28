import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTranslation } from 'react-i18next';

const inputStyle = {
  width:'100%', padding:'9px 12px', borderRadius:7,
  border:'1px solid #e2e6ed', background:'#fff',
  color:'#1a1d23', fontSize:14, outline:'none',
};

function ListManager({ title, description, fetchFn, saveFn, icon }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchFn().then(d => { setItems(d || []); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  const save = async (list) => {
    setSaving(true);
    try { await saveFn(list); setItems(list); } catch(e){ alert(e.message); }
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
    <div style={{ background:'#fff', border:'1px solid #e2e6ed', borderRadius:10, overflow:'hidden' }}>
      <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e6ed', background:'#f8f9fb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h2 style={{ fontSize:16, fontWeight:600, color:'#1a1d23', marginBottom:2 }}>{icon} {title}</h2>
          <p style={{ fontSize:13, color:'#6b7280' }}>{description}</p>
        </div>
        <span style={{ fontSize:13, color:'#6b7280' }}>{items.length} items</span>
      </div>
      <div style={{ padding:'16px 24px' }}>
        {isAdmin && (
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <input value={newItem} onChange={e=>setNewItem(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleAdd()}
              placeholder={`New ${title.toLowerCase()} name…`}
              style={{...inputStyle, flex:1}}/>
            <button onClick={handleAdd} disabled={saving||!newItem.trim()}
              style={{ padding:'8px 16px', borderRadius:7, border:'none', background:'#1a1d23', color:'#fff', fontSize:13, cursor:'pointer', fontWeight:500 }}>
              Add
            </button>
          </div>
        )}
        {loading ? <div style={{ color:'#9ca3af', fontSize:13 }}>Loading…</div> :
          items.length === 0 ? <div style={{ color:'#9ca3af', fontSize:13, fontStyle:'italic' }}>No {title.toLowerCase()} yet</div> :
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'#f8f9fb', borderRadius:20, border:'1px solid #e2e6ed' }}>
                {editIdx === idx ? (
                  <>
                    <input value={editVal} onChange={e=>setEditVal(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&handleEdit(idx)}
                      style={{ border:'none', outline:'none', background:'transparent', fontSize:13, width:120 }} autoFocus/>
                    <button onClick={()=>handleEdit(idx)} style={{ background:'none', border:'none', color:'#16a34a', cursor:'pointer', fontSize:12, fontWeight:600 }}>✓</button>
                    <button onClick={()=>setEditIdx(null)} style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:12 }}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize:13, color:'#1a1d23' }}>{item}</span>
                    {isAdmin && (
                      <>
                        <button onClick={()=>{setEditIdx(idx);setEditVal(item);}} style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:11, padding:'0 2px' }} title="Edit">✏</button>
                        <button onClick={()=>handleDelete(idx)} style={{ background:'none', border:'none', color:'#fca5a5', cursor:'pointer', fontSize:11, padding:'0 2px' }} title="Delete">✕</button>
                      </>
                    )}
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

export default function Catalog() {
  const { t } = useTranslation();
  return (
    <div style={{ padding:'16px 24px', flex:1 }}>
      <h1 style={{ fontSize:20, fontWeight:700, marginBottom:2, color:'#1a1d23' }}>{t('catalog.title')}</h1>
      <p style={{ color:'#6b7280', fontSize:13, marginBottom:24 }}>{t('catalog.subtitle')}</p>

      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <ListManager
          title={t('catalog.categories')}
          description={t('catalog.categoriesDesc')}
          icon="🏷️"
          fetchFn={api.getSystemCategories}
          saveFn={(cats) => api.setSystemCategories(cats)}
        />
        <ListManager
          title={t('catalog.manufacturers')}
          description={t('catalog.manufacturersDesc')}
          icon="🏭"
          fetchFn={api.getSystemManufacturers}
          saveFn={(mfrs) => api.setSystemManufacturers(mfrs)}
        />
      </div>
    </div>
  );
}
