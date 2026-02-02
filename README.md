# SecureBlog

A secure, modern blogging platform built with **FastAPI** (Backend) and **Vanilla HTML/CSS/JS** (Frontend).

## Features
- **User Authentication**: Secure Login/Register with JWT and bcrypt.
- **Modern UI**: Glassmorphism design, animated gradients, and responsive layout.
- **Blog Management**: Create, Edit, and View blogs.
- **Version History**: Track changes to your blog posts.
- **Content Analysis**: Integrated AI probability and Plagiarism detection scores.
- **Security**: XSS protection, SQL injection prevention (parameterized queries).

## Project Structure
- `backend/`: FastAPI application, database logic, and auth utilities.
- `frontend/`: Static assets (HTML, CSS, JS) served by the backend.

## 🚀 How to Run

### Prerequisite
Ensure you have **Python 3.8+** and **MySQL** installed.

### 1. Database Setup
Create a MySQL database named `secure_blog_db` (or allow the app to create it).
- Default user: `root`
- Default password: `` (empty)
*(Modify `backend/db_utils.py` if your credentials differ)*

### 2. Install Dependencies
Open a terminal in the `backend` directory:
```bash
cd backend
pip install -r requirements.txt
```

### 3. Launch the Application
Run the backend server (which serves the frontend):
```bash
python -m uvicorn main:app --reload
```

### 4. Access the Website
Open your browser and navigate to:
**[http://localhost:8000](http://localhost:8000)**

---
*Created by Antigravity*
