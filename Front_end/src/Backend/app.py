from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from api_services import (
    scan_image_logic,
    search_medicine_ai_logic,
    get_scan_progress_logic,
    search_medicines_logic
)

app = Flask(__name__)
CORS(app)

CAPTURE_FOLDER = 'captures'
UPLOAD_FOLDER = 'uploads'
app.config['CAPTURE_FOLDER'] = CAPTURE_FOLDER
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit

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

        prompts = {
            "medicine_info": "Act like a pharmacist and provide detailed information about the medicine in this image. On the contents(text) that will be provided it must be formatted properly.",
            "medicine_usage": "Describe the proper usage and dosage of the medicine shown in this image.",
            "medicine_complication": "List possible complications, side effects, and contraindications of the medicine in this image.",
            # "medicine_hazard": "Put also the hazard or what will happen to them if they will not take this medicine.",
            # "medicine_emergency": "Based on the prescription scanned, please provide information on the symptoms when to go to the doctor if the prescription is not taken, or not taken properly."
        }

        responses = {}
        total_prompts = len(prompts)
        progress_per_prompt = 60 / total_prompts  # 60% of progress distributed across prompts

        for i, (key, prompt) in enumerate(prompts.items()):
            # Update progress for each prompt processing
            scan_progress = 20 + int(i * progress_per_prompt)
            
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
                responses[key] = response.choices[0].message.content
            else:
                responses[key] = "No content received from LLaMA."
                
            # Update progress after each prompt is processed
            scan_progress = 20 + int((i + 1) * progress_per_prompt)

        # Final processing and formatting
        scan_progress = 100
        
        print("Responses:", responses)  # Debugging
        
        # Complete
        scan_progress = 100
        
        return jsonify({
            'message': 'Image processed successfully',
            'medicine_info': responses["medicine_info"],
            'medicine_usage': responses["medicine_usage"],
            'medicine_complication': responses["medicine_complication"],
            # 'medicine_hazard': responses["medicine_hazard"],
            # 'medicine_emergency': responses["medicine_emergency"],
            'progress': 100
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'AI processing failed: {str(e)}'}), 500


        return jsonify({'error': 'Invalid file type'}), 400

import threading



@app.route('/scan-progress', methods=['GET'])
def get_scan_progress():
    global scan_progress
    return jsonify({'progress': scan_progress})
    
@app.route('/search-medicine-ai/<medicine_name>', methods=['GET'])
def search_medicine_ai(medicine_name):
    return search_medicine_ai_logic(medicine_name)

@app.route('/medicines/search/<search_term>', methods=['GET'])
def search_medicines(search_term):
    return search_medicines_logic(search_term)


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

if __name__ == '__main__':
    app.run(debug=True, port=5001)