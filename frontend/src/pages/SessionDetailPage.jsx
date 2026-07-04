import { useNavigate } from 'react-router-dom';

/* Redirect to sessions page since detail view is now inline */
export default function SessionDetailPage() {
  const navigate = useNavigate();

  return (
    <div className="page-enter flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.15)' }}
      >
        <span className="text-3xl">📊</span>
      </div>
      <h2 className="text-text-primary font-display font-bold text-lg mb-1">Session Detail</h2>
      <p className="text-text-muted text-sm mb-6">View session details from the Sessions tab.</p>
      <button
        onClick={() => navigate('/sessions')}
        className="btn-primary px-8 py-3"
      >
        Go to Sessions
      </button>
    </div>
  );
}
