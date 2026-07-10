#!/usr/bin/env python3
"""Crée ou met à jour les comptes TaskFlow depuis les variables d'environnement (jamais de mots de passe en Git)."""
import os
import sys

import bcrypt
import psycopg2


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def require(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        print(f"❌ Variable requise manquante : {name}", file=sys.stderr)
        sys.exit(1)
    return value


def main() -> None:
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql://taskflow:taskflow123@localhost:4002/taskflow_adhd",
    )

    owner_username = os.getenv("OWNER_USERNAME", "Pactivisme")
    owner_email = require("OWNER_EMAIL")
    owner_full_name = os.getenv("OWNER_FULL_NAME", "Paul Delhomme")
    owner_password = require("OWNER_PASSWORD")

    demo_username = os.getenv("DEMO_USERNAME", "demo")
    demo_email = os.getenv("DEMO_EMAIL", "demo@taskflow.local")
    demo_full_name = os.getenv("DEMO_FULL_NAME", "Compte Démo TaskFlow")
    demo_password = require("DEMO_PASSWORD")

    owner_hash = hash_password(owner_password)
    demo_hash = hash_password(demo_password)

    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (username, email, password_hash, full_name, is_active)
                VALUES (%s, %s, %s, %s, true)
                ON CONFLICT (username) DO UPDATE SET
                    email = EXCLUDED.email,
                    password_hash = EXCLUDED.password_hash,
                    full_name = EXCLUDED.full_name,
                    is_active = true
                """,
                (owner_username, owner_email, owner_hash, owner_full_name),
            )
            cur.execute(
                """
                INSERT INTO users (username, email, password_hash, full_name, is_active)
                VALUES (%s, %s, %s, %s, true)
                ON CONFLICT (username) DO UPDATE SET
                    email = EXCLUDED.email,
                    password_hash = EXCLUDED.password_hash,
                    full_name = EXCLUDED.full_name,
                    is_active = true
                """,
                (demo_username, demo_email, demo_hash, demo_full_name),
            )
            cur.execute("UPDATE users SET is_active = false WHERE username = 'admin'")
        conn.commit()
    finally:
        conn.close()

    print("✅ Comptes créés / mis à jour :")
    print(f"   Propriétaire : {owner_email} ({owner_username})")
    print(f"   Démo         : {demo_email} ({demo_username})")
    print("   Inscription publique : doit rester ALLOW_REGISTRATION=false en prod")


if __name__ == "__main__":
    main()
