const BlogList = () => {
    const [blogs, setBlogs] = React.useState([]);

    React.useEffect(() => {
        const loadBlogs = async () => {
            try {
                const data = await window.fetchWithAuth('/blogs');
                setBlogs(data);
            } catch (err) {
                console.error(err);
            }
        };
        loadBlogs();
    }, []);

    return (
        <div>
            <h1>All Blogs</h1>
            {blogs.map(blog => (
                <div key={blog.id} className="card">
                    <h3><ReactRouterDOM.Link to={`/blogs/${blog.id}`}>{blog.title}</ReactRouterDOM.Link></h3>
                    <p style={{ color: '#6b7280' }}>By {blog.author_name} on {new Date(blog.created_at).toLocaleDateString()}</p>
                    <p>{blog.content.substring(0, 150)}...</p>
                </div>
            ))}
        </div>
    );
};

window.BlogList = BlogList;
