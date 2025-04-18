import React, { useRef, useState, useEffect } from 'react';
import '../css/scan.css';
import logo from '../assets/images/scanseta_logo_white.png';
import Webcam from 'react-webcam';
import resetIcon from '../assets/icons/scan_success/reset.png';
import proceedIcon from '../assets/icons/scan_success/proceed.png';
import homeIcon from '../assets/icons/scan_success/home.png';
import axios from 'axios';
import { Progress } from '@radix-ui/react-progress';

const Scan = ({ goNext, goBack }) => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [progressPolling, setProgressPolling] = useState(null);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      alert('Image captured successfully!'); // or update UI to show image captured
    } else {
      alert('Failed to capture image. Please try again.');
    }
  };

  // Function to fetch progress from the backend and simulate smooth progress
  const fetchProgress = async () => {
    try {
      const response = await axios.get('http://localhost:5001/scan-progress');
      const backendProgress = response.data.progress;
      
      // Get the current progress and increment it smoothly
      setScanProgress(prevProgress => {
        // If backend progress is higher, jump to it
        if (backendProgress > prevProgress) {
          return backendProgress;
        }
        // Otherwise increment by 1% up to the next checkpoint or 99% max
        else if (prevProgress < 99) {
          // Find the next checkpoint (20%, 40%, 60%, 80%, 100%)
          const nextCheckpoint = Math.ceil(prevProgress / 20) * 20;
          // Only increment if we haven't reached the next checkpoint
          return prevProgress < nextCheckpoint - 1 ? prevProgress + 1 : prevProgress;
        }
        return prevProgress;
      });
      
      // If backend says we're done, set to 100%
      if (backendProgress >= 100) {
        setScanProgress(100);
        setScanSuccess(true);
        
        // Clear polling interval if it's still active
        if (progressPolling) {
          clearInterval(progressPolling);
          setProgressPolling(null);
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };
  
  const handleProceed = async () => {
    if (!capturedImage) {
      alert('Please capture an image first.');
      return;
    }

    try {
      // Reset progress before starting
      setScanProgress(0);
      setScanSuccess(false);
      
      // Start polling for progress with a faster interval for smoother updates
      const intervalId = setInterval(fetchProgress, 200); // Poll every 200ms for smoother 1% increments
      setProgressPolling(intervalId);
      
      // Convert the captured image to a file
      const blob = await fetch(capturedImage).then((res) => res.blob());
      const file = new File([blob], 'capture.png', { type: 'image/png' });
      
      console.log('File to upload:', file.name, file.type);

      // Send the file to the server
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://localhost:5001/scan-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Make sure progress is set to 100
      setScanProgress(100);
      setScanSuccess(true);
      
      // Clear polling interval if it's still active
      if (progressPolling) {
        clearInterval(progressPolling);
        setProgressPolling(null);
      }
      
      console.log('Server response:', response.data);
      goNext(); // Proceed to the next step
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to process image. Please try again.');
      
      // Clear polling interval on error
      if (progressPolling) {
        clearInterval(progressPolling);
        setProgressPolling(null);
      }
    }
  };

  return (
    <div className="scan-success-dashboard">
      <div className="logo-container">
        <img src={logo} alt="Scanseta Logo" className="logo" />
      </div>
      <button className="home-button" onClick={goBack}>
        <img src={homeIcon} alt="Home" className="home-icon" />
      </button>
      <div className="image-container">
        <p className="instruction-text">
          Please place your prescription on the <br />scanner deck
        </p>
        <div className="container1">
          <div className="container2">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/png"
              className={`webcam ${isWebcamReady ? 'ready' : ''}`}
              onUserMedia={() => setIsWebcamReady(true)}
              onUserMediaError={() => setIsWebcamReady(false)}
            />
          </div>
          <div className="progress">
            <Progress value={scanProgress} />
            <p className="progress-text">
              {scanProgress < 100 ? `Processing... ${scanProgress}%` : "Scanned successfullsadasdy"}
            </p>
          </div>
        </div>
        <div className="scan-buttons">
          <button className="scan-button-small" onClick={capture}>
            <img src={resetIcon} alt="Reset" className="button-icon" />
          </button>
          <button className="scan-button-large" onClick={handleProceed}>
            <img src={proceedIcon} alt="Proceed" className="button-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Scan;