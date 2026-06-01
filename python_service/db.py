import os
from urllib.parse import urlparse, unquote
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

# Get the URL from env or use the default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root%40123@localhost:5432/sws_uk")

def get_connection():
    # urlparse breaks the URL into components
    result = urlparse(DATABASE_URL)
    
    # unquote() converts %40 back into @
    username = result.username
    password = unquote(result.password) if result.password else None
    database = result.path[1:] # remove the leading '/'
    hostname = result.hostname
    port = result.port or 5432

    return psycopg2.connect(
        database=database,
        user=username,
        password=password,
        host=hostname,
        port=port
    )

def get_cursor(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)