import subprocess
import sys

# Get the Python executable path from the current environment (virtual environment)
python_executable = sys.executable

# Step 1: Run Speech-to-Text (Records & Transcribes Audio)
print("\n🎙️ Running Speech-to-Text...")
subprocess.run([python_executable, "speechToText.py"], check=True)

# Step 2: Run GPT Processing (Processes the Transcription with GPT)
print("\n🤖 Running GPT Processing...")
subprocess.run([python_executable, "gpt.py"], check=True)

# Step 3: Run Text-to-Speech (Converts GPT Response to Speech)
print("\n🗣️ Running Text-to-Speech...")
subprocess.run([python_executable, "textToSpeech.py"], check=True)

print("\n✅ All processes completed successfully!")
