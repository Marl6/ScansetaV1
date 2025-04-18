import assemblyai as aai
import sounddevice as sd
import numpy as np
import wave
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get AssemblyAI API key from environment variables
assemblyai_api_key = os.getenv("ASSEMBLYAI_API_KEY")

# Set the AssemblyAI API key
aai.settings.api_key = assemblyai_api_key

# Initialize the Transcriber
transcriber = aai.Transcriber()

# Function to record audio from the microphone
def record_audio(filename, duration=10, samplerate=44100):
    print("Recording...")
    audio_data = sd.rec(int(duration * samplerate), samplerate=samplerate, channels=1, dtype=np.int16)
    sd.wait()
    print("Recording finished.")

    with wave.open(filename, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(samplerate)
        wf.writeframes(audio_data.tobytes())

# Record live audio
AUDIO_FILE = "recorded_audio.wav"
record_audio(AUDIO_FILE, duration=5)

# Transcribe the recorded audio
transcript = transcriber.transcribe(AUDIO_FILE)

# Save the transcript to a text file
TEXT_FILE = "transcription.txt"
with open(TEXT_FILE, "w", encoding="utf-8") as file:
    file.write(transcript.text)

print(f"✅ Transcription saved to {TEXT_FILE}")
print("Transcription:", transcript.text)
