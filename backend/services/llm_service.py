import os
import logging
from typing import Optional, Dict, Any, List

# Try importing google.generativeai, or fallback
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "gemini")
        self.model_name = os.getenv("LLM_MODEL", "gemini-1.5-flash")
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        if self.provider == "gemini" and HAS_GEMINI and self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
        else:
            self.model = None
            logger.warning("Gemini AI is not configured or google-generativeai is missing.")

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Generates text from the LLM provider."""
        if not self.model:
            logger.error("LLM Service not properly initialized.")
            return '{"error": "LLM Service unavailable"}'
            
        try:
            # We construct the message
            if system_instruction:
                # Some basic injection since GenerativeModel system_instruction might require a specific initialization
                prompt = f"System: {system_instruction}\n\nUser: {prompt}"
                
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error during LLM generation: {e}")
            return f"{{\"error\": \"Generation failed: {str(e)}\"}}"

llm_service = LLMService()
