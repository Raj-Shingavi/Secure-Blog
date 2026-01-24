import mysql.connector
from mysql.connector import Error
import os
from contextlib import contextmanager

# Database Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "secure_blog_db")

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
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        # If database does not exist, try to create it (for initial setup)
        if e.errno == 1049: # Unknown database
             create_database()
             return mysql.connector.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME
            )
        return None

def create_database():
    """Creates the database if it doesn't exist."""
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = connection.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        print(f"Database '{DB_NAME}' created or already exists.")
        cursor.close()
        connection.close()
    except Error as e:
        print(f"Error creating database: {e}")

def init_db():
    """Initializes the database tables from schema.sql."""
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
        
        # Split statements by semicolon (simple parsing)
        commands = sql_script.split(';')
        
        for command in commands:
            cleaned_command = command.strip()
            if cleaned_command:
                cursor.execute(cleaned_command)
                
        conn.commit()
        print("Database tables initialized from schema.sql.")
        
    except FileNotFoundError:
        print(f"Error: Could not find schema.sql at {schema_path}")
    except Error as e:
        print(f"Error initializing database: {e}")
    finally:
        cursor.close()
        conn.close()

# ... (Previous configuration code remains the same until init_db)

@contextmanager
def get_db_cursor(commit=False):
    """Context manager for database connection and cursor."""
    conn = get_db_connection()
    if conn is None:
        yield None
        return
        
    cursor = conn.cursor(dictionary=True)
    try:
        yield cursor
        if commit:
            conn.commit()
    except Error as e:
        print(f"Database Error: {e}")
    finally:
        cursor.close()
        conn.close()

def execute_read_query(query, params=()):
    """Executes a read query (SELECT)."""
    with get_db_cursor(commit=False) as cursor:
        if cursor is None: return []
        cursor.execute(query, params)
        return cursor.fetchall()

def execute_write_query(query, params=()):
    """Executes a write query (INSERT, UPDATE, DELETE)."""
    with get_db_cursor(commit=True) as cursor:
        if cursor is None: return None
        cursor.execute(query, params)
        return cursor.lastrowid if query.strip().upper().startswith("INSERT") else cursor.rowcount
