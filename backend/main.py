from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import db_utils
import auth_utils
import analysis_utils
import os

app = FastAPI()

@app.on_event("startup")
def startup_event():
    db_utils.init_db()
    print("Database initialized on startup")

# --- Pydantic Models ---
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class BlogCreate(BaseModel):
    title: str
    content: str

class BlogUpdate(BaseModel):
    content: str
    change_description: str = "Updated content"

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- Dependencies ---
def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = auth_utils.decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    user_email = payload.get("sub")
    if user_email is None:
         raise HTTPException(status_code=401, detail="Invalid token payload")
    
    users = db_utils.execute_read_query("SELECT * FROM users WHERE email = %s", (user_email,))
    if not users:
        raise HTTPException(status_code=404, detail="User not found")
    return users[0]

# --- Auth Routes ---
@app.post("/auth/register")
async def register(user: UserRegister):
    hashed_pw = auth_utils.get_password_hash(user.password)
    
    # Check if user exists
    existing = db_utils.execute_read_query("SELECT * FROM users WHERE email = %s OR username = %s", (user.email, user.username))
    if existing:
         raise HTTPException(status_code=400, detail="User already exists")

    user_id = db_utils.execute_write_query(
        "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
        (user.username, user.email, hashed_pw)
    )
    return {"msg": "User created successfully", "user_id": user_id}

@app.post("/auth/login")
async def login(user: UserLogin):
    users = db_utils.execute_read_query("SELECT * FROM users WHERE email = %s", (user.email,))
    if not users or not auth_utils.verify_password(user.password, users[0]['password_hash']):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    token = auth_utils.create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "username": users[0]['username'], "user_id": users[0]['id']}

# --- Blog Routes ---
@app.get("/blogs")
def get_blogs(author_id: int = None):
    if author_id:
        return db_utils.execute_read_query("SELECT blogs.*, users.username as author_name FROM blogs JOIN users ON blogs.author_id = users.id WHERE blogs.author_id = %s ORDER BY created_at DESC", (author_id,))
    return db_utils.execute_read_query("SELECT blogs.*, users.username as author_name FROM blogs JOIN users ON blogs.author_id = users.id ORDER BY created_at DESC")

@app.get("/blogs/{blog_id}")
def get_blog(blog_id: int):
    blogs = db_utils.execute_read_query("SELECT blogs.*, users.username as author_name FROM blogs JOIN users ON blogs.author_id = users.id WHERE blogs.id = %s", (blog_id,))
    if not blogs:
        raise HTTPException(status_code=404, detail="Blog not found")
    return blogs[0]

@app.post("/blogs")
async def create_blog(blog: BlogCreate, current_user: dict = Depends(get_current_user)):
    # 1. Plagiarism Check
    all_blogs = db_utils.execute_read_query("SELECT content FROM blogs")
    existing_texts = [b['content'] for b in all_blogs]
    plagiarism_score = analysis_utils.calculate_plagiarism_score(blog.content, existing_texts)
    
    if plagiarism_score > 30: # Threshold
         raise HTTPException(status_code=400, detail=f"Plagiarism detected! Score: {plagiarism_score}%")

    # 2. AI Check (Information only, doesn't block)
    ai_score = analysis_utils.estimate_ai_probability(blog.content)

    # 3. Save Blog
    blog_id = db_utils.execute_write_query(
        "INSERT INTO blogs (title, content, author_id, plagiarism_score, ai_score) VALUES (%s, %s, %s, %s, %s)",
        (blog.title, blog.content, current_user['id'], int(plagiarism_score), int(ai_score))
    )

    # 4. Save Initial Version
    db_utils.execute_write_query(
        "INSERT INTO blog_versions (blog_id, content, change_description, version_number) VALUES (%s, %s, %s, %s)",
        (blog_id, blog.content, "Initial Publication", 1)
    )

    return {"msg": "Blog created", "blog_id": blog_id, "ai_score": ai_score, "plagiarism_score": plagiarism_score}

@app.put("/blogs/{blog_id}")
async def update_blog(blog_id: int, blog: BlogUpdate, current_user: dict = Depends(get_current_user)):
    # Get existing blog
    existing = db_utils.execute_read_query("SELECT * FROM blogs WHERE id = %s", (blog_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    if existing[0]['author_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized to edit this blog")

    # Get current max version
    versions = db_utils.execute_read_query("SELECT MAX(version_number) as v_num FROM blog_versions WHERE blog_id = %s", (blog_id,))
    next_version = (versions[0]['v_num'] or 0) + 1

    # Update Blog Table
    db_utils.execute_write_query("UPDATE blogs SET content = %s WHERE id = %s", (blog.content, blog_id))

    # Add to Versions Table
    db_utils.execute_write_query(
        "INSERT INTO blog_versions (blog_id, content, change_description, version_number) VALUES (%s, %s, %s, %s)",
        (blog_id, blog.content, blog.change_description, next_version)
    )

    return {"msg": "Blog updated", "version": next_version}

@app.delete("/blogs/{blog_id}")
async def delete_blog(blog_id: int, current_user: dict = Depends(get_current_user)):
    # Check existence
    existing = db_utils.execute_read_query("SELECT * FROM blogs WHERE id = %s", (blog_id,))
    if not existing:
         raise HTTPException(status_code=404, detail="Blog not found")
    
    # Check Auth
    if existing[0]['author_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized to delete this blog")

    # Delete (Cascading delete should handle versions if configured, but let's be safe/explicit if needed, 
    # assuming ON DELETE CASCADE is NOT set in schema for safety, we delete versions first or rely on DB)
    # Checking schema.sql would be good, but standard practice:
    # If foreign keys have ON DELETE CASCADE, deleting blog is enough.
    # Assuming standard setup.
    
    db_utils.execute_write_query("DELETE FROM blogs WHERE id = %s", (blog_id,))
    
    return {"msg": "Blog deleted successfully"}

@app.post("/blogs/{blog_id}/restore/{version_id}")
async def restore_blog_version(blog_id: int, version_id: int, current_user: dict = Depends(get_current_user)):
    # 1. Verify Blog Ownership
    blog = db_utils.execute_read_query("SELECT * FROM blogs WHERE id = %s", (blog_id,))
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog[0]['author_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 2. Get Version Content
    version = db_utils.execute_read_query("SELECT * FROM blog_versions WHERE id = %s AND blog_id = %s", (version_id, blog_id))
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    restored_content = version[0]['content']
    
    # 3. Create New Version (Restore)
    versions = db_utils.execute_read_query("SELECT MAX(version_number) as v_num FROM blog_versions WHERE blog_id = %s", (blog_id,))
    next_version = (versions[0]['v_num'] or 0) + 1

    db_utils.execute_write_query(
        "INSERT INTO blog_versions (blog_id, content, change_description, version_number) VALUES (%s, %s, %s, %s)",
        (blog_id, restored_content, f"Restored from Version {version[0]['version_number']}", next_version)
    )

    # 4. Update Main Blog
    db_utils.execute_write_query("UPDATE blogs SET content = %s WHERE id = %s", (restored_content, blog_id))

    return {"msg": f"Restored to version {version[0]['version_number']}", "new_version": next_version}

@app.get("/blogs/{blog_id}/versions")
def get_blog_versions(blog_id: int):
    return db_utils.execute_read_query("SELECT * FROM blog_versions WHERE blog_id = %s ORDER BY version_number DESC", (blog_id,))

@app.get("/init-db")
def initialize_database():
    db_utils.init_db()
    return {"msg": "Database initialized"}

# --- Static Files & SPA Fallback ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Robustly determine the paths relative to this file (main.py)
# main.py is in /backend, so we go up one level then into /frontend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

# Ensure the frontend directory exists
if not os.path.isdir(FRONTEND_DIR):
    print(f"Warning: Directory '{FRONTEND_DIR}' not found. Frontend will not be served.")

@app.get("/")
async def serve_root():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# Catch-all for React Routing (SPA)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Check if a file exists in frontend (e.g. index.css, assets)
    # We join robustly to avoid path traversal issues relative to frontend dir
    target_file = os.path.join(FRONTEND_DIR, full_path)
    
    if os.path.exists(target_file) and os.path.isfile(target_file):
         return FileResponse(target_file)
         
    # Fallback to index.html for SPA routing
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

if __name__ == "__main__":
    # Ensure tables exist on startup
    db_utils.init_db()
    
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
