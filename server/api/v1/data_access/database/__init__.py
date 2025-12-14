import os

import psycopg2


def get_db_connection():
    """Create and return a database connection."""
    database_url = os.getenv("DATABASE_URL", "postgresql://artikel_user:artikel_pass@db:5432/artikel_db")

    # Parse DATABASE_URL if it's in URL format, otherwise use individual components
    if database_url.startswith("postgresql://"):
        conn = psycopg2.connect(database_url)
    else:
        # Fallback to individual environment variables
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "db"),
            port=os.getenv("DB_PORT", "5432"),
            database=os.getenv("DB_NAME", "artikel_db"),
            user=os.getenv("DB_USER", "artikel_user"),
            password=os.getenv("DB_PASSWORD", "artikel_pass"),
        )

    return conn

