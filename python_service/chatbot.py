from typing import AsyncIterator, Iterator
import os
import uuid
import json
import base64
import certifi
import requests
import markdown
from bs4 import BeautifulSoup

# from flask import Flask, request, jsonify
# from flask_cors import CORS
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from langchain_core.document_loaders import BaseLoader
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain

from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_openai import OpenAIEmbeddings
from langchain.tools.retriever import create_retriever_tool
from langchain.agents import AgentExecutor, create_tool_calling_agent
# from flask import Blueprint

from langchain_core.embeddings import Embeddings
from google import genai


# ======================================================
# ENV & PATHS
# ======================================================
from dotenv import load_dotenv
load_dotenv()

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AI4BHARAT_KEY = os.getenv("AI4BHARAT_KEY")

# Get the directory where this file is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DOCUMENTS_DIR = os.path.join(SCRIPT_DIR, "documents")
CHROMA_DIR = os.path.join(SCRIPT_DIR, "chroma")

# # ======================================================
# # APP
# # ======================================================
# # app = Flask(__name__)
# jiva_bp = Blueprint("jiva", __name__)

# # CORS(app, resources={
# #     r"/*": {
# #         "origins": "http://localhost:4000",
# #         "methods": ["POST", "OPTIONS"],
# #         "allow_headers": ["Content-Type"]
# #     }
# # })



# ======================================================
# LLM
# ======================================================
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_output_tokens=5000,
    google_api_key=os.getenv("GEMINI_API_KEY")
)
# [API KEYS REMOVED]

# ======================================================
# DOCUMENT LOADER
# ======================================================
class CustomDocumentLoader(BaseLoader):
    def __init__(self, file_path: str, delimiter: str = ""):
        self.file_path = file_path
        self.delimiter = delimiter

    def lazy_load(self) -> Iterator[Document]:
        with open(self.file_path, encoding="utf-8") as f:
            for i, part in enumerate(f.read().split(self.delimiter)):
                yield Document(page_content=part, metadata={"part": i})

    async def alazy_load(self) -> AsyncIterator[Document]:
        import aiofiles
        async with aiofiles.open(self.file_path, encoding="utf-8") as f:
            content = await f.read()
            for i, part in enumerate(content.split(self.delimiter)):
                yield Document(page_content=part, metadata={"part": i})


class GeminiEmbeddings(Embeddings):
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    def embed_documents(self, texts):
        vectors = []

        for text in texts:
            if not text or not text.strip():   # ✅ FIX
                continue

            res = self.client.models.embed_content(
                model="gemini-embedding-2",
                contents=text.strip()
            )
            vectors.append(res.embeddings[0].values)

        return vectors

    def embed_query(self, text):
        if not text or not text.strip():   # ✅ FIX
            return []

        res = self.client.models.embed_content(
            model="gemini-embedding-2",
            contents=text.strip()
        )
        return res.embeddings[0].values



# ======================================================
# LOAD DOCUMENTS
# ======================================================
docs_greet = list(CustomDocumentLoader(
    os.path.join(DOCUMENTS_DIR, "greets.txt"), delimiter="###"
).lazy_load())

docs_industrial = PyPDFLoader(
    os.path.join(DOCUMENTS_DIR, "SWM_Act.pdf")
).load()







# ======================================================
# VECTOR STORES
# ======================================================
# embedding = OpenAIEmbeddings(
#     model="text-embedding-3-large",
#     openai_api_key='<YOUR_OPENAI_API_KEY>'
# )

# vectorstore_swm_act = Chroma(
#     persist_directory=os.path.join(CHROMA_DIR, "chroma_swm_act"),
#     embedding_function=embedding
# )



# embedding = GoogleGenerativeAIEmbeddings(
#     model="gemini-embedding-2",
#     google_api_key='<YOUR_GOOGLE_API_KEY>'
# )

# vectorstore_swm_act = Chroma(
#     persist_directory=os.path.join(CHROMA_DIR, "chroma_swm_act"),
#     embedding_function=embedding
# )

embedding = GeminiEmbeddings()

vectorstore_swm_act = Chroma(
    persist_directory=os.path.join(CHROMA_DIR, "chroma_swm_act"),
    embedding_function=embedding
)







#approval store
# approval_vectorstore = Chroma.from_documents(
#     documents=approval_docs,
#     embedding=embedding,
#     persist_directory="./chroma_approvals"
# )

clean_docs = [
    doc for doc in (docs_greet + docs_industrial)
    if doc.page_content and doc.page_content.strip()
]

vectorstore_swm_act.add_documents(clean_docs)


# ======================================================
# RETRIEVERS
# ======================================================
retriever_swm_act = vectorstore_swm_act.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 20, "fetch_k": 60, "lambda_mult": 0.2}
)




def get_retriever(policy):
    if policy == "swm":
        return retriever_swm_act
    else:
        return None



# vector_db = initialize_database()
# ======================================================
# PROMPTS
# ======================================================
contextualize_prompt = ChatPromptTemplate.from_messages([
    ("system", "Rewrite the question as a standalone question."),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}")
])

qa_system_prompt = """

You are GreenMind AI, the Central Pollution Control Board (CPCB) Virtual Assistant.

Your role is to provide accurate, structured, and regulatory-compliant answers strictly based on CPCB Acts, Rules, and Guidelines, especially focusing on Solid Waste Management Rules and other environmental regulations under the Environment (Protection) Act, 1986.

Scope of responses:
- Solid Waste Management Rules (latest amendments and notifications)
- Duties and responsibilities of waste generators, bulk waste generators, local bodies, and operators
- Waste classification (wet waste, dry waste, sanitary waste, special care waste, etc.)
- Compliance requirements, authorizations, and environmental standards
- Waste processing methods (composting, biomethanation, recycling, waste-to-energy, landfill norms)
- Roles of CPCB, SPCB, and other authorities
- Environmental obligations, penalties, and reporting requirements

Strict rules:
- Answer ONLY from the provided context and CPCB-related regulations
- Do NOT answer general, casual, or unrelated questions
- Do NOT generate assumptions beyond the given data
- If the answer is not available in the context, respond: "The requested information is not available in the provided CPCB regulations."
- Do NOT provide opinions or suggestions outside regulatory scope

Response style:
- Clear, formal, and regulatory language
- Structured format (headings, bullet points where applicable)
- Use definitions and legal terminology where relevant
- Explain compliance steps when applicable

Context:
{context}
"""

qa_prompt = ChatPromptTemplate.from_messages([
    ("system", qa_system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}")
])

qa_chain = create_stuff_documents_chain(llm, qa_prompt)





# ======================================================
# MEMORY
# ======================================================
store = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()

    if len(store[session_id].messages) > 20:
        store[session_id].clear()

    return store[session_id]





# ======================================================
# RUN
# ======================================================
# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5002, debug=True)
