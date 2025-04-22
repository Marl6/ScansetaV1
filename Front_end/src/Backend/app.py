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
import time
import requests  # For making HTTP requests to RxNorm API

from groq import Groq

# Load environment variables from .env file FIRST
load_dotenv()

# Global variable to track scan progress
scan_progress = 0

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

# Initialize the Together client with the API key from environment variables
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
if not TOGETHER_API_KEY:
    print("WARNING: TOGETHER_API_KEY not found in environment variables!")

# Initialize the Together API client
client = Together(api_key=TOGETHER_API_KEY)

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

# Groq AI configuration
GROQ_API_KEY = "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"
groq_client = Groq(api_key=GROQ_API_KEY)

@app.route('/scan-image', methods=['POST'])
def scan_image():
    global scan_progress
    # Reset progress at the start
    scan_progress = 0
    
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
            # Update progress - file received and saved
            scan_progress = 10
        else:
            return jsonify({'error': 'Invalid file type'}), 400

    try:
        base64_image = encode_image(file_path)
        if not base64_image:
            return jsonify({'error': 'Failed to encode image'}), 500
            
        # Update progress - image encoded
        scan_progress = 20

        # First, detect all medicines in the image
        initial_prompt = {
            "detected_medicines": "What are the medicine names detected in this image? Please provide ONLY the names separated by commas without any additional text, explanations, or formatting. Example output format: 'Amoxicillin, Losartan'"
        }
        
        # Get the list of detected medicines first
        medicine_response = client.chat.completions.create(
            model="meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": initial_prompt["detected_medicines"]},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ],
                }
            ]
        )
        
        # Extract detected medicines
        detected_medicines_text = ""
        if medicine_response.choices and len(medicine_response.choices) > 0:
            detected_medicines_text = medicine_response.choices[0].message.content
        
        # Parse the comma-separated list into individual medicine names
        detected_medicines = [med.strip() for med in detected_medicines_text.split(',') if med.strip()]
        
        # If no medicines were detected, use a generic approach
        if not detected_medicines:
            detected_medicines = ["Medicine"]
            
        print(f"Detected medicines: {detected_medicines}")
        
        # Update scan progress after detecting medicines
        scan_progress = 30
        
        # Dictionary to store medicine-specific information
        medicine_data = {}
        
        # Base prompts for each type of information
        base_prompts = {
            "medicine_info": "Analyze this prescription or medicine image and describe what is visible for {medicine}. Extract all details from the image such as medicine name, form (tablet, capsule, etc.), prescription details, doctor's information, patient instructions, etc. ONLY report what you can actually see in the image. Format your response with bullet points.",
            
            "medicine_usage": "Based on the image, describe how to take {medicine}. Include dosage instructions, frequency, timing (before/after meals), duration, and any special instructions that appear on the prescription or packaging. If you can see specific mg/ml dosage information, include that. Format with bullet points.",
            
            "medicine_complication": "Provide general information about the potential side effects, complications, and contraindications of {medicine}. You can provide common and important information about this medicine even if not visible in the image. List allergic reactions, common side effects, and when to contact a doctor. Format as a comprehensive list.",
            
            # "medicine_hazard": "Describe the potential hazards or consequences if {medicine} is not taken as prescribed. This can be general information about the medicine, not limited to what's in the image.",
            
            # "medicine_emergency": "Provide information about when to seek emergency care related to {medicine}, including severe adverse reactions or overdose symptoms. This can be general advice, not limited to what's in the image."
        }
        
        # Calculate progress increment per medicine per prompt
        total_prompt_count = len(detected_medicines) * len(base_prompts)
        progress_per_prompt = 60 / total_prompt_count if total_prompt_count > 0 else 60
        
        # Process each medicine separately
        for medicine_index, medicine_name in enumerate(detected_medicines):
            medicine_data[medicine_name] = {}
            
            # For each medicine, create specific prompts
            medicine_prompts = {}
            for prompt_key, prompt_template in base_prompts.items():
                medicine_prompts[prompt_key] = prompt_template.format(medicine=medicine_name)
            
            # Process each prompt for this medicine
            for prompt_index, (key, prompt) in enumerate(medicine_prompts.items()):
                # Update progress for each prompt processing
                scan_progress = 30 + int((medicine_index * len(base_prompts) + prompt_index) * progress_per_prompt)
                
                response = client.chat.completions.create(
                    model="meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
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
                    medicine_data[medicine_name][key] = response.choices[0].message.content
                else:
                    medicine_data[medicine_name][key] = f"No {key.replace('medicine_', '')} data available for {medicine_name}"

        # We've already processed all prompts in the medicine-specific approach above
        # Now scan_progress should be close to 90%
        scan_progress = 90
        
        # Prepare the final response format
        # We'll have one flat response with the detected_medicines list
        # and separate medicine data for each detected medicine
        responses = {
            "detected_medicines": detected_medicines_text  # This is the comma-separated list as a string
        }
        
        # Indicate that processing is complete
        scan_progress = 100
        
        # Use a safer print method that handles Unicode characters
        try:
            print("Responses received successfully")
            # If you need to see response content, use this safer approach:
            # for key, value in responses.items():
            #     print(f"{key}: {value[:100]}...") # Print just the first 100 chars
        except Exception as print_error:
            print(f"Error printing responses: {str(print_error)}")
        
        # Complete
        scan_progress = 100
        
        return jsonify({
            'message': 'Image processed successfully',
            'detected_medicines': responses["detected_medicines"],
            'medicine_data': medicine_data,  # This contains all medicine-specific information
            'progress': 100
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

@app.route('/scan-progress', methods=['GET'])
def get_scan_progress():
    global scan_progress
    return jsonify({'progress': scan_progress})
    
@app.route('/search-medicine-ai/<medicine_name>', methods=['GET'])
def search_medicine_ai(medicine_name):
    # Add CORS headers to this specific endpoint
    response_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    try:
        # Verify API key is available
        if not GROQ_API_KEY:
            print("ERROR: GROQ_API_KEY not found or empty in environment variables!")
            return jsonify({'error': 'API key not configured'}), 500, response_headers
            
        print(f"Processing search request for medicine: {medicine_name}")
        
        # Define prompts for each type of information we want to get
        prompts = {
            "medicine_info": f"Act like a pharmacist and provide detailed information about {medicine_name}. Make sure your response is formatted properly with clear sections and bullet points where appropriate.",
            "medicine_usage": f"Describe the proper usage and dosage based on the medicine name: {medicine_name}. Include specific instructions for taking the medicine.",
            "medicine_complication": f"List possible complications, side effects, and contraindications of the medicine: {medicine_name}. Use bullet points for clear organization."
        }
        
        responses = {}
        
        # Use the Llama model to generate responses for each prompt
        print(f"Using model: llama3-70b-8192 with API key: {GROQ_API_KEY[:5]}...")
        
        for key, prompt in prompts.items():
            print(f"Generating {key} for {medicine_name}...")
            try:
                response = groq_client.chat.completions.create(
                    model="llama3-70b-8192",  # Groq's LLaMA 3 70B model
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                )
                
                if response.choices and len(response.choices) > 0:
                    responses[key] = response.choices[0].message.content
                else:
                    responses[key] = "No information available."
                    
                print(f"Successfully generated {key}")
            except Exception as prompt_error:
                print(f"Error generating {key}: {str(prompt_error)}")
                responses[key] = f"Error generating information: {str(prompt_error)}"
        
        print(f"Completed AI generated information for {medicine_name}")
        return jsonify({
            'message': 'Information generated successfully',
            'medicine_info': responses["medicine_info"],
            'medicine_usage': responses["medicine_usage"],
            'medicine_complication': responses["medicine_complication"]
        }), 200, response_headers
        
    except Exception as e:
        print(f"ERROR in search_medicine_ai: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': f'AI processing failed: {str(e)}'}), 500, response_headers

@app.route('/medicines/search/<search_term>', methods=['GET'])
def search_medicines(search_term):
    try:
        print(f"Searching for medicine: {search_term}")
        
        # Add CORS headers
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
        
        # RxNorm API URL for approximate match
        url = f"https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term={search_term}&maxEntries=20"
        response = requests.get(url)
        data = response.json()
        
        medications = []
        if 'approximateGroup' in data and 'candidate' in data['approximateGroup']:
            for med in data['approximateGroup']['candidate']:
                if 'name' in med:
                    medications.append(med['name'])
        
        # If no results from approximate match, try a direct search using findRxcuiByString
        if not medications:
            url = f"https://rxnav.nlm.nih.gov/REST/drugs.json?name={search_term}"
            response = requests.get(url)
            data = response.json()
            
            if 'drugGroup' in data and 'conceptGroup' in data['drugGroup']:
                for group in data['drugGroup']['conceptGroup']:
                    if 'conceptProperties' in group:
                        for med in group['conceptProperties']:
                            medications.append(med['name'])
        
        print(f"Found {len(medications)} medicines matching '{search_term}'")
        return jsonify({'medications': medications}), 200, response_headers
    except Exception as e:
        print(f"Error searching for medicines: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type'
        }

# Global variable to track chat generation progress
chat_progress = 0

@app.route('/chat-with-llama', methods=['POST', 'OPTIONS'])
def chat_with_llama():
    global chat_progress
    
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
        return ('', 204, response_headers)
    
    # Handle actual request
    response_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    try:
        # Reset progress for new request
        chat_progress = 0
        
        # Get data from request
        data = request.get_json()
        messages = data.get('messages', [])
        system_prompt = data.get('system_prompt', '')
        model = data.get('model', 'meta-llama/Llama-3.1-8B-Instruct')
        
        # Check if messages exist
        if not messages:
            return jsonify({'error': 'No messages provided'}), 400, response_headers
        
        # Verify API key is available
        if not TOGETHER_API_KEY:
            return jsonify({'error': 'API key not configured'}), 500, response_headers
        
        print(f"Chat request using model: {model}")
        print(f"System prompt: {system_prompt[:50]}...")
        
        # Format messages for the Together API
        formatted_messages = []
        
        # Add system message if provided
        if system_prompt:
            formatted_messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        # Add conversation messages
        for msg in messages:
            formatted_messages.append({
                "role": msg.get("role"),
                "content": msg.get("content")
            })
        
        # Call the Together API
        try:
            # Update to use the model available in your subscription
            # Note: Using Llama-3.3-70B-Instruct-Turbo-Free which we know works from your other endpoint
            response = client.chat.completions.create(
                model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
                messages=formatted_messages
            )
            
            chat_progress = 100  # Mark as complete
            
            if response.choices and len(response.choices) > 0:
                ai_response = response.choices[0].message.content
                return jsonify({
                    'message': 'Response generated successfully',
                    'response': ai_response
                }), 200, response_headers
            else:
                return jsonify({'error': 'No response generated'}), 500, response_headers
                
        except Exception as api_error:
            print(f"Error calling Together API: {str(api_error)}")
            return jsonify({'error': f'AI processing failed: {str(api_error)}'}), 500, response_headers
            
    except Exception as e:
        print(f"ERROR in chat_with_llama: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': f'Request processing failed: {str(e)}'}), 500, response_headers

@app.route('/chat-progress', methods=['GET'])
def get_chat_progress():
    global chat_progress
    return jsonify({'progress': chat_progress})

@app.route('/validate-medicines', methods=['POST'])
def validate_medicines():
    try:
        # Get the list of medicines from the request
        data = request.get_json()
        if not data or 'medicines' not in data:
            return jsonify({'error': 'No medicines provided'}), 400
        
        medicines_to_validate = data['medicines']
        validated_medicines = []
        
        # Validate each medicine against RxNorm
        for medicine in medicines_to_validate:
            # Call RxNorm API for approximate match
            url = f"https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term={medicine}&maxEntries=5"
            response = requests.get(url)
            data = response.json()
            
            # Check if any results were found
            found = False
            best_match = None
            best_score = 0
            
            if 'approximateGroup' in data and 'candidate' in data['approximateGroup']:
                candidates = data['approximateGroup']['candidate']
                if candidates:
                    # Find the best match (highest score)
                    for candidate in candidates:
                        if 'score' in candidate and 'name' in candidate:
                            if float(candidate['score']) > best_score:
                                best_score = float(candidate['score'])
                                best_match = candidate['name']
                    
                    # If score is above threshold, consider it validated
                    if best_score >= 5:  # Adjust threshold as needed
                        found = True
                    
            # If found in RxNorm, add to validated list
            if found and best_match:
                validated_medicines.append(best_match)  # Use the standardized name
            elif found:
                validated_medicines.append(medicine)  # Use original name if no better match
        
        return jsonify({
            'validated_medicines': validated_medicines,
            'original_count': len(medicines_to_validate),
            'validated_count': len(validated_medicines)
        })
        
    except Exception as e:
        print(f"Error validating medicines: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)