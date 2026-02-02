// State
const state = {
    user: {
        token: localStorage.getItem('token'),
        username: localStorage.getItem('username'),
        id: localStorage.getItem('user_id')
    }
};

// Utility: Escape HTML to prevent XSS
const escapeHtml = (unsafe) => {
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Utility: Simple word-based diff
function diffWords(oldText, newText) {
    const oldWords = oldText.split(/\s+/);
    const newWords = newText.split(/\s+/);
    let output = '';
    let i = 0, j = 0;

    // Very basic greedy matching (LCS is better but complex for vanilla JS without libs, this is a "good enough" approximation for simple text)
    // Actually, let's do a slightly smarter loop to catch blocks.

    while (i < oldWords.length || j < newWords.length) {
        if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
            output += escapeHtml(oldWords[i]) + ' ';
            i++;
            j++;
        } else {
            // Check for immediate future match
            let foundMatch = false;
            // Look ahead in newText
            for (let k = 1; k < 5; k++) {
                if (j + k < newWords.length && oldWords[i] === newWords[j + k]) {
                    // Words were added
                    for (let x = 0; x < k; x++) {
                        output += `<span class="diff-add">${escapeHtml(newWords[j + x])}</span> `;
                    }
                    j += k;
                    foundMatch = true;
                    break;
                }
            }
            if (!foundMatch) {
                // Look ahead in oldText (Deletion)
                for (let k = 1; k < 5; k++) {
                    if (i + k < oldWords.length && oldWords[i + k] === newWords[j]) {
                        // Words removed
                        for (let x = 0; x < k; x++) {
                            output += `<span class="diff-remove">${escapeHtml(oldWords[i + x])}</span> `;
                        }
                        i += k;
                        foundMatch = true;
                        break;
                    }
                }
            }

            if (!foundMatch) {
                // If simple, treat as replace (delete old, add new)
                if (i < oldWords.length) {
                    output += `<span class="diff-remove">${escapeHtml(oldWords[i])}</span> `;
                    i++;
                }
                if (j < newWords.length) {
                    output += `<span class="diff-add">${escapeHtml(newWords[j])}</span> `;
                    j++;
                }
            }
        }
    }
    return output;
}

// Routing
const routes = {
    // '/': handled dynamically
    '/login': { view: renderLogin, protected: false },
    '/register': { view: renderRegister, protected: false },
    '/create': { view: renderBlogCreate, protected: true },
    '/my-blogs': { view: renderMyBlogs, protected: true },
    // Dynamic routes handled in router function
};

// entry point
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    router();
    window.addEventListener('hashchange', router);
});

async function router() {
    const app = document.getElementById('app');
    const hash = window.location.hash.slice(1) || '/';

    // Handle dynamic routes
    let matchedRoute = null;
    let params = {};

    if (hash === '' || hash === '/') {
        if (state.user.token) {
            matchedRoute = { view: renderBlogList, protected: true };
        } else {
            matchedRoute = { view: renderWelcome, protected: false };
        }
    } else if (routes[hash]) {
        matchedRoute = routes[hash];
    } else if (hash.startsWith('/blogs/') && hash.endsWith('/history')) {
        matchedRoute = { view: renderVersionHistory, protected: true };
        const id = hash.split('/')[2];
        params = { id };
    } else if (hash.startsWith('/blogs/')) {
        matchedRoute = { view: renderBlogView, protected: true };
        const id = hash.split('/')[2];
        params = { id };
    }

    if (!matchedRoute) {
        app.innerHTML = '<h2>404 - Not Found</h2>';
        return;
    }

    // Auth check
    if (matchedRoute.protected && !state.user.token) {
        window.location.hash = '/login';
        return;
    }

    // Render
    app.innerHTML = ''; // Clear current view
    await matchedRoute.view(app, params);
}

function updateNavbar() {
    const navLinks = document.getElementById('nav-links');
    if (state.user.token) {
        navLinks.innerHTML = `
            <a href="#/">🏠 Home</a>
            <a href="#/create">✍️ Write Blog</a>
            <a href="#/my-blogs">📂 My Blogs</a>
            <button id="logout-btn" class="btn-text">🚪 Logout</button>
        `;
        document.getElementById('logout-btn').addEventListener('click', logout);
    } else {
        navLinks.innerHTML = `
            <a href="#/login">🔑 Login</a>
            <a href="#/register">📝 Register</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
    state.user = { token: null, username: null, id: null };
    updateNavbar();
    window.location.hash = '/login';
}

// --- Views ---

async function renderWelcome(container) {
    container.innerHTML = `
        <div style="text-align: center; padding: 4rem 1rem;">
            <h1 style="font-size: 3.5rem; margin-bottom: 1rem; color: white; text-shadow: 0 4px 6px rgba(0,0,0,0.1);">Publish your passions, your way</h1>
            <p style="font-size: 1.5rem; color: rgba(255, 255, 255, 0.95); margin-bottom: 3rem; max-width: 600px; margin-left: auto; margin-right: auto;">
                Create a unique and beautiful blog easily.
            </p>
            <a href="#/create" class="btn-primary" style="
                display: inline-block;
                background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
                color: white;
                padding: 1rem 2.5rem;
                font-size: 1.2rem;
                border-radius: 50px;
                text-decoration: none;
                font-weight: 600;
                box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
                transition: transform 0.2s;
            ">Create your blog</a>
            
            <div style="margin-top: 5rem; display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
                 <div class="card" style="width: 250px; text-align: left;">
                    <h3 style="color: var(--primary)">Easy to use</h3>
                    <p class="text-muted">Simple editor to write down your thoughts instantly.</p>
                 </div>
                 <div class="card" style="width: 250px; text-align: left;">
                    <h3 style="color: var(--secondary)">Secure</h3>
                    <p class="text-muted">Built with security in mind to protect your content.</p>
                 </div>
                  <div class="card" style="width: 250px; text-align: left;">
                    <h3 style="color: var(--accent)">AI Powered</h3>
                    <p class="text-muted">Integrated AI tools to help you write better.</p>
                 </div>
            </div>
        </div>
    `;

    // Add specific hover effect via JS since it's inline for now (or could add class)
    const btn = container.querySelector('.btn-primary');
    btn.addEventListener('mouseenter', () => btn.style.transform = 'translateY(-3px)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'translateY(0)');
}

async function renderLogin(container) {
    container.innerHTML = `
        <div class="card auth-container">
            <h2>Login</h2>
            <div id="login-error" style="color: red; margin-bottom: 1rem; display: none;"></div>
            <form id="login-form">
                <label>Email</label>
                <input type="email" id="email" required />
                <label>Password</label>
                <input type="password" id="password" required />
                <button type="submit">Login</button>
            </form>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

        try {
            const data = await loginUser(email, password);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('user_id', data.user_id);
            state.user = {
                token: data.access_token,
                username: data.username,
                id: data.user_id
            };
            updateNavbar();
            window.location.hash = '/';
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
        }
    });
}

async function renderRegister(container) {
    container.innerHTML = `
        <div class="card auth-container">
            <h2>Register</h2>
            <div id="register-error" style="color: red; margin-bottom: 1rem; display: none;"></div>
            <form id="register-form">
                <label>Username</label>
                <input type="text" id="username" required />
                <label>Email</label>
                <input type="email" id="email" required />
                <label>Password</label>
                <input type="password" id="password" required />
                <button type="submit">Register</button>
            </form>
        </div>
    `;

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('register-error');

        try {
            await registerUser(username, email, password);
            window.location.hash = '/login';
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
        }
    });
}

async function renderBlogList(container) {
    container.innerHTML = '<h1>All Blogs</h1><div id="blog-list">Loading...</div>';

    try {
        const blogs = await fetchWithAuth('/blogs');
        const listContainer = document.getElementById('blog-list');

        if (!blogs || blogs.length === 0) {
            listContainer.innerHTML = '<p>No blogs found.</p>';
            return;
        }

        listContainer.innerHTML = blogs.map(blog => `
            <div class="card">
                <h3><a href="#/blogs/${blog.id}" style="text-decoration: none; color: inherit;">${escapeHtml(blog.title)}</a></h3>
                <p style="color: #6b7280">By ${escapeHtml(blog.author_name)} on ${new Date(blog.created_at).toLocaleDateString()}</p>
                <p>${escapeHtml(blog.content.substring(0, 150))}...</p>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        document.getElementById('blog-list').innerHTML = '<p>Error loading blogs.</p>';
    }
}

async function renderMyBlogs(container) {
    container.innerHTML = '<h1>My Blogs</h1><div id="my-blog-list">Loading...</div>';

    try {
        const userId = state.user.id;
        if (!userId) {
            container.innerHTML = '<p>Please log in.</p>';
            return;
        }

        const blogs = await fetchWithAuth(`/blogs?author_id=${userId}`);
        const listContainer = document.getElementById('my-blog-list');

        if (!blogs || blogs.length === 0) {
            listContainer.innerHTML = '<p>You haven\'t written any blogs yet.</p>';
            return;
        }

        listContainer.innerHTML = blogs.map(blog => `
            <div class="card">
                <h3><a href="#/blogs/${blog.id}" style="text-decoration: none; color: inherit;">${escapeHtml(blog.title)}</a></h3>
                <p style="color: #6b7280">By ${escapeHtml(blog.author_name)} on ${new Date(blog.created_at).toLocaleDateString()}</p>
                <div style="margin-bottom: 1rem;">${escapeHtml(blog.content.substring(0, 150))}...</div>
                 <a href="#/blogs/${blog.id}" style="color: var(--primary); font-weight: 500;">Read More &rarr;</a>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        document.getElementById('my-blog-list').innerHTML = '<p>Error loading your blogs.</p>';
    }
}

async function renderBlogCreate(container) {
    container.innerHTML = `
        <div class="card">
            <h2>Write New Blog</h2>
            <div id="create-error" style="background-color: #fee2e2; color: #ef4444; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; display: none;"></div>
            <div id="create-success" style="background-color: #d1fae5; color: #065f46; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; display: none;"></div>
            
            <form id="create-form">
                <label>Title</label>
                <input id="title" required />
                
                <label>Content</label>
                <textarea id="content" rows="10" required></textarea>
                
                <button type="submit">Publish</button>
            </form>
        </div>
    `;

    document.getElementById('create-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const errorDiv = document.getElementById('create-error');
        const successDiv = document.getElementById('create-success');

        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';

        try {
            const res = await fetchWithAuth('/blogs', {
                method: 'POST',
                body: JSON.stringify({ title, content })
            });

            successDiv.innerHTML = `
                <p><strong>Success!</strong> ${res.msg}</p>
                <p>AI Probability: ${res.ai_score}%</p>
                <p>Plagiarism Score: ${res.plagiarism_score}%</p>
                <small>Redirecting...</small>
            `;
            successDiv.style.display = 'block';

            setTimeout(() => {
                window.location.hash = '/';
            }, 3000);

        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
        }
    });
}

async function renderBlogView(container, params) {
    const { id } = params;
    container.innerHTML = 'Loading...';

    try {
        const blog = await fetchWithAuth(`/blogs/${id}`);
        const currentUserId = parseInt(state.user.id);
        const isAuthor = blog.author_id === currentUserId;

        renderBlogViewContent(container, blog, isAuthor);
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Error loading blog.</p>';
    }
}

function renderBlogViewContent(container, blog, isAuthor) {
    container.innerHTML = `
        <div class="card">
            <div class="flex-between">
                <h1>${escapeHtml(blog.title)}</h1>
                <div>
                    <a href="#/blogs/${blog.id}/history" style="margin-right: 1rem; color: var(--primary); font-weight: 500;">View History</a>
                    ${isAuthor ? `
                        <button id="edit-btn">Edit</button>
                        <button id="delete-btn" style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); margin-left: 0.5rem;">Delete</button>
                    ` : ''}
                </div>
            </div>
            <p style="color: #6b7280">By ${escapeHtml(blog.author_name)}</p>
            <hr style="margin: 1rem 0; border: 0; border-top: 1px solid #e5e7eb;"/>
            
            <div id="view-mode" style="white-space: pre-wrap;">${escapeHtml(blog.content)}</div>
            
            ${isAuthor ? `
            <div id="edit-mode" style="display: none;">
                <form id="edit-form">
                    <textarea id="edit-content" rows="15"></textarea>
                    <label>Change Description (reason for edit):</label>
                    <input id="change-desc" placeholder="e.g. Fixed typos" required />
                    <button type="submit">Save New Version</button>
                    <button type="button" id="cancel-edit-btn" style="background-color: #9ca3af; margin-left: 0.5rem;">Cancel</button>
                </form>
            </div>
            ` : ''}
        </div>
    `;

    if (isAuthor) {
        const editBtn = document.getElementById('edit-btn');
        const deleteBtn = document.getElementById('delete-btn');
        const editMode = document.getElementById('edit-mode');
        const viewMode = document.getElementById('view-mode');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        const editForm = document.getElementById('edit-form');
        const editContent = document.getElementById('edit-content');

        // Setup initial edit content
        editContent.value = blog.content;

        editBtn.addEventListener('click', () => {
            editBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
        });

        cancelBtn.addEventListener('click', () => {
            editBtn.style.display = 'inline-block';
            deleteBtn.style.display = 'inline-block';
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
        });

        deleteBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
                try {
                    await deleteBlog(blog.id);
                    window.location.hash = '/'; // Or /my-blogs
                } catch (err) {
                    alert(err.message);
                }
            }
        });

        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = editContent.value;
            const changeDesc = document.getElementById('change-desc').value;

            try {
                await fetchWithAuth(`/blogs/${blog.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        content: content,
                        change_description: changeDesc
                    })
                });
                // Reload view
                renderBlogView(container, { id: blog.id });
            } catch (err) {
                alert(err.message);
            }
        });
    }
}

async function renderVersionHistory(container, params) {
    const { id } = params;
    container.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <a href="#/blogs/${id}" style="text-decoration: none; color: white; opacity: 0.9;">&larr; Back to Blog</a>
        </div>
        <div class="flex-between">
            <h1 style="color: white;">Version History</h1>
        </div>
        <div style="display: flex; gap: 2rem;">
            <div id="version-list" style="width: 30%;">Loading...</div>
            <div id="version-content" style="width: 70%;" class="card">
                <p>Select a version to view content.</p>
            </div>
        </div>
    `;

    try {
        const versions = await fetchWithAuth(`/blogs/${id}/versions`);
        const blog = await fetchWithAuth(`/blogs/${id}`); // Need blog to check Author
        const currentUserId = parseInt(state.user.id);
        const isAuthor = blog.author_id === currentUserId;

        const listContainer = document.getElementById('version-list');
        const contentContainer = document.getElementById('version-content');

        if (versions.length === 0) {
            listContainer.innerHTML = '<p>No history.</p>';
            return;
        }

        const maxVersion = Math.max(...versions.map(v => v.version_number));

        const renderList = () => {
            listContainer.innerHTML = versions.map(v => `
                <div class="card version-item cursor-pointer" data-id="${v.id}" style="padding: 1rem; position: relative;">
                    ${v.version_number === maxVersion ?
                    '<span style="background: var(--primary); color: white; border-radius: 4px; padding: 2px 6px; font-size: 0.75rem; position: absolute; top: 10px; right: 10px;">Current</span>'
                    : ''}
                    <h4>Version ${v.version_number}</h4>
                    <p class="text-sm text-muted">${new Date(v.created_at).toLocaleString()}</p>
                    <p class="text-italic">${escapeHtml(v.change_description)}</p>
                </div>
            `).join('');

            // Re-attach listeners
            document.querySelectorAll('.version-item').forEach((item, index) => {
                item.addEventListener('click', () => {
                    document.querySelectorAll('.version-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    const v = versions[index];
                    renderContent(v);
                });
            });
        };

        const renderContent = (v) => {
            contentContainer.innerHTML = `
                <div class="flex-between">
                    <h3>Content Snapshot (v${v.version_number})</h3>
                     ${isAuthor && v.version_number !== maxVersion ?
                    `<button id="restore-btn" style="background-color: var(--secondary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Restore this Version</button>`
                    : ''}
                </div>
                <hr />
                <div style="white-space: pre-wrap; margin-top: 1rem; line-height: 1.6;">${escapeHtml(v.content)}</div>
            `;

            if (isAuthor && v.version_number !== maxVersion) {
                document.getElementById('restore-btn')?.addEventListener('click', async () => {
                    if (confirm(`Are you sure you want to restore Version ${v.version_number}? This will create a new version.`)) {
                        try {
                            await restoreBlogVersion(blog.id, v.id);
                            renderVersionHistory(container, params); // Reload
                        } catch (err) {
                            alert(err.message);
                        }
                    }
                });
            }
        };

        renderList();

        // Auto-select first (latest)
        if (versions.length > 0) {
            const firstItem = document.querySelector('.version-item');
            if (firstItem) firstItem.click();
        }

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Error loading history.</p>';
    }
}
