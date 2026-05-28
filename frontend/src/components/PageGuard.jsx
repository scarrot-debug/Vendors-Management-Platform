import { useAuth } from '../hooks/useAuth.jsx';
import { useTranslation } from 'react-i18next';

export default function PageGuard({ permKey, children }) {
  const { permissions, user } = useAuth();
  const { t } = useTranslation();

  if (user?.role === 'admin') return children;

  if (permissions?.[permKey] === false) {
    return (
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
        <div style={{ textAlign:'center', maxWidth:360 }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🔒</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'#1a1d23', marginBottom:8 }}>{t('pageGuard.title')}</h2>
          <p style={{ fontSize:14, color:'#6b7280', lineHeight:1.6, whiteSpace:'pre-line' }}>
            {t('pageGuard.desc')}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
