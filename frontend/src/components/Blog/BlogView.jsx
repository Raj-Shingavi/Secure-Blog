const BlogView = () => {
    const { id } = ReactRouterDOM.useParams();
    const [blog, setBlog] = React.useState(null);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editContent, setEditContent] = React.useState('');
    const [changeDesc, setChangeDesc] = React.useState('');
    const currentUserId = parseInt(localStorage.getItem('user_id'));

    React.useEffect(() => {
        loadBlog();
    }, [id]);

    const loadBlog = async () => {
        try {
            const data = await window.fetchWithAuth(`/blogs/${id}`);
            setBlog(data);
            setEditContent(data.content);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await window.fetchWithAuth(`/blogs/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    content: editContent,
                    change_description: changeDesc
                })
            });
            setIsEditing(false);
            setChangeDesc('');
            loadBlog(); // Reload
        } catch (err) {
            alert(err.message);
        }
    };

    if (!blog) return <div>Loading...</div>;

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>{blog.title}</h1>
                <div>
                    <ReactRouterDOM.Link to={`/blogs/${id}/history`} style={{ marginRight: '1rem', color: '#4f46e5' }}>View History</ReactRouterDOM.Link>
                    {blog.author_id === currentUserId && (
                        <button onClick={() => setIsEditing(!isEditing)}>
                            {isEditing ? 'Cancel Edit' : 'Edit'}
                        </button>
                    )}
                </div>
            </div>
            <p style={{ color: '#6b7280' }}>By {blog.author_name}</p>
            <hr style={{ margin: '1rem 0', border: '0', borderTop: '1px solid #e5e7eb' }} />

            {isEditing ? (
                <form onSubmit={handleUpdate}>
                    <textarea rows="15" value={editContent} onChange={e => setEditContent(e.target.value)} />
                    <label>Change Description (reason for edit):</label>
                    <input value={changeDesc} onChange={e => setChangeDesc(e.target.value)} placeholder="e.g. Fixed typos" required />
                    <button type="submit">Save New Version</button>
                </form>
            ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>{blog.content}</div>
            )}
        </div>
    );
};

window.BlogView = BlogView;
