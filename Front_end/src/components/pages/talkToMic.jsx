import React, { useState, useEffect } from 'react';
import '../css/talkToMic.css';
import logo from '../assets/images/scanseta_logo_white.png';
import homeIcon from '../assets/icons/scan_success/home.png'; // Import the home icon
import speakerIcon from '../assets/icons/speaker.png'; // Import the speaker icon
import axios from 'axios'; // Import axios for API requests

const TalkToMic = ({ goBack }) => {
  // State to manage the recording and result display
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(10); // Initialize countdown to 10 seconds
  const [isRecordingComplete, setIsRecordingComplete] = useState(false); // Track if recording is complete
  const [gptResponse, setGptResponse] = useState(''); // Store GPT response

  const handleTalkToMicClick = async () => {
    setIsRecording(true);
    setIsRecordingComplete(false);
    setCountdown(10);
    setGptResponse('');

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsRecording(false);
          setIsRecordingComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const response = await axios.post('http://localhost:5001/start-voice-process');
      console.log('Response from start-voice-process:', response.data);  // Debugging

      if (response.data.gpt_response) {
        setGptResponse(response.data.gpt_response);
      } else {
        console.error('No gpt_response in the server response');
        alert('No response received from the server.');
      }
    } catch (error) {
      setIsRecording(false);
      console.error('Error in voice process:', error);
      alert('Error in voice process: ' + error.message);
    }
  };

  const playAudio = async () => {
    try {
      const response = await axios.get('http://localhost:5001/get-audio', {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const audio = new Audio(url);
      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
        alert('Failed to play audio. Please try again.');
      });
    } catch (error) {
      console.error('Error fetching audio:', error);
      alert('Failed to fetch audio. Please try again.');
    }
  };

  // Use useEffect to close the "Recording complete..." popup after a delay
  useEffect(() => {
    if (isRecordingComplete) {
      const timer = setTimeout(() => {
        setIsRecordingComplete(false); // Close the popup after 2 seconds
      }, 2000); // Adjust the delay as needed
      return () => clearTimeout(timer); // Cleanup timer
    }
  }, [isRecordingComplete]);

  return (
    <div className="dashboard">
      <div className="header">
        <img src={logo} alt="Scanseta Logo" className="logo" />
        <button className="home-button" onClick={goBack}>
          <img src={homeIcon} alt="Home Icon" className="home-icon" />
        </button>
      </div>

      <div className="buttons">
        <button onClick={handleTalkToMicClick}>
          <h2>Talk to Mic</h2>
          <p>Voice-assisted interaction</p>
        </button>
      </div>

      {/* Show the popup with countdown if recording is in progress */}
      {isRecording && (
        <div className="popup">
          <div className="popup-content">
            <h3>Recording...</h3>
            <p>Recording for {countdown} seconds...</p>
          </div>
        </div>
      )}

      {/* Show "Recording complete..." message after countdown reaches zero */}
      {isRecordingComplete && (
        <div className="popup">
          <div className="popup-content">
            <h3>Recording complete...</h3>
          </div>
        </div>
      )}

      {/* Display GPT response in a text area below the button */}
      <textarea
        value={gptResponse}
        placeholder="GPT Response will appear here"
        rows="6"
        cols="50"
        disabled
      />

      {/* Add the speaker icon below the textarea */}
      <img 
        src={speakerIcon} // Use the imported image
        alt="Speaker Icon"
        className="speaker-icon"
        onClick={playAudio}
        style={{cursor: "pointer"}} // Makes the cursor change to a hand when hovering over the icon
      />

      <div className="footer"></div>
    </div>
  );
};

export default TalkToMic;