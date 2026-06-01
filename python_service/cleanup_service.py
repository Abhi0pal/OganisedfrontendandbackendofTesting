import sys
from db import get_connection

def cleanup_service(service_id: str):
    """
    Deletes all records associated with a specific service_id across all relevant tables.
    """
    if not service_id:
        print("Error: service_id is required.")
        return

    conn = get_connection()
    cur = conn.cursor()

    try:
        print(f"Starting cleanup for service_id: {service_id}")

        # 1. DELETE Workflow related records
        # We find the workflow definition IDs first
        cur.execute("SELECT id FROM wf_definitions WHERE service_id = %s", (service_id,))
        wf_def_ids = [row[0] for row in cur.fetchall()]

        if wf_def_ids:
            for wf_id in wf_def_ids:
                print(f" Cleaning up Workflow Definition ID: {wf_id}")
                
                # Find processes for this definition
                cur.execute("SELECT id FROM wf_processes WHERE workflow_def_id = %s", (wf_id,))
                proc_ids = [row[0] for row in cur.fetchall()]

                if proc_ids:
                    # Delete transitions pointing to or from these processes
                    cur.execute("DELETE FROM wf_transitions WHERE source_process_id = ANY(%s) OR target_process_id = ANY(%s)", (proc_ids, proc_ids))
                    
                    # Delete action field permissions
                    cur.execute("DELETE FROM wf_field_permissions WHERE workflow_process_id = ANY(%s)", (proc_ids,))

                    # Delete process actions
                    cur.execute("DELETE FROM wf_process_actions WHERE process_id = ANY(%s)", (proc_ids,))

                    # Delete fork/join branches
                    cur.execute("SELECT id FROM wf_fork_joins WHERE workflow_def_id = %s", (wf_id,))
                    fork_join_ids = [row[0] for row in cur.fetchall()]
                    if fork_join_ids:
                        cur.execute("DELETE FROM wf_fork_join_branches WHERE fork_join_id = ANY(%s)", (fork_join_ids,))
                        cur.execute("DELETE FROM wf_fork_joins WHERE id = ANY(%s)", (fork_join_ids,))

                    # Delete processes themselves
                    cur.execute("DELETE FROM wf_processes WHERE id = ANY(%s)", (proc_ids,))

                # Delete the definition
                cur.execute("DELETE FROM wf_definitions WHERE id = %s", (wf_id,))

        # 2. DELETE Form Builder related records
        print(" Cleaning up Form Builder tables...")
        cur.execute("DELETE FROM wf_configurations WHERE service_id = %s", (service_id,))
        cur.execute("DELETE FROM m_fb_form_mapping WHERE service_id = %s", (service_id,))
        cur.execute("DELETE FROM m_fb_form_rules WHERE service_id = %s", (service_id,))
        cur.execute("DELETE FROM m_fb_addmore_groups WHERE service_id = %s", (service_id,))
        cur.execute("DELETE FROM m_fb_form_builder_fields WHERE service_id = %s", (service_id,))
        cur.execute("DELETE FROM m_fb_page_master WHERE service_id = %s", (service_id,))

        # 3. DELETE the service entry itself (optional, but requested by logic)
        # cur.execute("DELETE FROM m_service WHERE service_id = %s", (service_id,))

        conn.commit()
        print(f"Successfully cleaned up all records for service_id: {service_id}")

    except Exception as e:
        conn.rollback()
        print(f"Error during cleanup: {str(e)}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python cleanup_service.py <service_id>")
        sys.exit(1)
    
    target_service_id = sys.argv[1]
    cleanup_service(target_service_id)
