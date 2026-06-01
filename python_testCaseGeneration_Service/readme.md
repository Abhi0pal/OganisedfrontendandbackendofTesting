-----------------------------
GENERAL PREREQUISITES CHECK
-----------------------------

python --version
pip --version


===================================================
BACKEND SETUP (FastAPI)
===================================================

1. Use python 3.12(very important)

2. Create Python virtual environment

py -3.12 -m venv .venv (change the python version here according to the version installed in your system)

3. Activate virtual environment

.venv\Scripts\activate

5. Upgrade pip (recommended)

python.exe -m pip install --upgrade pip


6. Install backend dependencies

pip install fastapi uvicorn[standard] crewai langchain langchain-google-genai python-dotenv pandas openpyxl PyPDF2 pypdfium2 google-generativeai python-multipart


7. Start FastAPI backend server

uvicorn app.main:app --reload


8. Backend URLs

Base URL:
http://127.0.0.1:8000

Swagger API Docs:
http://127.0.0.1:8000/docs

