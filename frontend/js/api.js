const API_URL = ''; // Relative path (served from same origin)

const loginUser = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Login failed');
    }
    return res.json();
};

const registerUser = async (username, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
};

const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        window.location.hash = '#/login'; // Redirect to hash login
        throw new Error('Unauthorized');
    }

    // Parse JSON if content exists
    const isJson = res.headers.get("content-type")?.includes("application/json");
    if (res.ok && isJson) return res.json();
    if (res.ok) return res.text();

    const err = isJson ? await res.json() : { detail: res.statusText };
    throw new Error(err.detail || 'Request failed');
};

const deleteBlog = async (id) => {
    return await fetchWithAuth(`/blogs/${id}`, {
        method: 'DELETE'
    });
};

const restoreBlogVersion = async (blogId, versionId) => {
    return await fetchWithAuth(`/blogs/${blogId}/restore/${versionId}`, {
        method: 'POST'
    });
};
