import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

const TYPE_OPTIONS = [
  { key: 'feature', label: 'Feature Request', icon: '\u2728' },
  { key: 'bug', label: 'Bug Report', icon: '\uD83D\uDC1B' },
  { key: 'praise', label: 'Praise', icon: '\uD83D\uDE4C' },
  { key: 'question', label: 'Question', icon: '\u2753' },
];

const TYPE_META = {
  feature: { color: 'var(--accent-blue)', label: 'Feature Request' },
  bug: { color: 'var(--accent-red)', label: 'Bug Report' },
  praise: { color: 'var(--accent-green)', label: 'Praise' },
  question: { color: 'var(--accent-amber)', label: 'Question' },
  feedback: { color: 'var(--text-muted)', label: 'Feedback' },
};

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Community() {
  const { isLoggedIn, user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('feature');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/.netlify/functions/feedback')
      .then(r => r.json())
      .then(data => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Pre-fill name from auth
  useEffect(() => {
    if (user?.email && !name) {
      setName(user.email.split('@')[0]);
    }
  }, [user, name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const resp = await fetch('/.netlify/functions/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), message: message.trim(), type }),
      });
      const data = await resp.json();
      if (data.success && data.post) {
        setPosts(prev => [data.post, ...prev]);
        setMessage('');
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const filtered = filter === 'all' ? posts : posts.filter(p => p.type === filter);

  return (
    <div className="page-fullbg page-fullbg-community">
      <section className="page-hero">
        <div className="section-label">Community</div>
        <h2 className="section-title">Feedback & Ideas</h2>
        <p className="section-subtitle">Help shape the future of Axiarch. Share feature requests, report bugs, ask questions, or just say what you think.</p>
      </section>

      <section>
        {/* Submit form */}
        {!isLoggedIn ? (
          <div className="section-centered" style={{ paddingBottom: 'var(--space-8)' }}>
            <div style={{ maxWidth: '460px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)' }}>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Sign in to post</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                Enter your email to share feedback with the community.
              </p>
              <button onClick={() => setShowAuth(true)} className="btn-primary" style={{ width: '100%' }}>Sign In with Email</button>
            </div>
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} required />}
          </div>
        ) : (
          <div style={{ maxWidth: '640px', marginBottom: 'var(--space-8)' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setType(opt.key)}
                    className={`filter-chip${type === opt.key ? ' active' : ''}`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name (optional)"
                maxLength={50}
                className="watchlist-add-input"
                style={{ width: '100%', maxWidth: 'none', marginBottom: 'var(--space-2)', textTransform: 'none' }}
              />

              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What's on your mind? Feature ideas, bugs, questions..."
                maxLength={1000}
                rows={4}
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '0.7rem 0.9rem',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '80px',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-green)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {message.length}/1000
                </span>
                <button type="submit" className="btn-primary btn-sm" disabled={submitting || !message.trim()}>
                  {submitting ? 'Posting...' : 'Post Feedback'}
                </button>
              </div>

              {submitted && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-green)', marginTop: 'var(--space-2)' }}>
                  Thanks for your feedback!
                </p>
              )}
            </form>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          {[['all', 'All'], ['feature', 'Features'], ['bug', 'Bugs'], ['praise', 'Praise'], ['question', 'Questions']].map(([key, label]) => (
            <button key={key} className={`filter-chip${filter === key ? ' active' : ''}`} onClick={() => setFilter(key)}>
              {label} {key !== 'all' && <span style={{ opacity: 0.6 }}>({posts.filter(p => key === 'all' || p.type === key).length})</span>}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
            <span className="spinner" /> Loading feedback...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>No posts yet</p>
            <p style={{ fontSize: 'var(--text-sm)' }}>Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {filtered.map(post => {
              const meta = TYPE_META[post.type] || TYPE_META.feedback;
              return (
                <div key={post.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                    <div className="testimonial-avatar">{post.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{post.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{timeAgo(post.timestamp)}</div>
                    </div>
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-mono)',
                      color: meta.color,
                      border: `1px solid ${meta.color}`,
                      borderRadius: 'var(--radius-xs)',
                      padding: '0.15rem 0.5rem',
                      opacity: 0.8,
                    }}>
                      {meta.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
                    {post.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
