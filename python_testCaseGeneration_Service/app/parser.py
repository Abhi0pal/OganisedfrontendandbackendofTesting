import os
from functools import lru_cache
from pathlib import Path

import pypdfium2 as pdfium
from PyPDF2 import PdfReader
from dotenv import load_dotenv
from google.genai import Client, types

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def _looks_like_header_only(text: str) -> bool:
    cleaned = " ".join(text.split())
    if not cleaned:
        return True

    if len(cleaned) < 80:
        return True

    return "Printout" in cleaned and "New Section" in cleaned and len(cleaned) < 400


@lru_cache(maxsize=1)
def _ocr_client():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None
    return Client(api_key=api_key)


def _ocr_page_with_gemini(page_image) -> str:
    client = _ocr_client()
    if client is None:
        return ""

    model = os.getenv("PDF_OCR_MODEL", "gemini-2.5-flash")
    prompt = (
        "Read this PDF page image and extract all visible text. "
        "Include headings, table headers, row values, field names, tool tips, "
        "validation notes, and section labels. Preserve reading order as well as possible. "
        "Return only the extracted page text."
    )

    response = client.models.generate_content(
        model=model,
        contents=[prompt, page_image],
        config=types.GenerateContentConfig(
            temperature=0,
            maxOutputTokens=4000,
        ),
    )

    return (response.text or "").strip()


def _extract_pdf_text_with_fallback(file_path: str) -> str:
    reader = PdfReader(file_path)
    pdf = pdfium.PdfDocument(file_path)
    pages_text = []

    for index, page in enumerate(reader.pages):
        extracted_text = (page.extract_text() or "").strip()

        if _looks_like_header_only(extracted_text):
            rendered_page = pdf[index].render(scale=3).to_pil()
            try:
                ocr_text = _ocr_page_with_gemini(rendered_page)
            except Exception:
                ocr_text = ""
            page_text = ocr_text or extracted_text
        else:
            page_text = extracted_text

        if page_text:
            pages_text.append(f"--- Page {index + 1} ---\n{page_text}")

    return "\n\n".join(pages_text).strip()


def extract_text(file_path):
    if file_path.endswith(".pdf"):
        return _extract_pdf_text_with_fallback(file_path)

    if file_path.endswith(".txt"):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read().strip()

    return ""
