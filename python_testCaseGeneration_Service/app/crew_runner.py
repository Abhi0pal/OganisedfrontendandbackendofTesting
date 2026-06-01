import os
from crewai import Crew

from .agents import get_agents
from .tasks import get_tasks


def run_agents(frs_text):
    planner, generator, critic, refiner = get_agents()
    tasks = get_tasks(frs_text, planner, generator, critic, refiner)

    crew = Crew(
        agents=[planner, generator, critic, refiner],
        tasks=tasks,
        verbose=True
    )

    return crew.kickoff()
