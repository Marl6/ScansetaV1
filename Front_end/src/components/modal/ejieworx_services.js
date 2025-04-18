/**
 * Services for interacting with the Llama 3.1-8B-Instruct AI model
 */

// Base URL for backend API
const API_URL = 'http://localhost:5001';

/**
 * Sends a user message to the Llama 3.1-8B-Instruct model and returns the AI response
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous messages for context (optional)
 * @returns {Promise<Object>} - The AI response
 */
export const sendMessageToLlama = async (message, conversationHistory = []) => {
  try {
    // Format conversation history for the model
    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // Add the current message
    const conversation = [
      ...formattedHistory,
      { role: 'user', content: message }
    ];

    const response = await fetch(`${API_URL}/chat-with-llama`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: conversation,
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', // Using the model available in your Together AI subscription
        // Medicine-specific system prompt
        system_prompt: 'You are a knowledgeable medical assistant focused on providing accurate information about medications, treatments, and general health topics. Respond with clear, factual information suitable for a general audience. Avoid making definitive medical diagnoses or recommendations that should come from a healthcare professional. Always clarify that users should consult with healthcare professionals for personal medical advice.'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response from AI model');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error communicating with Llama model:', error);
    throw error;
  }
};

/**
 * Get the current progress of an ongoing Llama model generation
 * @returns {Promise<Object>} - Progress information (0-100%)
 */
export const getGenerationProgress = async () => {
  try {
    const response = await fetch(`${API_URL}/chat-progress`);
    if (!response.ok) {
      throw new Error('Failed to fetch progress');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching chat progress:', error);
    return { progress: 100 }; // Return 100% on error to avoid stalled UI
  }
};
