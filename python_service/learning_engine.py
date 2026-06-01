import json
import os

LEARNING_FILE = os.path.join(os.path.dirname(__file__), "learning.json")

def load_learning():
    if not os.path.exists(LEARNING_FILE):
        return []

    with open(LEARNING_FILE, "r") as f:
        try:
            return json.load(f)
        except:
            return []

def save_learning(data):
    with open(LEARNING_FILE, "w") as f:
        json.dump(data, f, indent=2)

def update_learning(mappings):
    memory = load_learning()

    for m in mappings:
        if m["source"] == "N/A":
            continue

        new_entry = {
            "source": m["source"],
            "target": m["target"],
            "confidence": m.get("confidence", 0)
        }

        found = False

        for existing in memory:
            if existing["source"] == new_entry["source"] and existing["target"] == new_entry["target"]:
                found = True

                if "confidence" not in existing:
                    existing["confidence"] = new_entry["confidence"]
                elif new_entry["confidence"] > existing["confidence"]:
                    existing["confidence"] = new_entry["confidence"]

                break

        if not found:
            memory.append(new_entry)

    save_learning(memory)

def get_learned_mapping():
    memory = load_learning()
    learned = {}

    for item in memory:
        src = item.get("source")
        tgt = item.get("target")
        conf = item.get("confidence", 0)

        if not src or not tgt:
            continue

        if src not in learned or conf > learned[src]["confidence"]:
            learned[src] = {
                "target": tgt,
                "confidence": conf
            }

    return {k: v["target"] for k, v in learned.items()}