import json
import math
import os
import re
from difflib import SequenceMatcher

LEARNING_FILE = os.path.join(os.path.dirname(__file__), "learning.json")


# -----------------------------------------------------------------------------
# Learning memory
# -----------------------------------------------------------------------------

def load_learning():
    if not os.path.exists(LEARNING_FILE):
        return []

    try:
        with open(LEARNING_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception:
        return []


def save_learning(data):
    with open(LEARNING_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def is_valid_memory_entry(source, target, confidence):
    """
    Reject junk memory rows.
    """
    if not source or not target:
        return False

    source = str(source).strip()
    target = str(target).strip()

    if source.upper() == "N/A" or target.upper() == "N/A":
        return False

    if source in {"2)", "3)", "4)", "-", "--"} or target in {"2)", "3)", "4)", "-", "--"}:
        return False

    if len(source) < 2 or len(target) < 2:
        return False

    if confidence is None:
        confidence = 0

    return float(confidence) >= 60


def update_learning(mappings):
    memory = load_learning()

    for m in mappings:
        source = str(m.get("source", "")).strip()
        target = str(m.get("target", "")).strip()
        confidence = float(m.get("confidence", 0) or 0)

        if not is_valid_memory_entry(source, target, confidence):
            continue

        new_entry = {
            "source": source,
            "target": target,
            "confidence": confidence
        }

        found = False

        for existing in memory:
            if (
                str(existing.get("source", "")).strip().lower() == source.lower()
                and str(existing.get("target", "")).strip().lower() == target.lower()
            ):
                found = True

                old_conf = float(existing.get("confidence", 0) or 0)
                if confidence > old_conf:
                    existing["confidence"] = confidence
                break

        if not found:
            memory.append(new_entry)

    save_learning(memory)


def get_learned_mapping():
    """
    Returns best learned mapping per normalized source.
    Only keeps strong mappings.
    """
    memory = load_learning()
    learned = {}

    for item in memory:
        src = str(item.get("source", "")).strip()
        tgt = str(item.get("target", "")).strip()
        conf = float(item.get("confidence", 0) or 0)

        if not is_valid_memory_entry(src, tgt, conf):
            continue

        key = normalize_name(src)

        if not key:
            continue

        if key not in learned or conf > learned[key]["confidence"]:
            learned[key] = {
                "target": tgt,
                "confidence": conf
            }

    return learned


# -----------------------------------------------------------------------------
# Name normalization and tokenization
# -----------------------------------------------------------------------------

STOPWORDS = {
    "tbl", "table", "col", "column", "field", "data", "info", "value"
}

SYNONYMS = {
    "id": {"id", "code", "no", "number", "num", "key"},
    "name": {"name", "fullname", "full_name", "title"},
    "email": {"email", "emailid", "email_id", "mail", "mailid"},
    "mobile": {"mobile", "mobileno", "mobile_no", "phone", "phoneno", "phone_no", "contact", "stdcode"},
    "country": {"country", "countrycode", "country_code"},
    "state": {"state", "stateid", "state_code"},
    "district": {"district", "districtid"},
    "city": {"city", "town"},
    "address": {"address", "addr"},
    "pincode": {"pincode", "pin", "zipcode", "zip"},
    "date": {"date", "dt"},
    "created": {"created", "creation", "createddate", "created_at"},
    "updated": {"updated", "modified", "updated_at", "modified_at"},
    "start": {"start", "from"},
    "end": {"end", "to"},
    "amount": {"amount", "amt", "value", "price", "cost"},
    "status": {"status", "state"},
    "description": {"description", "desc", "details"},
    "user": {"user", "usr"},
    "password": {"password", "passwd", "pwd", "passwordhash", "password_hash"},
    "hash": {"hash", "hashed"},
    "success": {"success", "is_success", "flag"},
    "product": {"product", "item"},
    "category": {"category", "cat"},
    "order": {"order", "ord"},
    "customer": {"customer", "cust", "client"},
    "invoice": {"invoice", "inv"},
    "account": {"account", "acct", "acc"},
    "transaction": {"transaction", "txn", "tran"},
    "branch": {"branch", "branchcode"},
    "campaign": {"campaign"},
    "event": {"event"},
    "entity": {"entity"},
    "session": {"session"},
    "action": {"action", "act"},
    "target": {"target"},
    "line": {"line", "item"},
    "warehouse": {"warehouse", "godown"},
    "location": {"location", "loc"},
    "quantity": {"quantity", "qty"},
    "open": {"open", "opened"},
    "business": {"business", "biz"},
    "existing": {"existing", "current"},
    "proposed": {"proposed", "new"},
    "employee": {"employee", "emp"},
    "gst": {"gst", "gstno", "gstnumber"},
    "b2c": {"b2c"},
    "corporate": {"corp", "corporate"},
    "correspondence": {"corr", "correspondence"},
    "code": {"code"},
    "type": {"type"},
    "agent": {"agent"},
    "balance": {"balance"},
    "currency": {"currency", "currencycode"},
    "delivery": {"delivery"},
    "auth": {"auth", "authorization"},
    "paid": {"paid", "payment"},
    "image": {"image", "images", "img"}
}


IMPORTANT_WEIGHTS = {
    "id": 1.8,
    "name": 1.5,
    "email": 1.7,
    "mobile": 1.6,
    "date": 1.5,
    "created": 1.4,
    "updated": 1.4,
    "amount": 1.5,
    "status": 1.3,
    "gst": 1.5,
    "quantity": 1.4,
    "currency": 1.4,
    "address": 1.2,
    "state": 1.2,
    "district": 1.2,
    "city": 1.2,
    "pincode": 1.2,
    "country": 1.2,
    "password": 1.8,
    "hash": 1.8,
}


def expand_camel_case(text: str) -> str:
    text = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", text)
    text = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", text)
    return text


def normalize_name(name: str) -> str:
    if not name:
        return ""

    name = str(name).strip()
    name = name.replace("[", " ").replace("]", " ")
    name = name.replace('"', " ").replace("'", " ")
    name = expand_camel_case(name)
    name = name.replace("-", "_").replace("/", "_").replace(".", "_")
    name = re.sub(r"[^A-Za-z0-9_]+", "_", name)
    name = re.sub(r"_+", "_", name).strip("_")
    return name.lower()


def split_compound_token(token: str):
    """
    Break things like:
    userid -> user id
    emailid -> email id
    gstno -> gst no
    createddate -> created date
    corraddress -> corr address
    """
    if not token:
        return []

    pieces = [token]

    suffixes = [
        "addressline1", "addressline2",
        "countrycode", "mobilecode",
        "emailid", "userid", "productid", "categoryid", "customerid",
        "supplierid", "campaignid", "invoiceid", "orderid", "sessionid",
        "eventid", "entityid", "targetid", "leadid", "stockid", "acctid",
        "custid", "poid", "txnid", "itemid", "banktxnid",
        "createddate", "updateddate", "startdate", "enddate",
        "opendate", "orderdate", "deliverydate", "invoicedate",
        "duedate", "pincode", "mobilecountrycode", "stdcode",
        "passwordhash", "countrycode", "currencycode", "discountcode",
        "gstno", "gstnumber"
    ]

    for suf in suffixes:
        if token.endswith(suf) and token != suf:
            root = token[:-len(suf)]
            if root:
                pieces = [root, suf]
                break

    final_tokens = []
    for p in pieces:
        subs = re.findall(r"[a-z]+|[0-9]+", p)
        final_tokens.extend(subs)

    return final_tokens


def canonical_token(token: str) -> str:
    t = token.lower().strip()

    if not t:
        return ""

    if t in STOPWORDS:
        return ""

    for canon, variants in SYNONYMS.items():
        if t == canon or t in variants:
            return canon

    return t


def tokenize(name: str):
    norm = normalize_name(name)

    if not norm:
        return []

    base_parts = re.split(r"[_\s]+", norm)
    tokens = []

    for part in base_parts:
        tokens.extend(split_compound_token(part))

    canonical = []
    for token in tokens:
        c = canonical_token(token)
        if c:
            canonical.append(c)

    # unique while preserving order
    seen = set()
    result = []
    for t in canonical:
        if t not in seen:
            seen.add(t)
            result.append(t)

    return result


# -----------------------------------------------------------------------------
# Scoring
# -----------------------------------------------------------------------------

def sequence_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, normalize_name(a), normalize_name(b)).ratio()


def weighted_jaccard(src_tokens, tgt_tokens):
    if not src_tokens or not tgt_tokens:
        return 0.0

    src_set = set(src_tokens)
    tgt_set = set(tgt_tokens)

    inter = src_set & tgt_set
    union = src_set | tgt_set

    if not union:
        return 0.0

    def weight(token):
        return IMPORTANT_WEIGHTS.get(token, 1.0)

    num = sum(weight(t) for t in inter)
    den = sum(weight(t) for t in union)

    if den == 0:
        return 0.0

    return num / den


def ordered_overlap_bonus(src_tokens, tgt_tokens):
    """
    Bonus if major tokens appear in similar order.
    """
    common = [t for t in src_tokens if t in tgt_tokens]

    if not common:
        return 0.0

    score = len(common) / max(len(src_tokens), len(tgt_tokens))
    return min(score, 1.0)


def role_conflict_penalty(src_tokens, tgt_tokens):
    """
    Penalize bad semantic mismatches like:
    user_id -> user_name
    password -> password_hash gets a mild penalty, not full reject
    email -> state
    """
    src_set = set(src_tokens)
    tgt_set = set(tgt_tokens)

    penalty = 0.0

    role_groups = [
        {"id", "name"},
        {"email", "mobile"},
        {"date", "amount"},
        {"state", "district", "city", "pincode", "country"},
    ]

    for group in role_groups:
        src_hit = group & src_set
        tgt_hit = group & tgt_set

        if src_hit and tgt_hit and src_hit != tgt_hit:
            penalty += 0.10

    # Special case: password -> password_hash is related, so mild reduction only
    if "password" in src_set and "hash" in tgt_set:
        penalty -= 0.05

    return max(0.0, penalty)


def token_similarity(src, tgt):
    src_tokens = tokenize(src)
    tgt_tokens = tokenize(tgt)

    if not src_tokens or not tgt_tokens:
        return 0.0

    jacc = weighted_jaccard(src_tokens, tgt_tokens)
    seq = sequence_similarity(src, tgt)
    order = ordered_overlap_bonus(src_tokens, tgt_tokens)
    penalty = role_conflict_penalty(src_tokens, tgt_tokens)

    exact_norm_bonus = 0.0
    if normalize_name(src) == normalize_name(tgt):
        exact_norm_bonus = 0.25

    prefix_bonus = 0.0
    if normalize_name(src).startswith(normalize_name(tgt)) or normalize_name(tgt).startswith(normalize_name(src)):
        prefix_bonus = 0.08

    score = (
        0.52 * jacc +
        0.23 * seq +
        0.15 * order +
        exact_norm_bonus +
        prefix_bonus -
        penalty
    )

    return round(max(0.0, min(score, 1.0)), 6)


# -----------------------------------------------------------------------------
# SQL parsing
# -----------------------------------------------------------------------------

def extract_columns(sql):
    columns = []

    sql = str(sql or "").replace("\r", "")

    match = re.search(r"\((.*)\)", sql, re.DOTALL)
    if not match:
        return []

    body = match.group(1)

    parts = []
    current = ""
    bracket_level = 0

    for char in body:
        if char == "(":
            bracket_level += 1
        elif char == ")":
            bracket_level -= 1

        if char == "," and bracket_level == 0:
            parts.append(current.strip())
            current = ""
        else:
            current += char

    if current:
        parts.append(current.strip())

    for line in parts:
        line = line.strip()

        if not line:
            continue

        upper_line = line.upper()
        if any(x in upper_line for x in [
            "CONSTRAINT", "PRIMARY KEY", "FOREIGN KEY", "REFERENCES", "UNIQUE"
        ]):
            continue

        match_sq = re.match(r"\[([^\]]+)\]", line)
        if match_sq:
            columns.append(match_sq.group(1))
            continue

        parts_line = line.split()

        if len(parts_line) > 0:
            col = parts_line[0].replace('"', '').replace(",", "").strip()

            if col.lower() in ["constraint", "primary", "foreign", "unique"]:
                continue

            columns.append(col)

    seen = set()
    clean = []

    for c in columns:
        cc = str(c).strip()
        if cc and cc not in seen:
            seen.add(cc)
            clean.append(cc)

    return clean


def parse_source_columns(text):
    """
    Supports:
    1. SQL CREATE TABLE script
    2. Comma separated headers
    3. Line separated headers
    """
    text = str(text or "").strip()

    if not text:
        return []

    if "(" in text and ")" in text:
        cols = extract_columns(text)
        if cols:
            return cols

    if "," in text:
        cols = [x.strip() for x in text.split(",") if x.strip()]
        if cols:
            return cols

    cols = [x.strip() for x in text.splitlines() if x.strip()]
    return cols


# -----------------------------------------------------------------------------
# Validation
# -----------------------------------------------------------------------------

def validate_mapping(mapping):
    used_targets = set()
    valid = []
    total_score = 0.0

    for m in mapping:
        src = str(m.get("source", "")).strip()
        tgt = str(m.get("target", "")).strip()

        if not src or not tgt or tgt.lower() == "n/a" or src.lower() == "n/a":
            continue

        if normalize_name(tgt) in used_targets:
            continue

        score = token_similarity(src, tgt)

        # stronger validator but not too strict
        if score < 0.38:
            continue

        used_targets.add(normalize_name(tgt))
        total_score += score

        logic = str(m.get("logic", "")).strip() or "Smart Match"

        valid.append({
            "source": src,
            "target": tgt,
            "logic": logic,
            "confidence": round(score * 100, 2)
        })

    accuracy = round((total_score / len(valid)) * 100, 2) if valid else 0.0

    return valid, accuracy


# -----------------------------------------------------------------------------
# Main AI mapping
# -----------------------------------------------------------------------------

def get_ai_mapping(ssms_script: str, pg_script: str):
    try:
        source_columns = parse_source_columns(ssms_script)
        target_columns = extract_columns(pg_script)

        learned = get_learned_mapping()

        mapping = []
        used_sources = set()

        normalized_source_lookup = {
            normalize_name(src): src for src in source_columns
        }

        for tgt in target_columns:
            best_match = None
            best_score = 0.0
            tgt_norm = normalize_name(tgt)

            # 1. Strong learned mapping first
            for src_norm, item in learned.items():
                learned_target = str(item.get("target", "")).strip()
                learned_conf = float(item.get("confidence", 0) or 0)

                if normalize_name(learned_target) == tgt_norm:
                    original_src = normalized_source_lookup.get(src_norm)

                    if original_src and original_src not in used_sources:
                        best_match = original_src
                        best_score = min(1.0, max(0.75, learned_conf / 100.0))
                        break

            # 2. Exact normalized source == target
            if not best_match:
                for src in source_columns:
                    if src in used_sources:
                        continue

                    if normalize_name(src) == tgt_norm:
                        best_match = src
                        best_score = 1.0
                        break

            # 3. Smart similarity scoring
            if not best_match:
                for src in source_columns:
                    if src in used_sources:
                        continue

                    score = token_similarity(src, tgt)

                    if score > best_score:
                        best_score = score
                        best_match = src

            # Thresholds
            if not best_match or best_score < 0.38:
                mapping.append({
                    "source": "N/A",
                    "target": tgt,
                    "logic": "No Match"
                })
            else:
                if best_score >= 0.90:
                    logic = "Exact / Learned Match"
                elif best_score >= 0.65:
                    logic = "Smart Token Match"
                else:
                    logic = "Possible Match"

                mapping.append({
                    "source": best_match,
                    "target": tgt,
                    "logic": logic,
                    "confidence": round(best_score * 100, 2)
                })

                used_sources.add(best_match)

        validated_mapping, accuracy = validate_mapping(mapping)

        update_learning(validated_mapping)

        return {
            "source_columns": source_columns,
            "target_columns": target_columns,
            "mapping": validated_mapping,
            "accuracy": accuracy
        }

    except Exception as e:
        raise RuntimeError(f"Mapping failed: {str(e)}")