from pyht import Client
from dotenv import load_dotenv
from pyht.client import TTSOptions
import os

# Load environment variables from .env file
load_dotenv()

# Get API credentials
user_id = os.getenv("PLAY_HT_USER_ID")
api_key = os.getenv("PLAY_HT_API_KEY")

if not user_id or not api_key:
    raise ValueError("Missing API credentials. Make sure .env file is set up correctly.")

# Initialize the PlayHT client
client = Client(user_id=user_id, api_key=api_key)

# Read text from the transcription file
transcription_file = "response.txt"
if os.path.exists(transcription_file):
    with open(transcription_file, "r", encoding="utf-8") as file:
        transcription_text = file.read().strip()
else:
    raise FileNotFoundError(f"❌ The file {transcription_file} does not exist. Please provide a valid transcription file.")

# Configure voice options
options = TTSOptions(voice="s3://voice-cloning-zero-shot/c36db6df-1dc4-4f3b-b6d8-23f578e2045f/original/manifest.json")

# Generate and save the audio file
output_file = "output_MarlVoice.wav"
try:
    with open(output_file, "wb") as audio_file:
        for chunk in client.tts(transcription_text, options, voice_engine='PlayDialog-http'):
            audio_file.write(chunk)
    print(f"✅ Audio saved successfully as {output_file}")
    exit
except Exception as e:
    print(f"❌ Error generating audio: {e}")
