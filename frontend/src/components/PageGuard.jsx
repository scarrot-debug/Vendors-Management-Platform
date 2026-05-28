import { useAuth } from '../hooks/useAuth.jsx';

export default function PageGuard({ permKey, children }) {
  const { permissions, user } = useAuth();

  // Admin always has access
  if (user?.role === 'admin') return children;

  // Check permission
  if (permissions?.[permKey] === false) {
    return (
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
        <div style={{ textAlign:'center', maxWidth:360 }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🔒</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'#1a1d23', marginBottom:8 }}>Access Restricted</h2>
          <p style={{ fontSize:14, color:'#6b7280', lineHeight:1.6 }}>
            You don't have permission to view this page.<br/>
            Contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
