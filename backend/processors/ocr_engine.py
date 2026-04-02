import logging
import base64
from pathlib import Path
from typing import Any
from groq import Groq

logger = logging.getLogger(__name__)

def _encode_image(image_bytes: bytes) -> str:
    """Helper to convert image bytes to base64 for Groq Vision."""
    return base64.b64encode(image_bytes).decode("utf-8")

def extract_text_from_bytes(image_bytes: bytes, filename: str, client: Groq) -> str:
    """
    Uses Groq Vision (llama-3.2-11b-vision-preview) to extract text 
    from medical bill images or PDFs.
    """
    logger.info(f"Extracting text from {filename} via Groq Vision...")
    
    base64_image = _encode_image(image_bytes)
    
    # Standard prompt for medical bill extraction
    prompt = (
        "Extract all relevant details from this medical bill into a structured format. "
        "Focus on: Patient name, Bill Date, Hospital Name, Itemized charges, "
        "Unit prices, Total Amount, and any Diagnosis or Treatment mentioned."
    )

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}",
                        },
                    },
                ],
            }
        ],
        model="meta-llama/llama-4-scout-17b-16e-instruct",
    )

    return chat_completion.choices[0].message.content

def extract_text_from_path(file_path: Path, client: Groq) -> str:
    """Wrapper to handle file paths (like uploaded policy PDFs)."""
    with open(file_path, "rb") as f:
        return extract_text_from_bytes(f.read(), file_path.name, client)