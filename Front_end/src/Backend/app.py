from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import base64
import numpy as np
import cv2
import traceback
from together import Together
import subprocess
import sys
from dotenv import load_dotenv  # Import dotenv
from flask import send_file
import threading


# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
CORS(app)

CAPTURE_FOLDER = 'captures'
UPLOAD_FOLDER = 'uploads'
app.config['CAPTURE_FOLDER'] = CAPTURE_FOLDER
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def encode_image(image_path):
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except FileNotFoundError:
        return None

# Load Together API Key from environment variable
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
client = Together(api_key=TOGETHER_API_KEY)

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
CORS(app)

CAPTURE_FOLDER = 'captures'
UPLOAD_FOLDER = 'uploads'
app.config['CAPTURE_FOLDER'] = CAPTURE_FOLDER
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit

# Ensure both folders exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(CAPTURE_FOLDER):
    os.makedirs(CAPTURE_FOLDER)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def encode_image(image_path):
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except FileNotFoundError:
        return None

# Load Together API Key from environment variable
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
client = Together(api_key=TOGETHER_API_KEY)

@app.route('/scan-image', methods=['POST'])
def scan_image():
    if 'file' not in request.files:
        # Check if the image is in the captures folder
        capture_files = os.listdir(app.config['CAPTURE_FOLDER'])
        if not capture_files:
            return jsonify({'error': 'No file uploaded and no captures found'}), 400

        # Use the first image found in the captures folder
        capture_file = capture_files[0]
        file_path = os.path.join(app.config['CAPTURE_FOLDER'], capture_file)
    else:
        # Handle uploaded file
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if file and allowed_file(file.filename):
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
            file.save(file_path)
        else:
            return jsonify({'error': 'Invalid file type'}), 400

    try:
        base64_image = encode_image(file_path)
        if not base64_image:
            return jsonify({'error': 'Failed to encode image'}), 500

        prompts = {
            "medicine_info": "Act like a pharmacist and provide detailed information about the medicine in this image. On the contents(text) that will be provided it must be formatted properly.",
            "medicine_usage": "Describe the proper usage and dosage of the medicine shown in this image.",
            "medicine_complication": "List possible complications, side effects, and contraindications of the medicine in this image.",
            "medicine_hazard": "Put also the hazard or what will happen to them if they will not take this medicine.",
            "medicine_emergency": "Based on the prescription scanned, please provide information on the symptoms when to go to the doctor if the prescription is not taken, or not taken properly."
        }

        responses = {}

        for key, prompt in prompts.items():
            response = client.chat.completions.create(
                model="meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ],
                    }
                ]
            )

            if response.choices and len(response.choices) > 0:
                responses[key] = response.choices[0].message.content
            else:
                responses[key] = "No content received from LLaMA."

        print("Responses:", responses)  # Debugging
        return jsonify({
            'message': 'Image processed successfully',
            'medicine_info': responses["medicine_info"],
            'medicine_usage': responses["medicine_usage"],
            'medicine_complication': responses["medicine_complication"],
            'medicine_hazard': responses["medicine_hazard"],
            'medicine_emergency': responses["medicine_emergency"],
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'AI processing failed: {str(e)}'}), 500


        return jsonify({'error': 'Invalid file type'}), 400

import threading

@app.route('/start-voice-process', methods=['POST'])
def start_voice_process():
    try:
        python_executable = sys.executable

        # Step 1: Run Speech-to-Text
        print("\n🎙️ Running Speech-to-Text...")
        subprocess.run([python_executable, "speechToText.py"], check=True)

        # Step 2: Run GPT Processing
        print("\n🤖 Running GPT Processing...")
        subprocess.run([python_executable, "gpt.py"], check=True)

        # Step 3: Read GPT response from file
        with open('response.txt', 'r', encoding='utf-8') as file:
            gpt_response = file.read().strip()
        print("GPT Response:", gpt_response)  # Debugging

        # Step 4: Run Text-to-Speech in a separate thread
        def run_tts():
            print("\n🗣️ Running Text-to-Speech...")
            subprocess.run([python_executable, "textToSpeech.py"], check=True)

        tts_thread = threading.Thread(target=run_tts)
        tts_thread.start()  # Start the TTS process in the background

        # Return the GPT response immediately
        return jsonify({"message": "Voice processing completed successfully!", "gpt_response": gpt_response}), 200

    except Exception as e:
        print("Error:", str(e))  # Debugging
        return jsonify({"error": str(e)}), 500
    
@app.route('/get-response-content', methods=['GET'])
def get_response_content():
    try:
        with open('response.txt', 'r', encoding='utf-8') as file:
            content = file.read().strip()
        return jsonify({"content": content}), 200
    except FileNotFoundError:
        return jsonify({"error": "Response file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get-audio', methods=['GET'])
def get_audio():
    try:
        return send_file('output_MarlVoice.wav', mimetype='audio/wav', as_attachment=False)
    except FileNotFoundError:
        return jsonify({'error': 'Audio file not found'}), 404
    except Exception as e:
        app.logger.error(f"Error sending audio: {str(e)}")
        return jsonify({'error': f'Failed to send audio: {str(e)}'}), 500  

if __name__ == '__main__':
    app.run(debug=True, port=5001)