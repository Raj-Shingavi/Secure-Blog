const Navbar = () => {
    const token = localStorage.getItem('token');
    const navigate = ReactRouterDOM.useNavigate();

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        navigate('/login');
    };

    return (
        <nav className="nav">
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', margin: 0, padding: 0 }}>
                <div>
                    <ReactRouterDOM.Link to="/">SecureBlog</ReactRouterDOM.Link>
                </div>
                <div>
                    {token ? (
                        <>
                            <ReactRouterDOM.Link to="/create">Write Blog</ReactRouterDOM.Link>
                            <button onClick={logout} style={{ marginLeft: '1rem', background: 'transparent', color: '#111827', padding: 0 }}>Logout</button>
                        </>
                    ) : (
                        <>
                            <ReactRouterDOM.Link to="/login">Login</ReactRouterDOM.Link>
                            <ReactRouterDOM.Link to="/register">Register</ReactRouterDOM.Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) return <ReactRouterDOM.Navigate to="/login" />;
    return children;
};

const App = () => {
    const { BrowserRouter, Routes, Route } = ReactRouterDOM;

    // Components are globally available as window.Login, etc.
    // but React JSX needs them as capitalized variables in scope.
    const { Login, Register, BlogList, BlogCreate, BlogView, VersionHistory } = window;

    return (
        <BrowserRouter>
            <Navbar />
            <div className="container">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<ProtectedRoute><BlogList /></ProtectedRoute>} />
                    <Route path="/create" element={<ProtectedRoute><BlogCreate /></ProtectedRoute>} />
                    <Route path="/blogs/:id" element={<ProtectedRoute><BlogView /></ProtectedRoute>} />
                    <Route path="/blogs/:id/history" element={<ProtectedRoute><VersionHistory /></ProtectedRoute>} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

window.App = App;
