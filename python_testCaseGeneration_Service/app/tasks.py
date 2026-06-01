from crewai import Task


def get_tasks(frs_text, planner, generator, critic, refiner):
    task1 = Task(
        description=f"""
        Carefully analyze the entire SRS document below.

        STRICT INSTRUCTIONS:
        - Do NOT skip any line, table, or section
        - Extract ALL requirements in structured format
        - Include:
          - Functional requirements
          - Non-functional requirements
          - Field validations
          - Business rules
          - Conditions
          - Workflows
          - API/integration points (if any)
          - Dependencies

        FRS:
        {frs_text}

        Output format:
        - Numbered list of requirements
        - Clear and structured
        """,
        expected_output="Complete structured requirements list",
        agent=planner
    )

    task2 = Task(
        description="""
        Using the extracted requirements, generate comprehensive test cases.

        MUST COVER:
        - Functional test cases
        - Validation test cases
        - Negative test cases
        - Edge cases
        - Boundary cases
        - UI validations
        - API test cases (if applicable)
        - Integration scenarios
        - End-to-end flows
        - Role-based access scenarios
        - Security validations

        IMPORTANT LENGTH RULES:
        - Generate as many useful test cases as needed, but keep EACH test case concise
        - Do NOT write exaggerated or repetitive text such as "very very very..."
        - Do NOT pad descriptions with filler words
        - Keep "Function List/Test case description" under 20 words
        - Keep "Condition/Feature to be tested" under 25 words
        - Keep "data set / values" under 25 words unless specific values are required
        - Keep "expected_result" under 35 words
        - Keep "steps" concise: maximum 5 short numbered actions in one line or one compact string
        - Merge similar edge cases instead of creating verbose versions of the same case
        - Prefer compact, high-signal wording over long narrative explanations

        Output STRICT JSON:
        [
          {{
            "Test case No.": "...",
            "Function List/Test case description": "...",
            "Condition/Feature to be tested": "...",
            "steps": "...",
            "data set / values": "...",
            "expected_result": "..."
          }}
        ]

        Ensure:
        - Broad coverage
        - Clear wording
        - No unnecessary repetition
        - No oversized test case entries
        """,
        expected_output="Comprehensive JSON test cases",
        agent=generator
    )

    task3 = Task(
        description="""
        Review ALL generated test cases.

        Perform:
        - Gap analysis (find missing cases)
        - Improve weak test cases
        - Add only necessary:
          - Edge cases
          - Boundary cases
          - Negative scenarios
          - Complex real-world scenarios

        IMPORTANT REVIEW RULES:
        - Remove duplicates and overlapping cases
        - Rewrite any overly long test case into a concise version
        - Eliminate repetitive filler text
        - If a case contains repeated words or runaway text, replace it with a compact version
        - Keep each field short and readable
        - Preserve coverage, but reduce verbosity

        Return improved test cases in JSON format.
        """,
        expected_output="Improved and complete test cases",
        agent=critic
    )

    task4 = Task(
        description="""
        Finalize ALL test cases.

        Ensure:
        - Clean structure
        - No duplicates
        - No irrelevant cases
        - Proper formatting
        - Keep all useful test cases, but make each one concise

        STRICT OUTPUT RULES:
        - Return valid JSON array only
        - Do NOT use markdown fences
        - Do NOT add explanation
        - Do NOT add text outside JSON
        - Reject and rewrite any test case containing repeated filler patterns
        - Do NOT allow runaway text like "very very very..."
        - Trim each field to concise business-ready wording
        - Keep "steps" short and practical
        - Keep each object compact enough for Excel row output

        Return STRICT JSON ONLY in this format:
        [
          {{
            "Test case No.": "...",
            "Function List/Test case description": "...",
            "Condition/Feature to be tested": "...",
            "steps": "...",
            "data set / values": "...",
            "expected_result": "..."
          }}
        ]
        """,
        expected_output="Final structured JSON test cases",
        agent=refiner
    )

    return [task1, task2, task3, task4]
