from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the OpenAI API key from environment variables
openai_api_key = os.getenv("OPENAI_API_KEY")

# Check if transcription.txt exists
transcription_file = "transcription.txt"
if not os.path.exists(transcription_file):
    raise FileNotFoundError(f"❌ The file {transcription_file} does not exist. Please run speechToText.py first.")

# Read input text from transcription.txt
with open(transcription_file, "r", encoding="utf-8") as file:
    user_input = file.read().strip()

# Initialize the OpenAI client with the API key
client = OpenAI(api_key=openai_api_key)

# Get the completion response from the model
completion = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "You are a helpful pharmacist. Always respond concisely in two sentences in explaining the medicine about its use, indication, and hazards if not taken."},
        {"role": "user", "content": user_input}
    ],
    temperature=0.7,  # Adjust temperature for more controlled responses
    max_tokens=70  # Limiting response length to approximately 2 sentences
)

# Extract the model's response message correctly
response_message = completion.choices[0].message.content

# Print the response to console
print("\n💬 GPT Response:\n", response_message)

# Save the response to a text file
with open("response.txt", "w", encoding="utf-8") as file:
    file.write(response_message)

print("\n✅ Response saved to 'response.txt'")
