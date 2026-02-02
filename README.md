# SecureBlog 

**SecureBlog** is a modern, secure, and feature-rich blogging platform built with a high-performance **FastAPI** backend and a sleek **Vanilla HTML/CSS/JS** frontend. It focuses on security, user experience, and content integrity.

![SecureBlog UI](https://via.placeholder.com/800x400?text=SecureBlog+Preview)

## Key Features

## Security & Authentication
-   **JWT Authentication**: Secure login and registration flows using JSON Web Tokens.
-   **Role-Based Access**: Authors have full control over their content; readers are read-only.

## AI-Powered Content Analysis
-   **Real-time Analysis**: Every blog post is analyzed upon submission.
-   **AI Probability Score**: Determines the likelihood of content being AI-generated.
-   **Plagiarism Check**: Simulates a check for content uniqueness.

## Robust Version Control
-   **History Tracking**: Every edit creates a new version of the blog.
-   **Snapshots**: View the exact content of any previous version.
-   **Restore Capability**: Authors can instantly revert a blog to any previous state.
-   **Current Indicator**: Clearly marks which version is currently live.

## Blog Management
-   **CRUD Operations**: Create, Read, Update, and Delete blogs.
-   **"My Blogs" Dashboard**: A dedicated view for authors to manage their own posts.

---

## Tech Stack

### Backend
-   **Language**: Python 3.9+
-   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) - High performance, easy to learn.
-   **Database**: SQLite (built-in, zero config).
-   **Security**: `passlib` for hashing, `python-jose` for JWTs.

### Frontend
-   **Core**: HTML5, CSS3, JavaScript.

## Getting Started

## Prerequisites
-   Python 3.8 or higher installed.
-   Start the backend before launching the frontend.

## Backend Setup
Navigate to the `backend` folder and follow these steps:

```bash
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```
The backend API will run at http://127.0.0.1:8000.

### Frontend Setup
Since the frontend is pure static HTML/JS, you can serve it using any simple static server.

**Option A: Using Python (Simplest)**
Open a new terminal, navigate to the `frontend` folder:
```bash
cd frontend
python -m http.server 5500
```
Then visit `http://localhost:5500` in your browser.

**Option B: Live Server (VS Code)**
1.  Open `frontend/index.html` in VS Code.
2.  Right-click and select "Open with Live Server".

---

## Project Structure

```
BLOG/
├── backend/
│   ├── main.py             # Main application entry point & routes
│   ├── auth_utils.py       # Password hashing & JWT logic
│   ├── db_utils.py         # Database connection & query helpers
│   ├── analysis_utils.py   # AI & Plagiarism logic
│   ├── requirements.txt    # Python dependencies
│   └── blog.db             # SQLite database (auto-created)
│
├── frontend/
│   ├── index.html          # Single Page Application (SPA) entry point
│   ├── css/
│   │   └── style.css       # Global styles & glassmorphism themes
│   ├── js/
│       ├── app.js          # Routing, Views, and UI logic
│       └── api.js          # API helper functions
└── README.md               # Project documentation
```

## Accounts
You can register a new account, or use these pre-made test credentials (if `init_db` was run):
-   **User**: `testuser` / `password123`
-   **Admin**: `admin` / `admin123`

---

*Built with ❤️ for secure and modern blogging.*
