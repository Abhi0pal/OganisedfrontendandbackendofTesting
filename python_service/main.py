"""
FastAPI — AI Form Generate Service
Runs on port 8001 alongside the NestJS backend (port 3001).

Endpoints:
  GET  /health                 - Service + Ollama status
  GET  /api/meta               - Departments, services, form types, existing categories/fields
  POST /api/srs/upload         - Upload SRS file → extract text
  POST /api/srs/generate       - SRS text + context → Ollama JSON
  POST /api/srs/insert         - Approve generated JSON → DB insert (with versioning)
  GET  /api/forms              - List all generated forms
"""
import warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="langchain_google_genai")
import os
import json
import io
import pandas as pd
from typing import Any
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from srs_reader        import extract_text
from ai_service        import srs_text_to_json, check_ollama_connection, srs_to_document_checklist_json, srs_to_workflow_json, split_srs_sections, srs_to_pipeline_metadata, upload_srs_to_gemini, delete_gemini_file
from db_insert         import (
    insert_form, insert_documents_only, insert_workflow,
    get_existing_workflow, get_roles_for_context, insert_pipeline,insert_workflow_v2
)
from versioning        import check_version, deactivate_old_form, delete_old_form
from db                import get_connection, get_cursor
from validate_json     import validate_generated_json
from json_fixer        import fix_generated_json
from fastapi import APIRouter, HTTPException
from chatbot import *
import asyncio
from ai_mapping import get_ai_mapping
from migrator import run_migration
from typing import List
from migrator import run_excel_csv_migration,rollback_migration_batch
from waste_classifier import router as waste_router

app = FastAPI(
    title="SWCS AI Form Generator",
    version="1.0.0",
    description="Upload SRS → Ollama (qwen2.5-coder) → DB-ready JSON → Insert into m_fb_* tables",
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001","http://localhost:4000"],
    allow_methods=["*"],
    allow_headers=["*"],
    
)
app.include_router(waste_router)

# ── Pydantic Models ───────────────────────────────────────────────────────────

# In-memory cache: filename → bytes (cleared after generate call)
_file_cache: dict[str, bytes] = {}


class GenerateRequest(BaseModel):
    srs_text:      str
    department_id: int  = 0      # 0 = auto-extract from SRS via AI
    service_id:    str  = "NEW"  # "NEW" = auto-create from SRS via AI
    form_type_id:  int
    tenant_id:     int | None = None
    project_id:    int | None = None
    filename:      str = ""   # original filename — used for File API on large SRS


class InsertRequest(BaseModel):
    generated_json:    dict[str, Any]
    checklist_json:    dict[str, Any]
    workflow_json:     dict[str, Any] | None = None
    tenant_id:         int | None = None
    project_id:        int | None = None
    service_id:        str | None = None
    department_id:     int | None = None
    form_type_id:      int | None = None
    force_new_version: bool = False


# ── Debug ─────────────────────────────────────────────────────────────────────

@app.get("/api/env-check")
def env_check():
    """Quick check — shows live AI_MODE and whether keys are set (values not exposed)."""
    from dotenv import load_dotenv as _ld
    _ld(override=True)
    ai_mode = os.getenv("AI_MODE", "(not set)")
    openai_key = os.getenv("OPENAI_API_KEY", "")
    return {
        "AI_MODE":            ai_mode,
        "GEMINI_KEY1_set":    bool(os.getenv("GEMINI_API_KEY")),
        "GEMINI_KEY2_set":    bool(os.getenv("GEMINI_API_KEY2")),
        "GEMINI_KEY3_set":    bool(os.getenv("GEMINI_API_KEY3")),
        "OPENAI_KEY_set":     bool(openai_key) and not openai_key.startswith("sk-paste"),
        "OPENAI_MODEL":       os.getenv("OPENAI_MODEL", "gpt-4o"),
        "PORT":               os.getenv("PORT", "8001"),
        "active_provider":    ai_mode,
    }


@app.get("/api/debug")
def debug_meta():
    """Raw query debug — shows exact errors and column names for each table."""
    conn = get_connection()
    conn.autocommit = True
    cur  = get_cursor(conn)

    results = {}

    queries = {
        "services_active":    'SELECT id, service_id, service_name, department_id FROM m_service WHERE "isActive" = true LIMIT 3',
        "services_all":       "SELECT id, service_id, service_name, department_id FROM m_service LIMIT 3",
        "form_types_active":  'SELECT id, name, abbr FROM m_fb_form_types WHERE "isActive" = true LIMIT 5',
        "form_types_all":     "SELECT id, name, abbr FROM m_fb_form_types LIMIT 5",
        "service_columns":    "SELECT column_name FROM information_schema.columns WHERE table_name='m_service' ORDER BY ordinal_position",
        "formtypes_columns":  "SELECT column_name FROM information_schema.columns WHERE table_name='m_fb_form_types' ORDER BY ordinal_position",
    }

    for key, sql in queries.items():
        try:
            cur.execute(sql)
            results[key] = {"ok": True, "rows": [dict(r) for r in cur.fetchall()]}
        except Exception as e:
            results[key] = {"ok": False, "error": str(e)}

    cur.close()
    conn.close()
    return results


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    ollama = check_ollama_connection()
    return {
        "service": "SWCS AI Form Generator",
        "status":  "ok",
        "ollama":  ollama,
    }


# ── Meta — Dropdowns for upload form ─────────────────────────────────────────

@app.get("/api/meta")
def get_meta(tenant_id: int | None = None, project_id: int | None = None):
    """Return departments, services, form types, existing categories and fields."""
    conn = get_connection()
    conn.autocommit = True          # each query runs independently — no aborted-tx cascade
    cur  = get_cursor(conn)
    tenants = []
    projects = []

    try:
        cur.execute(
            "SELECT id, name, slug, tenant_id_code FROM tenants "
            "WHERE is_active = true ORDER BY name"
        )
        tenants = [dict(r) for r in cur.fetchall()]
    except Exception:
        tenants = []

    try:
        project_where = ["is_active = true"]
        project_params = []
        if tenant_id:
            project_where.append("tenant_id = %s")
            project_params.append(tenant_id)
        cur.execute(
            "SELECT id, tenant_id, name, code, project_id_code "
            f"FROM tenant_projects WHERE {' AND '.join(project_where)} ORDER BY name",
            project_params,
        )
        projects = [dict(r) for r in cur.fetchall()]
    except Exception:
        projects = []

    try:
        dept_where = ['d."isActive" = true']
        dept_params = []
        if tenant_id:
            dept_where.append("(d.tenant_id = %s OR d.tenant_id IS NULL)")
            dept_params.append(tenant_id)
        if project_id:
            dept_where.append(
                """EXISTS (
                    SELECT 1 FROM tenant_projects tp
                    WHERE tp.id = %s
                      AND (tp.department_id IS NULL OR d.id = tp.department_id::int)
                )"""
            )
            dept_params.append(project_id)
        cur.execute(
            f"SELECT d.id, d.name FROM m_departments d WHERE {' AND '.join(dept_where)} ORDER BY d.id",
            dept_params,
        )
        departments = [dict(r) for r in cur.fetchall()]
    except Exception:
        try:
            cur.execute("SELECT id, name FROM m_departments ORDER BY id")
            departments = [dict(r) for r in cur.fetchall()]
        except Exception:
            departments = []

    try:
        service_where = ['s."isActive" = true']
        service_params = []
        if tenant_id:
            service_where.append("(s.tenant_id = %s OR s.tenant_id IS NULL)")
            service_params.append(tenant_id)
        if project_id:
            service_where.append("(s.project_id = %s OR s.project_id IS NULL)")
            service_params.append(project_id)
        cur.execute(
            'SELECT s.id, s.service_id, s.service_name AS name, s.department_id, '
            's.tenant_id, s.project_id FROM m_service s '
            f"WHERE {' AND '.join(service_where)} ORDER BY s.id",
            service_params,
        )
        services = [dict(r) for r in cur.fetchall()]
    except Exception:
        try:
            cur.execute(
                "SELECT s.id, s.service_id, s.service_name AS name, s.department_id, "
                "s.tenant_id, s.project_id"
                " FROM m_service s ORDER BY s.id"
            )
            services = [dict(r) for r in cur.fetchall()]
        except Exception:
            services = []

    try:
        cur.execute('SELECT id, name, abbr FROM m_fb_form_types WHERE "isActive" = true ORDER BY id')
        form_types = [dict(r) for r in cur.fetchall()]
    except Exception:
        try:
            cur.execute("SELECT id, name, abbr FROM m_fb_form_types ORDER BY id")
            form_types = [dict(r) for r in cur.fetchall()]
        except Exception:
            form_types = []

    try:
        cur.execute(
            "SELECT id, category_name, category_code FROM m_fb_form_categories "
            "WHERE is_active = true ORDER BY id"
        )
        categories = [dict(r) for r in cur.fetchall()]
    except Exception:
        categories = []

    try:
        cur.execute(
            "SELECT id, name, formchk_id FROM m_fb_form_field "
            "WHERE is_formvar_active = true ORDER BY id"
        )
        fields = [dict(r) for r in cur.fetchall()]
    except Exception:
        fields = []

    cur.close()
    conn.close()

    return {
        "tenants":              tenants,
        "projects":             projects,
        "departments":          departments,
        "services":             services,
        "form_types":           form_types,
        "existing_categories":  categories,
        "existing_fields":      fields,
    }


# ── Step 1: Upload SRS file → extract text ───────────────────────────────────

@app.post("/api/srs/upload")
async def upload_srs(file: UploadFile = File(...)):
    """
    Upload PDF, DOCX, or TXT file.
    Returns extracted text for review before AI processing.
    """
    allowed = {"pdf", "docx", "doc", "txt"}
    ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""

    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Allowed: {', '.join(allowed)}"
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    try:
        text = extract_text(file.filename, content)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to read file: {str(e)}")

    # Cache file bytes for File API usage in generate step (large SRS)
    _file_cache[file.filename] = content

    return {
        "success":   True,
        "filename":  file.filename,
        "file_size": len(content),
        "text":      text,
        "text_length": len(text),
    }


# ── Step 2: Generate JSON from SRS text via Ollama ───────────────────────────

@app.post("/api/srs/generate")
def generate_json(req: GenerateRequest):
    """
    Send SRS text + context to Ollama (qwen2.5-coder) → DB-ready JSON.
    Returns JSON for admin preview before DB insert.
    """
    if not req.srs_text.strip():
        raise HTTPException(status_code=400, detail="srs_text cannot be empty")

    # Fetch existing DB data for AI context
    conn = get_connection()
    conn.autocommit = True
    cur  = get_cursor(conn)
    try:
        cur.execute(
            "SELECT id, category_name, category_code FROM m_fb_form_categories "
            "WHERE is_active = true ORDER BY id"
        )
        existing_cats = [dict(r) for r in cur.fetchall()]

        cur.execute(
            "SELECT id, name, formchk_id FROM m_fb_form_field "
            "WHERE is_formvar_active = true ORDER BY id"
        )
        existing_fields = [dict(r) for r in cur.fetchall()]

        cur.execute(
            "select id,master_name,master_code,description from master_tables WHERE is_active='1' ORDER BY id ASC"
        )
        existing_masters = [dict(r) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

    # Retrieve cached file bytes (set during /api/srs/upload)
    cached_bytes = _file_cache.pop(req.filename, None) if req.filename else None

    try:
        generated = srs_text_to_json(
            srs_text=req.srs_text,
            department_id=req.department_id,
            service_id=req.service_id,
            form_type_id=req.form_type_id,
            existing_categories=existing_cats,
            existing_fields=existing_fields,
            tenant_id=req.tenant_id,
            existing_masters=existing_masters,
            file_bytes=cached_bytes,
            filename=req.filename or None,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    # Auto-fix common AI mistakes before validation
    generated, fixes_applied = fix_generated_json(generated)
    generated.setdefault("meta", {})
    generated["meta"]["tenant_id"]     = req.tenant_id
    generated["meta"]["project_id"]    = req.project_id
    generated["meta"]["service_id"]    = req.service_id
    generated["meta"]["department_id"] = req.department_id
    generated["meta"]["form_type_id"]  = req.form_type_id

    # Auto-validate the fixed JSON
    try:
        validation = validate_generated_json(generated)
    except Exception as val_err:
        validation = {
            "is_valid": True,
            "errors": [],
            "warnings": [f"Validation skipped due to internal error: {val_err}"],
            "stats": {},
        }

    # Check versioning status
    version_info = check_version(
        department_id=req.department_id,
        service_id=req.service_id,
        form_type_id=req.form_type_id,
        new_payload=generated,
    )

    return {
        "success":        True,
        "generated_json": generated,
        "version_info":   version_info,
        "validation":     validation,   # ← errors/warnings shown in preview
        "fixes_applied":  fixes_applied,  # ← what was auto-corrected
        "summary":        validation["stats"],
    }


# ── Step 3: Approve & Insert into DB ─────────────────────────────────────────

@app.post("/api/srs/insert")
def insert_to_db(req: InsertRequest):
    """
    Admin approves generated JSON → insert into m_fb_* tables.
    Handles versioning automatically.
    """
    payload = req.generated_json
    meta    = payload.get("meta", {})
    if req.tenant_id is not None:
        meta["tenant_id"] = req.tenant_id
    if req.project_id is not None:
        meta["project_id"] = req.project_id

    dept_id     = meta.get("department_id")
    service_id  = meta.get("service_id")
    form_type_id = meta.get("form_type_id")

    if not all([dept_id, service_id, form_type_id]):
        raise HTTPException(
            status_code=400,
            detail="generated_json.meta must include department_id, service_id, form_type_id"
        )

    # Auto-fix before validation (handles any edits made in preview)
    payload, _ = fix_generated_json(payload)

    # Validate before insert — block if critical errors found
    validation = validate_generated_json(payload)
    if not validation["is_valid"]:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "JSON validation failed. Fix errors before inserting.",
                "errors":  validation["errors"],
                "warnings": validation["warnings"],
            }
        )

    # Determine version
    version_info = check_version(dept_id, service_id, form_type_id, payload)

    if version_info["action"] == "NO_CHANGE" and not req.force_new_version:
        return {
            "success": False,
            "action":  "NO_CHANGE",
            "message": "Form already exists with no changes detected. "
                       "No new version created. Pass force_new_version=true to override.",
            "existing_version": version_info["version"],
        }

    # force_new_version=True with NO_CHANGE → treat as NEW_VERSION (re-insert same data)
    if version_info["action"] == "NO_CHANGE" and req.force_new_version:
        version_info["action"] = "NEW_VERSION"

    if version_info["action"] == "NEW_VERSION":
        # Hard-delete old form — deactivate alone cannot release the unique constraint
        # on m_fb_form_mapping(department_id, service_id, form_type_id)
        delete_old_form(version_info["old_mapping_id"], service_id, form_type_id)

    form_version = version_info["version"]

    try:
        result = insert_form(payload, form_version=form_version)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB insert failed: {str(e)}")

    return {
        "success":      True,
        "action":       version_info["action"],
        "form_version": form_version,
        "mapping_id":   result["mapping_id"],
        "form_code":    result["form_code"],
        "service_id":   result["service_id"],
        "changes":      version_info.get("changes", []),
        "validation":   {"warnings": validation["warnings"]},
        "message": (
            f"Form inserted successfully as {form_version}."
            if version_info["action"] == "INSERT_NEW"
            else f"Form updated to {form_version}. Previous version deactivated."
        ),
    }


# ── List generated forms ──────────────────────────────────────────────────────

@app.get("/api/forms")
def list_forms():
    """List all AI-generated forms in m_fb_form_mapping."""
    conn = get_connection()
    cur  = get_cursor(conn)
    try:
        cur.execute(
            """SELECT
                   fm.id, fm.department_id, fm.service_id, fm.form_type_id,
                   fm.form_name, fm.form_code, fm.form_version, fm.is_active,
                   ft.name AS form_type_name,
                   COUNT(DISTINCT pm.id) AS page_count,
                   COUNT(DISTINCT bf.id) AS field_count
               FROM m_fb_form_mapping fm
               LEFT JOIN m_fb_form_types ft ON ft.id = fm.form_type_id
               LEFT JOIN m_fb_page_master pm ON pm.form_id = fm.id
               LEFT JOIN m_fb_form_builder_fields bf ON bf.form_id = fm.id
               GROUP BY fm.id, fm.department_id, fm.service_id, fm.form_type_id,
                        fm.form_name, fm.form_code, fm.form_version, fm.is_active, ft.name
               ORDER BY fm.id DESC"""
        )
        forms = [dict(r) for r in cur.fetchall()]
        return {"forms": forms, "total": len(forms)}
    finally:
        cur.close()
        conn.close()



@app.post("/api/checklist")
def test_document_checklist(srs_text: str = Form(...), service_id: str = Form(...)):

    conn = get_connection()
    conn.autocommit = True
    cur  = get_cursor(conn)

    try:
        cur.execute("""
            SELECT
                mfb.id,
                mfb.service_id,
                ms.service_name,
                mfb.form_id,
                ft.name AS form_type,
                mfb.page_id,
                pm.page_name,
                mfb.category_id,
                mc.category_name,
                mc.category_code,
                mff.formchk_id AS form_field_id,
                mff.name AS field_name,
                mfb.input_type,
                mffo.source_type,
                mffo.master_table_id,
                mffo.static_options

            FROM m_fb_form_builder_fields mfb

            INNER JOIN m_fb_form_categories mc
                ON mfb.category_id = mc.id

            INNER JOIN m_fb_page_master pm
                ON mfb.page_id = pm.id

            INNER JOIN m_fb_form_types ft
                ON mfb.form_id = ft.id

            INNER JOIN m_service ms
                ON mfb.service_id = ms.service_id

            INNER JOIN m_fb_form_field mff
                ON mfb.form_field_id = mff.id

            LEFT JOIN m_fb_formfield_options mffo
                ON mfb.id = mffo.builder_field_id
        """)

        existing_fields = [dict(r) for r in cur.fetchall()]

        cur.execute("""
        SELECT * FROM m_documenttypes 
        """)

        document_types=[dict(r) for r in cur.fetchall()]

        cur.execute("""
        SELECT * from m_document_master 
        """)

        document_master=[dict(r) for r in cur.fetchall()]



    finally:
        cur.close()
        conn.close()


    """
    Quick test endpoint to verify document checklist AI generation.
    No DB calls, no caching — just AI response.
    """

    try:
        result = srs_to_document_checklist_json(
            srs_text=srs_text,
            service_id=service_id,
            field_data=existing_fields,
            document_master=document_master,
            document_types=document_types
        )

        return result
        

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Checklist generation failed: {str(e)}"
        )

from fastapi import Body

@app.post("/api/insert")
def insert_checklist(payload: dict = Body(...)):

    conn = get_connection()
    conn.autocommit = False
    cur  = get_cursor(conn)

    try:
        # insert documents only
        payload, dcl_map = insert_documents_only(payload, cur)

        conn.commit()

        # STEP 2: Update service table
        if payload:
            cur.execute(
                """UPDATE m_service 
                SET "dms" = %s 
                WHERE service_id = %s""",
                (json.dumps(payload), "591.0")
            )

        conn.commit()

        return {
            "success": True,
            "dcl_map": dcl_map,
            "message": "Inserted + Updated service"
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Insertion failed: {str(e)}"
        )

    finally:
        cur.close()
        conn.close()


async def generate_full_payload_async(req):

    # ── FETCH CONTEXT (sync DB → wrap in thread) ───────
    def fetch_data():
        conn = get_connection()
        conn.autocommit = True
        cur = get_cursor(conn)

        try:
            cur.execute("""
                SELECT id, category_name, category_code 
                FROM m_fb_form_categories 
                WHERE is_active = true
            """)
            existing_cats = [dict(r) for r in cur.fetchall()]

            cur.execute("""
                SELECT id, name, formchk_id 
                FROM m_fb_form_field 
                WHERE is_formvar_active = true
            """)
            existing_fields = [dict(r) for r in cur.fetchall()]

            cur.execute("""
                SELECT id, master_name, master_code, description
                FROM master_tables
                WHERE is_active='1'
            """)
            existing_masters = [dict(r) for r in cur.fetchall()]

            # Also fetch tenant-scoped master_definitions so AI reuses existing ones
            try:
                md_where = "is_active = true"
                md_params: list = []
                if req.tenant_id:
                    md_where += " AND tenant_id = %s"
                    md_params.append(req.tenant_id)
                cur.execute(
                    f"SELECT id, name AS master_name, code AS master_code, description FROM master_definition WHERE {md_where} ORDER BY id",
                    md_params,
                )
                for row in cur.fetchall():
                    d = dict(row)
                    d["description"] = d.get("description") or ""
                    existing_masters.append(d)
            except Exception:
                pass

            cur.execute("SELECT * FROM m_documenttypes")
            document_types = [dict(r) for r in cur.fetchall()]

            cur.execute("SELECT * FROM m_document_master")
            document_master = [dict(r) for r in cur.fetchall()]

        finally:
            cur.close()
            conn.close()

        return existing_cats, existing_fields, existing_masters, document_types, document_master

    (
        existing_cats,
        existing_fields,
        existing_masters,
        document_types,
        document_master
    ) = await asyncio.to_thread(fetch_data)

    # Fetch roles + form_types for workflow agent
    def fetch_workflow_context():
        conn = get_connection()
        cur  = get_cursor(conn)
        try:
            roles = get_roles_for_context()
            try:
                cur.execute('SELECT id, name AS type_name FROM m_fb_form_types WHERE "isActive" = true ORDER BY id')
                fts = [dict(r) for r in cur.fetchall()]
                if not fts:
                    cur.execute("SELECT id, name AS type_name FROM m_fb_form_types ORDER BY id")
                    fts = [dict(r) for r in cur.fetchall()]
            except Exception:
                fts = []
            return roles, fts
        finally:
            cur.close()
            conn.close()

    roles, form_types = await asyncio.to_thread(fetch_workflow_context)
    file_bytes = _file_cache.get(req.filename)

    # ── One-time PDF upload: share across all agents ──────────────────────────
    # Upload the PDF once to Gemini Files API using the primary key, then pass
    # the same file object to Pass 0, Agent 1, Agent 2, and Agent 3.
    # This eliminates 3 redundant uploads and cuts total processing time ~60-70%.
    pre_uploaded = None
    pre_upload_key = None
    _shared_tmp_path = None

    if file_bytes and req.filename:
        _primary_key = os.getenv("GEMINI_API_KEY", "")
        _ai_mode = os.getenv("AI_MODE", "")
        if _primary_key and _ai_mode == "gemini":
            try:
                pre_uploaded, _shared_tmp_path = await asyncio.to_thread(
                    upload_srs_to_gemini, file_bytes, req.filename, _primary_key
                )
                pre_upload_key = _primary_key
                print(f"[main] Shared PDF upload done — all agents will reuse {pre_uploaded.name}")
            except Exception as _ue:
                print(f"[main] Shared upload failed ({_ue}) — each agent uploads independently")
                pre_uploaded = None

    # ── Section-aware token optimisation ─────────────────────────────────────
    # Split SRS text into 3 targeted sections so each agent only reads its part.
    # Agent 1 still uses File API (needs full doc for form fields).
    # Agents 2 & 3 use text-only mode with their specific section — avoids
    # re-processing the full PDF (~50K tokens) twice more.
    sections = split_srs_sections(req.srs_text)

    # ── Mock mode: simulate AI processing time (2.5 minutes) ─────────────────
    from dotenv import load_dotenv as _reload_dotenv
    _reload_dotenv(override=True)
    _current_ai_mode = os.getenv("AI_MODE", "")
    print(f"[main] AI_MODE={_current_ai_mode!r} (read fresh from .env)")
    if _current_ai_mode == "mock":
        await asyncio.sleep(100)   # 150 seconds = 2.5 minutes

    # ── ENABLED AGENTS — controlled from .env ENABLED_AGENTS ─────────────────
    # e.g. ENABLED_AGENTS=1       → sirf form
    #      ENABLED_AGENTS=1,2     → form + documents
    #      ENABLED_AGENTS=1,2,3,4 → sab
    load_dotenv(override=True)
    _enabled = {int(x.strip()) for x in os.getenv("ENABLED_AGENTS", "1,2,3,4").split(",") if x.strip().isdigit()}
    print(f"[main] ENABLED_AGENTS={sorted(_enabled)}")

    # ── Agent 1 — Form JSON (always required) ─────────────────────────────────
    try:
        form_json = await asyncio.to_thread(
            srs_text_to_json,
            srs_text=sections["form"],
            department_id=req.department_id,
            service_id=req.service_id,
            form_type_id=req.form_type_id,
            existing_categories=existing_cats,
            existing_fields=existing_fields,
            existing_masters=existing_masters,
            file_bytes=file_bytes,
            filename=req.filename or None,
            pre_uploaded=pre_uploaded,
            pre_upload_key=pre_upload_key,
        )
    except Exception as e:
        raise RuntimeError(f"[Agent 1 — Form JSON] Form generation failed: {e}")

    # ── Agents 2 & 3 — parallel after Agent 1 ────────────────────────────────
    # Extract FILE-type fields from Agent 1's output for Agent 2 context
    file_fields_context = [
        {
            "field_ref":    bf.get("field_ref", ""),
            "custom_label": bf.get("custom_label", ""),
            "is_required":  bf.get("is_required", "N"),
            "category_ref": bf.get("category_ref", ""),
        }
        for bf in form_json.get("builder_fields", [])
        if (bf.get("input_type") or "").lower() == "file"
    ]
    combined_field_data = list(existing_fields) + file_fields_context
    doc_section = sections.get("documents", "")
    # Use isolated doc section if successfully extracted, else full SRS text
    srs_for_agent2 = doc_section if doc_section and doc_section != req.srs_text else req.srs_text
    print(f"[Agent 2] FILE fields: {len(file_fields_context)}, SRS chars: {len(srs_for_agent2)}, isolated={doc_section != req.srs_text}")

    async def run_agent2():
        if 2 not in _enabled:
            return None, None
        try:
            result = await asyncio.to_thread(
                srs_to_document_checklist_json,
                srs_text=srs_for_agent2,
                service_id=req.service_id,
                field_data=combined_field_data,
                document_master=document_master,
                document_types=document_types,
                file_bytes=file_bytes,
                filename=req.filename or None,
                pre_uploaded=pre_uploaded,
                pre_upload_key=pre_upload_key,
            )
            return result, None
        except Exception as e:
            print(f"[Agent 2 — Document Checklist] WARNING: {e}")
            return None, str(e)

    async def run_agent3():
        if 3 not in _enabled:
            return None, None
        try:
            result = await asyncio.to_thread(
                srs_to_workflow_json,
                sections["workflow"],
                req.department_id,
                req.tenant_id,
                req.service_id,
                file_bytes,
                req.filename or None,
                pre_uploaded,
                pre_upload_key,
            )
            return result, None
        except Exception as e:
            err = f"[Agent 3 — Workflow] Workflow generation failed: {e}"
            print(err)
            return None, err

    (checklist_json, checklist_error), (workflow_json, workflow_error) = await asyncio.gather(
        run_agent2(),
        run_agent3(),
    )

    # ── Cleanup shared upload after all agents complete ───────────────────────
    if pre_uploaded and pre_upload_key:
        await asyncio.to_thread(
            delete_gemini_file, pre_uploaded, pre_upload_key, _shared_tmp_path
        )

    # ── Pipeline metadata — built from dropdown selections (no AI needed) ────────
    # tenant/project/dept/service IDs come from UI dropdowns, not AI extraction
    pipeline_metadata = {
        "tenant_id":     req.tenant_id,
        "project_id":    req.project_id,
        "department_id": req.department_id,
        "service_id":    req.service_id,
    }

    return {
        "form_json":         form_json,
        "checklist_json":    checklist_json,
        "checklist_error":   checklist_error,
        "workflow_json":     workflow_json,
        "workflow_error":    workflow_error,
        "pipeline_metadata": pipeline_metadata,
    }


@app.post("/api/srs/full-generate")
async def full_generate(req: GenerateRequest):

    if not req.srs_text.strip():
        raise HTTPException(status_code=400, detail="srs_text cannot be empty")

    try:
        result = await generate_full_payload_async(req)

        generated_form = result.get("form_json")
        generated, fixes_applied = fix_generated_json(generated_form)
        generated.setdefault("meta", {})
        generated["meta"]["tenant_id"]     = req.tenant_id
        generated["meta"]["project_id"]    = req.project_id
        generated["meta"]["service_id"]    = req.service_id
        generated["meta"]["department_id"] = req.department_id
        generated["meta"]["form_type_id"]  = req.form_type_id

        # Pipeline metadata from dropdown selections — no AI extraction
        generated["pipeline"] = result.get("pipeline_metadata") or {}

        try:
            validation = validate_generated_json(generated)
        except Exception as val_err:
            validation = {
                "is_valid": True,
                "errors": [],
                "warnings": [f"Validation skipped due to internal error: {val_err}"],
                "stats": {},
            }

        version_info = check_version(
            department_id=req.department_id,
            service_id=req.service_id,
            form_type_id=req.form_type_id,
            new_payload=generated,
        )

        return {
            "success":         True,
            "generated_json":  generated,
            "validation":      validation,
            "version_info":    version_info,
            "fixes_applied":   fixes_applied,
            "summary":         validation["stats"],
            "checklist_json":  result["checklist_json"],
            "checklist_error": result.get("checklist_error"),
            "workflow_json":   result.get("workflow_json"),
            "workflow_error":  result.get("workflow_error"),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Async generation failed: {str(e)}"
        )


@app.post("/api/srs/insert-full")
def insert_full_payload(req: InsertRequest):
    payload = req.generated_json
    checklist_payload = req.checklist_json
    
    # 1. METADATA VALIDATION (from insert_to_db)
    meta = payload.get("meta", {})
    if req.tenant_id is not None:
        meta["tenant_id"] = req.tenant_id
    if req.project_id is not None:
        meta["project_id"] = req.project_id
    if req.service_id is not None:
        meta["service_id"] = req.service_id
    if req.department_id is not None:
        meta["department_id"] = req.department_id
    if req.form_type_id is not None:
        meta["form_type_id"] = req.form_type_id
    dept_id = meta.get("department_id")
    service_id = meta.get("service_id")
    form_type_id = meta.get("form_type_id")

    if not all([dept_id, service_id, form_type_id]):
        raise HTTPException(status_code=400, detail="Metadata missing")

    # 2. AUTO-FIX & VALIDATE
    payload, _ = fix_generated_json(payload)

    # If truncation detected, run OpenAI continuation pass before final validation
    ff_count = len(payload.get("form_fields", []))
    bf_count = len(payload.get("builder_fields", []))
    if bf_count < ff_count:
        ai_mode = os.getenv("AI_MODE", "")
        print(f"[insert] Truncation detected ({bf_count}<{ff_count}), running continuation ({ai_mode})...")
        if ai_mode == "openai":
            from ai_service import _complete_builder_fields_openai
            payload = _complete_builder_fields_openai(payload)
        elif ai_mode == "gemini":
            from ai_service import _complete_builder_fields
            payload = _complete_builder_fields(payload)

    validation = validate_generated_json(payload)
    if not validation["is_valid"]:
        raise HTTPException(status_code=422, detail={"errors": validation["errors"]})

    # 3. VERSIONING (from insert_to_db)
    version_info = check_version(dept_id, service_id, form_type_id, payload)
    if version_info["action"] == "NO_CHANGE" and not req.force_new_version:
        return {"success": False, "message": "No changes detected."}

    # force_new_version=True with NO_CHANGE → treat as NEW_VERSION (re-insert same data)
    if version_info["action"] == "NO_CHANGE" and req.force_new_version:
        version_info["action"] = "NEW_VERSION"

    # 4. ATOMIC DATABASE TRANSACTION
    conn = get_connection()
    conn.autocommit = False
    cur = get_cursor(conn)

    try:
        # Step A: Hard-delete old form so unique constraint is released for re-insert
        if version_info["action"] == "NEW_VERSION":
            delete_old_form(version_info["old_mapping_id"], service_id, form_type_id)

        # Step B: Insert Form (from insert_to_db)
        form_version = version_info["version"]
        form_res = insert_form(payload, form_version=form_version)

        # Step C: Insert Documents (only if Agent 2 generated checklist)
        dms_payload, dcl_map = None, {}
        if checklist_payload and checklist_payload.get("documentTypes"):
            dms_payload, dcl_map = insert_documents_only(
                checklist_payload,
                cur,
                tenant_id=meta.get("tenant_id"),
                project_id=meta.get("project_id"),
            )

        # Step D: Update Service Table (from insert_checklist)
        if dms_payload:
            cur.execute(
                'UPDATE m_service SET "dms" = %s WHERE service_id = %s',
                (json.dumps(dms_payload), str(service_id))
            )

        # COMMIT EVERYTHING
        conn.commit()

        # Step E: Insert Workflow (non-atomic — separate commit, non-fatal)
        workflow_result = None
        if req.workflow_json:
            try:
                if req.workflow_json.get("workflow_definition") is not None:
                    # Patch AI-generated values with verified request-level values.
                    # AI may leave tenantId/departmentId/serviceId null or wrong.
                    wf_patch = req.workflow_json["workflow_definition"]
                    if not wf_patch.get("tenantId") and req.tenant_id:
                        wf_patch["tenantId"] = req.tenant_id
                    if not wf_patch.get("departmentId") and dept_id:
                        wf_patch["departmentId"] = int(dept_id)
                    if not wf_patch.get("serviceId") and service_id:
                        wf_patch["serviceId"] = str(service_id)
                    print(f"[workflow] Inserting: tenant={wf_patch.get('tenantId')}, dept={wf_patch.get('departmentId')}, svc={wf_patch.get('serviceId')}, code={wf_patch.get('code')}")
                    workflow_result = insert_workflow_v2(req.workflow_json)
                else:
                    workflow_result = insert_workflow(dept_id, service_id, req.workflow_json)

                # Insert officer forms — meta already has department_id, service_id, form_type_id
                for officer_form in req.workflow_json.get("officer_forms", []):
                    meta = officer_form.get("meta", {})
                    ftype_id = meta.get("form_type_id") or officer_form.get("form_type_id")
                    if not ftype_id:
                        continue
                    try:
                        # Ensure meta has all required fields
                        officer_form.setdefault("meta", {})
                        officer_form["meta"].setdefault("department_id", dept_id)
                        officer_form["meta"].setdefault("service_id", service_id)
                        officer_form["meta"].setdefault("tenant_id", meta.get("tenant_id"))
                        officer_form["meta"].setdefault("project_id", meta.get("project_id"))
                        officer_form["meta"]["form_type_id"] = ftype_id
                        insert_form(officer_form, form_version="v1")
                    except Exception:
                        pass
            except Exception as wf_err:
                print(f"[workflow] INSERT FAILED: {wf_err}")
                import traceback; traceback.print_exc()
                workflow_result = {"error": str(wf_err)}

        # 5. RESPONSE
        return {
            "success":      True,
            "action":       version_info["action"],
            "form_version": form_version,
            "mapping_id":   form_res["mapping_id"],
            "form_code":    form_res["form_code"],
            "service_id":   form_res["service_id"],
            "changes":      version_info.get("changes", []),
            "dcl_map":      dcl_map,
            "workflow":        workflow_result,
            "workflow_error":  workflow_result.get("error") if isinstance(workflow_result, dict) else None,
            "message":         f"Form {form_version}, Checklist" + (" and Workflow" if workflow_result and isinstance(workflow_result, dict) and "error" not in workflow_result else "") + " inserted successfully.",
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Atomic insert failed: {str(e)}")
    finally:
        cur.close()
        conn.close()


# ── Agent 3: Workflow Configuration ───────────────────────────────────────────

class WorkflowGenerateRequest(BaseModel):
    srs_text:      str
    department_id: int
    service_id:    str
    filename:      str = ""


class WorkflowInsertRequest(BaseModel):
    workflow_json: dict[str, Any]
    department_id: int
    service_id:    str
    force_replace: bool = False


@app.post("/api/workflow/generate")
async def generate_workflow(
    file: UploadFile = File(None),
    srs_text: str = Form(""),
    department_id: int = Form(...),
    service_id: str = Form(...),
):
    """
    Agent 3 — Generate workflow configuration JSON from SRS.
    Upload PDF file OR pass srs_text.
    """
    try:
        file_bytes = None
        filename   = ""

        if file:
            file_bytes = await file.read()
            filename   = file.filename
            _file_cache[filename] = file_bytes
            if not srs_text.strip():
                srs_text = extract_text(filename, file_bytes)

        if not srs_text.strip() and not file_bytes:
            raise HTTPException(status_code=400, detail="Provide a file or srs_text")

        # Fetch roles and form_types from DB as context for AI
        roles = get_roles_for_context()

        conn = get_connection()
        cur  = get_cursor(conn)
        try:
            cur.execute('SELECT id, name AS type_name FROM m_fb_form_types WHERE "isActive" = true ORDER BY id')
            form_types = [dict(r) for r in cur.fetchall()]
            if not form_types:
                cur.execute("SELECT id, name AS type_name FROM m_fb_form_types ORDER BY id")
                form_types = [dict(r) for r in cur.fetchall()]
        except Exception:
            form_types = []
        finally:
            cur.close()
            conn.close()

        # Fetch existing workflow steps (for info)
        existing = get_existing_workflow(department_id, service_id)

        # Generate workflow JSON via AI (workflow_steps + officer_forms)
        workflow_json = srs_to_workflow_json(
            srs_text=srs_text,
            department_id=department_id,
            service_id=service_id,
            roles=roles,
            form_types=form_types,
            file_bytes=file_bytes,
            filename=filename,
        )

        return {
            "success": True,
            "workflow_json": workflow_json,
            "existing_steps": len(existing),
            "roles_available": len(roles),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow generation failed: {str(e)}")


@app.post("/api/workflow/insert")
def insert_workflow_config(req: WorkflowInsertRequest):
    """
    Insert workflow configuration into c_application_workflow_configuration.
    Also inserts officer_forms into m_fb_* tables (one per department step).
    Set force_replace=True to overwrite existing workflow for this service.
    """
    try:
        existing = get_existing_workflow(req.department_id, req.service_id)

        if existing and not req.force_replace:
            return {
                "success": False,
                "message": f"Workflow already exists ({len(existing)} steps). Set force_replace=True to overwrite.",
                "existing_steps": len(existing),
            }

        # 1. Insert workflow steps
        result = insert_workflow(req.department_id, req.service_id, req.workflow_json)

        # 2. Insert officer forms (one per department step)
        officer_forms = req.workflow_json.get("officer_forms", [])
        forms_inserted = []
        forms_errors   = []
        for officer_form in officer_forms:
            try:
                meta = officer_form.get("meta", {})
                form_type_id = meta.get("form_type_id") or officer_form.get("form_type_id")
                if not form_type_id:
                    continue
                # Ensure meta has dept/service in case AI omitted them
                officer_form.setdefault("meta", {})
                officer_form["meta"].setdefault("department_id", req.department_id)
                officer_form["meta"].setdefault("service_id", req.service_id)
                officer_form["meta"]["form_type_id"] = form_type_id
                form_res = insert_form(officer_form, form_version="v1")
                forms_inserted.append({
                    "step": officer_form.get("step"),
                    "form_type_id": form_type_id,
                    "mapping_id": form_res.get("mapping_id"),
                })
            except Exception as form_err:
                forms_errors.append({
                    "step": officer_form.get("step"),
                    "error": str(form_err),
                })

        return {
            "success": True,
            "workflow_inserted": result["inserted"],
            "step_ids": result["step_ids"],
            "officer_forms_inserted": len(forms_inserted),
            "officer_forms_errors": forms_errors,
            "message": f"{result['inserted']} workflow steps + {len(forms_inserted)} officer forms inserted.",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow insert failed: {str(e)}")


@app.get("/api/workflow/{service_id}")
def get_workflow(service_id: str, department_id: int = 0):
    """Get existing workflow steps for a service."""
    try:
        conn = get_connection()
        cur  = get_cursor(conn)
        query = """
            SELECT id, step, role_id, jurisdiction_level, sla_hours,
                   action_allowed_json, transition_map_json, status, config_version
            FROM c_application_workflow_configuration
            WHERE service_id = %s
        """
        params = [service_id]
        if department_id:
            query += " AND department_id = %s"
            params.append(department_id)
        query += " ORDER BY config_version DESC, step ASC"

        cur.execute(query, params)
        steps = [dict(r) for r in cur.fetchall()]
        cur.close()
        conn.close()

        return {"success": True, "service_id": service_id, "steps": steps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Data-Migration

def extract_excel_headers(file_bytes: bytes, filename: str):
    """
    Read first sheet / csv and return headers only
    """
    try:
        if filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes), nrows=1)
        else:
            df = pd.read_excel(
                io.BytesIO(file_bytes),
                nrows=1
            )

        return list(df.columns)

    except Exception:
        return []

@app.post("/analyze-excel-csv")
async def analyze_excel_csv(
    files: list[UploadFile] = File(alias="files[]"),
    pg_script: str = Form(...)
):
    """
    Excel/CSV headers + PostgreSQL create script
    -> AI Mapping
    """
 
    if not files:
        raise HTTPException(
            status_code=400,
            detail="No files uploaded"
        )
 
    if not pg_script.strip():
        raise HTTPException(
            status_code=400,
            detail="PG script required"
        )
 
    try:
        all_headers = []
 
        for file in files:
            content = await file.read()
 
            headers = extract_excel_headers(
                content,
                file.filename
            )
 
            all_headers.extend(headers)
 
        # remove duplicates while preserving order
        all_headers = list(
            dict.fromkeys(all_headers)
        )
 
        if not all_headers:
            raise HTTPException(
                status_code=400,
                detail="No columns detected in uploaded files"
            )
 
        source_schema = ", ".join(
            all_headers
        )
 
        result = get_ai_mapping(
            source_schema,
            pg_script
        )
 
        return {
            "mappings": result.get(
                "mapping",
                []
            ),
            "accuracy": result.get(
                "accuracy",
                0
            ),
            "source_columns": all_headers,
            "target_columns": result.get(
                "target_columns",
                []
            )
        }
 
    except HTTPException:
        raise
 
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/migrate-excel-csv")
async def migrate_excel_csv(
    files: list[UploadFile] = File(alias="files[]"),
    pg_script: str = Form(...),
    mappings: str = Form(...),
    flag_column: str = Form(...),
    common_key: str = Form(...),
    migrated_val: int = Form(1)
):
    """
    Migrate uploaded Excel/CSV files to PostgreSQL
    using mappings finalized in frontend
    """

    pg_url = os.getenv("PG_CONN_STR")

    if not pg_url:
        raise HTTPException(
            status_code=500,
            detail="Missing PG_CONN_STR in .env"
        )

    if not files:
        raise HTTPException(
            status_code=400,
            detail="No files uploaded"
        )

    if not pg_script.strip():
        raise HTTPException(
            status_code=400,
            detail="PG script is required"
        )

    if not flag_column.strip():
        raise HTTPException(
            status_code=400,
            detail="Flag column is required"
        )
    if not common_key.strip():
        raise HTTPException(
            status_code=400,
            detail="Common key is required"
        )

    try:
        parsed_mappings = json.loads(mappings)

        if not isinstance(parsed_mappings, list) or not parsed_mappings:
            raise HTTPException(
                status_code=400,
                detail="Mappings must be a non-empty list"
            )

        uploaded_files = []

        for file in files:
            content = await file.read()

            if not content:
                continue

            uploaded_files.append({
                "filename": file.filename,
                "content": content
            })

        if not uploaded_files:
            raise HTTPException(
                status_code=400,
                detail="Uploaded files are empty"
            )

        result = run_excel_csv_migration(
            pg_url=pg_url,
            pg_script=pg_script,
            mappings=parsed_mappings,
            flag_column=flag_column,
            migrated_value=migrated_val,
            common_key=common_key,
            files=uploaded_files
        )

        return {
            "status": "success",
            "inserted_rows": result["inserted_rows"],
            "batch_id": result["batch_id"],
            "target_table": result["target_table"]
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
@app.post("/analyze")
async def analyze(data: dict = Body(...)):
    """
    Generate AI mapping + accuracy
    """

    ssms = data.get("ssms", "").strip()
    pg = data.get("pg", "").strip()

    if not ssms or not pg:
        raise HTTPException(
            status_code=400,
            detail="Both schemas are required."
        )

    print("\n──── ANALYZE REQUEST ────")
    print(f"SSMS: {len(ssms)} chars")
    print(f"PG:   {len(pg)} chars")

    try:
        result = get_ai_mapping(ssms, pg)

        return result

    except Exception as e:
        print("❌ ANALYZE ERROR:", e)

        return {
            "mapping": [],
            "accuracy": 0,
            "error": str(e)
        }

@app.post("/migrate")
async def migrate(data: dict = Body(...)):
    """
    Execute migration using:
    - AI mappings
    - Dynamic flag column
    - Dynamic conflict column
    """

    ssms_url = os.getenv("SSMS_CONN_STR")
    pg_url = os.getenv("PG_CONN_STR")

    mappings = data.get("mappings", [])
    migrated_val = data.get("migrated_val", 1)
    flag_column = data.get("flag_column", "")
    ssms = data.get("ssms", "").strip()
    pg = data.get("pg", "").strip()
    conflict_column = data.get("conflict_column", "id")

    if not ssms_url or not pg_url:
        return {
            "status": "failed",
            "error": "Missing DB connection strings in .env"
        }

    if not mappings:
        return {
            "status": "failed",
            "error": "No mappings provided"
        }

    print("\n──── MIGRATION REQUEST ────")
    print(f"Mappings: {len(mappings)}")
    print(f"Flag Column: {flag_column}")
    print(f"Flag Value: {migrated_val}")
    # print(f"Conflict Column: {conflict_column}")

    try:
        result = run_migration(
            ssms_url,
            pg_url,
            ssms,
            pg,
            mappings,
            migrated_val,
            flag_column
        )

        return {
            "status": "success" if result.get("success") else "failed",
            "inserted_rows": result.get("inserted_rows", 0),
            "batch_id": result.get("batch_id"),
            "target_table": result.get("target_table")
        }

    except Exception as e:
        print("❌ MIGRATION ERROR:", e)

        return {
            "status": "failed",
            "error": str(e)
        }
@app.post("/rollback")
async def rollback(data: dict = Body(...)):
    """
    Roll back a migration batch using batch_id
    """
    pg_url = os.getenv("PG_CONN_STR")
    pg = data.get("pg", "").strip()
    batch_id = data.get("batch_id", "").strip()

    if not pg_url:
        raise HTTPException(
            status_code=500,
            detail="Missing PG_CONN_STR in .env"
        )

    if not pg:
        raise HTTPException(
            status_code=400,
            detail="PostgreSQL create script is required"
        )

    if not batch_id:
        raise HTTPException(
            status_code=400,
            detail="batch_id is required"
        )

    try:
        result = rollback_migration_batch(
            pg_url=pg_url,
            pg_script=pg,
            batch_id=batch_id
        )

        return {
            "status": "success",
            "deleted_rows": result["deleted_rows"],
            "batch_id": result["batch_id"],
            "target_table": result["target_table"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Data-Migration



# ── Pipeline: Full SRS → DB in one shot ──────────────────────────────────────

class PipelineInsertRequest(BaseModel):
    pipeline: dict[str, Any]           # tenant/project/dept/master/service info
    form_payload: dict[str, Any]       # existing generated_json
    checklist_payload: dict[str, Any] | None = None
    workflow_payload:  dict[str, Any] | None = None
    force_new_version: bool = False


@app.post("/api/pipeline/insert")
def pipeline_insert(req: PipelineInsertRequest):
    """
    Full pipeline insert — creates all prerequisites then inserts form.
    Steps:
      1. Tenant (find or create by name)
      2. Project (find or create by name)
      3. Department (find or create by name)
      4. Master Definitions + Data
      5. Service (find or create)
      6-14. Form + Documents + Workflow
    """
    try:
        payload = {
            "pipeline":          req.pipeline,
            "form_payload":      req.form_payload,
            "checklist_payload": req.checklist_payload or {},
            "workflow_payload":  req.workflow_payload,
        }

        # Versioning check before inserting form
        meta         = req.form_payload.get("meta", {})
        # dept_id: meta may have 0 (AI placeholder) — fall back to dropdown selection
        dept_id      = meta.get("department_id") or req.pipeline.get("department_id")
        # service_id: meta may have "NEW" (AI placeholder) — fall back to dropdown selection
        service_id   = meta.get("service_id")
        if not service_id or service_id == "NEW":
            service_id = req.pipeline.get("service_id") or service_id
        form_type_id = meta.get("form_type_id")

        form_version = "v1"
        if dept_id and service_id and form_type_id:
            from versioning import check_version, delete_old_form
            version_info = check_version(dept_id, service_id, form_type_id, req.form_payload)
            if version_info["action"] == "NO_CHANGE" and not req.force_new_version:
                return {
                    "success": False,
                    "action":  "NO_CHANGE",
                    "message": "Form already exists with no changes. Pass force_new_version=true to override.",
                }
            if version_info["action"] == "NO_CHANGE" and req.force_new_version:
                version_info["action"] = "NEW_VERSION"
            if version_info["action"] == "NEW_VERSION":
                delete_old_form(version_info["old_mapping_id"], service_id, form_type_id)
            form_version = version_info["version"]

       # insert_pipeline delegates workflow insertion to insert_workflow_v2
        result = insert_pipeline(payload, form_version=form_version)

        # Collect final service_id from result
        svc_step = result["steps"].get("service", {})
        resolved_service_id = svc_step.get("service_id") or service_id

        return {
            "success":    True,
            "steps":      result["steps"],
            "form":       result.get("form"),
            "documents":  result.get("documents"),
            "workflow":   result.get("workflow"),
            "service_id": resolved_service_id,
            "message":    "Pipeline completed successfully.",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline insert failed: {str(e)}")


@app.get("/api/pipeline/meta")
def pipeline_meta():
    """Extended meta for pipeline mode — includes master definitions."""
    conn = get_connection()
    conn.autocommit = True
    cur  = get_cursor(conn)
    try:
        cur.execute("SELECT id, name, slug, tenant_id_code FROM tenants WHERE is_active = true ORDER BY name")
        tenants = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT id, tenant_id, name, code FROM tenant_projects WHERE is_active = true ORDER BY name")
        projects = [dict(r) for r in cur.fetchall()]

        cur.execute('SELECT id, name FROM m_departments WHERE "isActive" = true ORDER BY name')
        departments = [dict(r) for r in cur.fetchall()]

        cur.execute(
            "SELECT id, name, code FROM master_definition WHERE is_active = true ORDER BY name"
        )
        master_definitions = [dict(r) for r in cur.fetchall()]

        cur.execute(
            'SELECT id, service_id, service_name AS name, department_id FROM m_service WHERE "isActive" = true ORDER BY id'
        )
        services = [dict(r) for r in cur.fetchall()]

        cur.execute('SELECT id, name, abbr FROM m_fb_form_types WHERE "isActive" = true ORDER BY id')
        form_types = [dict(r) for r in cur.fetchall()]

        return {
            "tenants":            tenants,
            "projects":           projects,
            "departments":        departments,
            "master_definitions": master_definitions,
            "services":           services,
            "form_types":         form_types,
        }
    finally:
        cur.close()
        conn.close()

#chatbot APIs

# ======================================================
# RAG API
# ======================================================
from fastapi import Request

@app.post("/api/submit")
async def submit(request: Request):
    body = await request.json()

    query = body.get("query")
    policy = body.get("policy", "swm")
    session_id = body.get("session_id", str(uuid.uuid4()))

    if not query:
        raise HTTPException(status_code=400, detail="query required")

    history_aware_retriever = create_history_aware_retriever(
        llm,
        get_retriever(policy),
        contextualize_prompt
    )

    rag_chain = create_retrieval_chain(
        history_aware_retriever,
        qa_chain
    )

    conversational_chain = RunnableWithMessageHistory(
        rag_chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer"
    )

    output = conversational_chain.invoke(
        {"input": query},
        config={"configurable": {"session_id": session_id}}
    )

    html = markdown.markdown(output["answer"])
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup.find_all(["h1", "h2", "h3"]):
        tag.name = "h5"

    return {"response": str(soup)}


# ======================================================
# SPEECH → TEXT
# ======================================================
from fastapi import UploadFile, File, Form

@app.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    preferredLang: str = Form(...)
):
    audio_path = os.path.join("static/audio", "input_audio.wav")

    with open(audio_path, "wb") as f:
        f.write(await audio.read())

    with open(audio_path, "rb") as f:
        audio_base64 = base64.b64encode(f.read()).decode("utf-8")

    if preferredLang in ["hi", "kn"]:
        service_id = "ai4bharat/conformer-multilingual-all--gpu-t4"
    else:
        service_id = "ai4bharat/whisper--gpu-t4"

    payload = {
        "audioContent": audio_base64,
        "samplingRate": 16000,
        "serviceId": service_id,
        "sourceLanguage": preferredLang,
        "task": "asr"
    }

    response = requests.post(
        "https://admin.models.ai4bharat.org/inference/transcribe",
        headers={
            "Content-Type": "application/json",
            "Authorization": "YOUR_API_KEY"
        },
        json=payload
    )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=response.text)

    data = response.json()
    return {"transcribed_text": data["output"][0]["source"]}

# ======================================================
# TEXT TRANSLATION
# ======================================================
@app.post("/texttranslation")
async def texttranslation(
    input_text: str = Form(...),
    sourceLang: str = Form(...),
    targetLang: str = Form(...)
):
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'giaO7GT9gQwzcaRtj8_rbl6-IHu0YEpDZxaSKuAG0qo6ehipYa4rtXy9TFufb0jN'
    }

    # Same logic as your code
    soup = BeautifulSoup(input_text, 'html.parser')
    plain_text = soup.get_text()

    source_language = sourceLang
    target_language = targetLang

    transpayload = {
        "input": plain_text,
        "serviceId": "ai4bharat/indictrans--gpu-t4",
        "sourceLanguage": source_language,
        "targetLanguage": target_language,
        "task": "translation",
        "track": "true"
    }

    transendpoint = "https://admin.models.ai4bharat.org/inference/translate"

    response = requests.post(
        transendpoint,
        headers=headers,
        data=json.dumps(transpayload),
        verify=certifi.where()
    )

    # Same error handling logic (but FastAPI style)
    if response.status_code != 200:
        print(f"Error: {response.status_code}, {response.text}")
        raise HTTPException(status_code=500, detail=response.text)

    else:
        result = response.json()['output'][0]['target']

        return {
            "transtext": result
        }


# ======================================================
# TEXT → SPEECH
# ======================================================
@app.post("/texttospeechtranslation")
async def texttospeechtranslation(
    input_text: str = Form(...),
    conversation_in: str = Form(...)
):
    # Same logic
    conversion_in = conversation_in

    if conversion_in == "kn":
        serviceId = "ai4bharat/indic-tts-dravidian--gpu-t4"
    elif conversion_in in ["hi", "or"]:
        serviceId = "ai4bharat/indic-tts-indo-aryan--gpu-t4"
    else:
        serviceId = "ai4bharat/indic-tts-misc--gpu-t4"

    payload = {
        "gender": "female",
        "input": input_text,
        "samplingRate": 16000,
        "serviceId": serviceId,
        "sourceLanguage": conversion_in,
        "task": "tts",
        "track": "true"
    }

    end_point = "https://admin.models.ai4bharat.org/inference/convert"

    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'giaO7GT9gQwzcaRtj8_rbl6-IHu0YEpDZxaSKuAG0qo6ehipYa4rtXy9TFufb0jN'
    }

    response = requests.post(
        end_point,
        headers=headers,
        data=json.dumps(payload),
        verify=certifi.where()
    )

    if response.status_code != 200:
        print(f"Error: {response.status_code}, {response.text}")
        raise HTTPException(status_code=500, detail=response.text)

    else:
        data = response.json()

        audio_content_base64 = data['audio'][0]['audioContent']
        audio_data = base64.b64decode(audio_content_base64)

        unique_filename = f"output_audio_{uuid.uuid4()}.wav"
        file_path = os.path.join("static/audio", unique_filename)

        with open(file_path, "wb") as audio_file:
            audio_file.write(audio_data)

        return {
            "audio_file": f"/static/audio/{unique_filename}"
        }

# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)