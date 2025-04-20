import os
import base64
import numpy as np
import cv2
import traceback
from together import Together
import subprocess
import sys
from dotenv import load_dotenv
import threading
import time
import requests
from flask import jsonify, request, send_file

# Load environment variables from .env file
load_dotenv()

TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
client = Together(api_key=TOGETHER_API_KEY)

CAPTURE_FOLDER = 'captures'
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff'}

scan_progress = 0
chat_progress = 0

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def encode_image(image_path):
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except FileNotFoundError:
        return None

def scan_image_logic(app_config, files):
    global scan_progress
    scan_progress = 0
    if 'file' not in files:
        capture_files = os.listdir(app_config['CAPTURE_FOLDER'])
        if not capture_files:
            return jsonify({'error': 'No file uploaded and no captures found'}), 400
        capture_file = capture_files[0]
        file_path = os.path.join(app_config['CAPTURE_FOLDER'], capture_file)
    else:
        file = files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        if file and allowed_file(file.filename):
            filename = file.filename
            file_path = os.path.join(app_config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
        else:
            return jsonify({'error': 'Invalid file type'}), 400
    # ... (rest of image processing and AI logic, using scan_progress)
    # For brevity, insert original logic here
    return jsonify({'message': 'Scan complete'}), 200

def start_voice_process_logic():
    try:
        python_executable = sys.executable
        subprocess.run([python_executable, "speechToText.py"], check=True)
        subprocess.run([python_executable, "gpt.py"], check=True)
        with open('response.txt', 'r', encoding='utf-8') as file:
            gpt_response = file.read().strip()
        def run_tts():
            subprocess.run([python_executable, "textToSpeech.py"], check=True)
        tts_thread = threading.Thread(target=run_tts)
        tts_thread.start()
        return jsonify({"message": "Voice processing completed successfully!", "gpt_response": gpt_response}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_response_content_logic():
    try:
        with open('response.txt', 'r', encoding='utf-8') as file:
            content = file.read().strip()
        return jsonify({"content": content}), 200
    except FileNotFoundError:
        return jsonify({"error": "Response file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_audio_logic():
    try:
        return send_file('output_MarlVoice.wav', mimetype='audio/wav', as_attachment=False)
    except FileNotFoundError:
        return jsonify({'error': 'Audio file not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Failed to send audio: {str(e)}'}), 500

def get_scan_progress_logic():
    global scan_progress
    return jsonify({'progress': scan_progress})

def search_medicine_ai_logic(medicine_name):
    response_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    try:
        if not TOGETHER_API_KEY:
            return jsonify({'error': 'API key not configured'}), 500, response_headers
        # Real AI logic using Together client
        prompts = {
            "medicine_info": f"Act like a pharmacist and provide detailed information about {medicine_name}. Make sure your response is formatted properly with clear sections and bullet points where appropriate.",
            "medicine_usage": f"Describe the proper usage and dosage based on the medicine name: {medicine_name}. Include specific instructions for taking the medicine.",
            "medicine_complication": f"List possible complications, side effects, and contraindications of the medicine: {medicine_name}. Use bullet points for clear organization."
        }
        responses = {}
        for key, prompt in prompts.items():
            try:
                response = client.chat.completions.create(
                    model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
                    messages=[{"role": "user", "content": prompt}]
                )
                if response.choices and len(response.choices) > 0:
                    responses[key] = response.choices[0].message.content
                else:
                    responses[key] = "No information available."
            except Exception as e:
                responses[key] = f"Error generating information: {str(e)}"
        return jsonify({
            'message': 'Information generated successfully',
            'medicine_info': responses.get("medicine_info", ""),
            'medicine_usage': responses.get("medicine_usage", ""),
            'medicine_complication': responses.get("medicine_complication", "")
        }), 200, response_headers
    except Exception as e:
        return jsonify({'error': f'AI processing failed: {str(e)}'}), 500, response_headers

def search_medicines_logic(search_term):
    response_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    try:
        url = f"https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term={search_term}&maxEntries=20"
        response = requests.get(url)
        # ... (original parsing logic)
        return jsonify({'medications': []}), 200, response_headers
    except Exception as e:
        return jsonify({'error': str(e)}), 500, response_headers

def chat_with_llama_logic(request):
    global chat_progress
    if request.method == 'OPTIONS':
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
        return ('', 204, response_headers)
    response_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    try:
        # ... (original chat logic)
        return jsonify({'message': 'Chat complete'}), 200, response_headers
    except Exception as e:
        return jsonify({'error': f'Request processing failed: {str(e)}'}), 500, response_headers

def get_chat_progress_logic():
    global chat_progress
    return jsonify({'progress': chat_progress})
