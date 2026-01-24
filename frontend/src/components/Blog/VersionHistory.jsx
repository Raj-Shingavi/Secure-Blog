const VersionHistory = () => {
    const { id } = ReactRouterDOM.useParams();
    const [versions, setVersions] = React.useState([]);
    const [selectedVersion, setSelectedVersion] = React.useState(null);

    React.useEffect(() => {
        const loadVersions = async () => {
            try {
                const data = await window.fetchWithAuth(`/blogs/${id}/versions`);
                setVersions(data);
                if (data.length > 0) setSelectedVersion(data[0]);
            } catch (err) {
                console.error(err);
            }
        };
        loadVersions();
    }, [id]);

    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <ReactRouterDOM.Link to={`/blogs/${id}`}>&larr; Back to Blog</ReactRouterDOM.Link>
            </div>
            <h1>Version History</h1>

            <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ width: '30%' }}>
                    {versions.map(v => (
                        <div
                            key={v.id}
                            onClick={() => setSelectedVersion(v)}
                            className="card"
                            style={{
                                cursor: 'pointer',
                                border: selectedVersion?.id === v.id ? '2px solid #4f46e5' : 'transparent',
                                padding: '1rem'
                            }}
                        >
                            <h4>Version {v.version_number}</h4>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{new Date(v.created_at).toLocaleString()}</p>
                            <p style={{ fontStyle: 'italic' }}>{v.change_description}</p>
                        </div>
                    ))}
                </div>

                <div style={{ width: '70%' }} className="card">
                    {selectedVersion ? (
                        <>
                            <h3>Content Snapshot (v{selectedVersion.version_number})</h3>
                            <hr />
                            <div style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
                                {selectedVersion.content}
                            </div>
                        </>
                    ) : (
                        <p>Select a version to view content.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

window.VersionHistory = VersionHistory;
