"""
List all available Gemini models.
"""
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure the API with the provided key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in .env file")
    exit(1)

try:
    # Configure the API with the provided key
    genai.configure(api_key=api_key)
    
    # List all available models
    print("Available models:")
    for model in genai.list_models():
        print(f"- {model.name}")
        
except Exception as e:
    print(f"Error: {e}")
