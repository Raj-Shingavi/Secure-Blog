import mysql.connector
import os
from contextlib import contextmanager

# Database Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "blog_db")

def get_db_connection():
    """Establishes a connection to the MySQL database."""
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return connection
    except mysql.connector.Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def init_db():
    """Initializes the database tables from schema.sql."""
    # Note: This assumes the DATABASE itself exists. 
    # If not, we might need a separate step to CREATE DATABASE IF NOT EXISTS.
    
    try:
        # First connect without DB to ensure it exists
        conn_init = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor_init = conn_init.cursor()
        cursor_init.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        conn_init.commit()
        cursor_init.close()
        conn_init.close()
    except mysql.connector.Error as e:
        print(f"Error creating database: {e}")
        return

    conn = get_db_connection()
    if conn is None:
        print("Failed to connect to database for initialization.")
        return

    cursor = conn.cursor()
    
    # Path to schema.sql relative to this file
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    
    try:
        with open(schema_path, 'r') as f:
            sql_script = f.read()
            
        # MySQL connector's execute method doesn't support multiple statements by default
        # multi=True allows it.
        for result in cursor.execute(sql_script, multi=True):
            pass # Consume the generator
            
        conn.commit()
        print("Database tables initialized from schema.sql.")
        
    except FileNotFoundError:
        print(f"Error: Could not find schema.sql at {schema_path}")
    except mysql.connector.Error as e:
        print(f"Error initializing database: {e}")
    finally:
        cursor.close()
        conn.close()

@contextmanager
def get_db_cursor(commit=False):
    """Context manager for database connection and cursor."""
    conn = get_db_connection()
    if conn is None:
        yield None
        return
    
    # Dictionary cursor for dict-like results (similar to SQLite Row)
    cursor = conn.cursor(dictionary=True)
    
    try:
        yield cursor
        if commit:
            conn.commit()
    except mysql.connector.Error as e:
        print(f"Database Error: {e}")
    finally:
        cursor.close()
        conn.close()

def execute_read_query(query, params=()):
    """Executes a read query (SELECT)."""
    # MySQL uses %s, so no replacement needed if we stick to that standard.
    # But just in case any old SQLite ? crept in (though we were using %s in main.py)
    # query = query.replace('?', '%s') 
    
    with get_db_cursor(commit=False) as cursor:
        if cursor is None: return []
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return rows

def execute_write_query(query, params=()):
    """Executes a write query (INSERT, UPDATE, DELETE)."""
    # query = query.replace('?', '%s')
    
    with get_db_cursor(commit=True) as cursor:
        if cursor is None: return None
        cursor.execute(query, params)
        return cursor.lastrowid if query.strip().upper().startswith("INSERT") else cursor.rowcount
