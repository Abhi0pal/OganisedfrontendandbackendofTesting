"""
Seeder: Insert roles, users, and department_users.
Mirrors the logic of seed-workflow.ts (Steps 1 & 2).

Usage:
  python c:\\xampp\\htdocs\\nextjs\\form_builder_final_v1\\python_service\\seed_roles_users.py
"""
import logging
from db import get_connection, get_cursor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("seed_roles_users")

# ── Configuration (matches seed-workflow.ts) ─────────────────────────────────
TENANT_ID     = 1
DEPARTMENT_ID = 1
PASSWORD_HASH = "$2b$10$jDGAlAO1.K2xBD3CTLRE7uFffWc49Dn6mybMc/rWBDoPS3arGHze2"

ROLE_DEFINITIONS = [
    {"name": "Divisional-Verifier"},
    {"name": "Divisional-Approver"},
]

USER_DEFINITIONS = [
    {
        "email": "divisional.verifier@test.com",
        "fullName": "Divisional Verifier User",
        "roleName": "Divisional-Verifier",
    },
    {
        "email": "divisional.approver@test.com",
        "fullName": "Divisional Approver User",
        "roleName": "Divisional-Approver",
    },
]


def seed_roles_and_users() -> dict:
    """
    Insert roles, users, and department_users into the database.

    Logic:
      1. For each role: check if exists (by name + tenant_id) → create if missing
      2. For each user: check if exists (by email) → create user + department_user if missing

    Returns:
      {
        "roles_created": [...],
        "roles_skipped": [...],
        "users_created": [...],
        "users_skipped": [...],
        "role_map": {"Divisional-Verifier": 42, ...}
      }
    """
    conn = get_connection()
    cur  = get_cursor(conn)

    role_map = {}        # roleName → DB id
    roles_created = []
    roles_skipped = []
    users_created = []
    users_skipped = []

    try:
        # ── STEP 1: Roles ────────────────────────────────────────────────────
        logger.info("📋 Step 1: Creating roles...")

        for role_def in ROLE_DEFINITIONS:
            name = role_def["name"]

            # Check if role already exists
            cur.execute(
                """SELECT id FROM roles
                   WHERE name = %s AND tenant_id = %s""",
                (name, TENANT_ID)
            )
            existing = cur.fetchone()

            if existing:
                role_map[name] = existing["id"]
                roles_skipped.append({"name": name, "id": existing["id"]})
                logger.info(f"  ⏭️  Role exists: {name} (id: {existing['id']})")
            else:
                cur.execute(
                    """INSERT INTO roles
                       (uid, name, tenant_id, is_active, "createdAt", "updatedAt")
                       VALUES (gen_random_uuid(), %s, %s, true, NOW(), NOW())
                       RETURNING id""",
                    (name, TENANT_ID)
                )
                new_id = cur.fetchone()["id"]
                role_map[name] = new_id
                roles_created.append({"name": name, "id": new_id})
                logger.info(f"  ✅ Created role: {name} (id: {new_id})")

        # ── STEP 2: Users + Department Users ─────────────────────────────────
        logger.info("👤 Step 2: Creating users...")

        for user_def in USER_DEFINITIONS:
            email     = user_def["email"]
            full_name = user_def["fullName"]
            role_name = user_def["roleName"]
            role_id   = role_map.get(role_name)

            if role_id is None:
                raise ValueError(
                    f"Role '{role_name}' not found in role_map. "
                    f"Available: {list(role_map.keys())}"
                )

            # Check if user already exists
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            existing = cur.fetchone()

            if existing:
                users_skipped.append({"email": email, "id": int(existing["id"])})
                logger.info(f"  ⏭️  User exists: {email}")
                continue

            # Insert user
            cur.execute(
                """INSERT INTO users
                   (uid, email, password_hash, password_algo, user_type,
                    role_id, tenant_id, is_email_verified, is_active,
                    created_at, updated_at)
                   VALUES (gen_random_uuid(), %s, %s, %s, %s::user_type,
                           %s, %s, %s, true,
                           NOW(), NOW())
                   RETURNING id""",
                (
                    email,
                    PASSWORD_HASH,
                    "bcrypt",
                    "DEPARTMENT",
                    role_id,
                    TENANT_ID,
                    1,
                )
            )
            user_id = cur.fetchone()["id"]

            # Insert department_user (linked to user)
            cur.execute(
                """INSERT INTO department_users
                   (user_id, full_name, email, dept_id,
                    tahsil_id, block_id, office_id, division_id,
                    is_for_testing, status,
                    created_at, updated_at)
                   VALUES (%s, %s, %s, %s,
                           %s, %s, %s, %s,
                           %s, %s,
                           NOW(), NOW())""",
                (
                    user_id,
                    full_name,
                    email,
                    DEPARTMENT_ID,
                    0,  # tahsil_id
                    0,  # block_id
                    0,  # office_id
                    0,  # division_id
                    0,  # is_for_testing
                    1,  # status (active)
                )
            )

            users_created.append({
                "email": email,
                "user_id": int(user_id),
                "role": role_name,
                "role_id": role_id,
            })
            logger.info(f"  ✅ Created user: {email} → {role_name} (user_id: {user_id})")

        # ── COMMIT ───────────────────────────────────────────────────────────
        conn.commit()
        logger.info("✅ Seeding complete!")

        return {
            "success": True,
            "roles_created": roles_created,
            "roles_skipped": roles_skipped,
            "users_created": users_created,
            "users_skipped": users_skipped,
            "role_map": role_map,
        }

    except Exception as e:
        conn.rollback()
        logger.error(f"❌ Seeding failed — rolled back. Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()


# ── CLI Entry Point ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json

    print("=" * 60)
    print(f"  SEEDER: Roles & Users for Tenant {TENANT_ID}")
    print("=" * 60)
    print()

    result = seed_roles_and_users()

    print()
    print("=" * 60)
    print("  ✅ RESULT")
    print("=" * 60)
    print(f"  Roles Created:  {len(result['roles_created'])}")
    print(f"  Roles Skipped:  {len(result['roles_skipped'])}")
    print(f"  Users Created:  {len(result['users_created'])}")
    print(f"  Users Skipped:  {len(result['users_skipped'])}")
    print(f"  Role Map:       {json.dumps(result['role_map'], indent=2)}")
    print()
    print(" 🔑 Login Credentials:")
    print(" ┌──────────────────────────────┬─────────────────────┐")
    print(" │ Email                        │ Role                │")
    print(" ├──────────────────────────────┼─────────────────────┤")
    print(" │ divisional.verifier@test.com │ Divisional-Verifier │")
    print(" │ divisional.approver@test.com │ Divisional-Approver │")
    print(" └──────────────────────────────┴─────────────────────┘")
    print(f" Password: Test@123 (bcrypt hash)")
    print(f" Tenant: {TENANT_ID} | Department: {DEPARTMENT_ID}")
    print("=" * 60)
