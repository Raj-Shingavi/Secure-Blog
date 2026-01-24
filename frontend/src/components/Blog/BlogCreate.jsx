const BlogCreate = () => {
    const [title, setTitle] = React.useState('');
    const [content, setContent] = React.useState('');
    const [feedback, setFeedback] = React.useState(null);
    const [error, setError] = React.useState('');
    const navigate = ReactRouterDOM.useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFeedback(null);

        try {
            const res = await window.fetchWithAuth('/blogs', {
                method: 'POST',
                body: JSON.stringify({ title, content })
            });
            console.log(res);
            setFeedback({
                ai_score: res.ai_score,
                plagiarism: res.plagiarism_score,
                msg: res.msg
            });

            // Redirect after short delay
            setTimeout(() => navigate('/'), 3000);

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="card">
            <h2>Write New Blog</h2>

            {error && (
                <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {feedback && (
                <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    <p><strong>Success!</strong> {feedback.msg}</p>
                    <p>AI Probability: {feedback.ai_score}%</p>
                    <p>Plagiarism Score: {feedback.plagiarism}%</p>
                    <small>Redirecting...</small>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <label>Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required />

                <label>Content</label>
                <textarea rows="10" value={content} onChange={e => setContent(e.target.value)} required />

                <button type="submit">Publish</button>
            </form>
        </div>
    );
};

window.BlogCreate = BlogCreate;
