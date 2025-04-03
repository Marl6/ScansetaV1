import React, { useRef, useState, useEffect } from 'react';
import '../css/scan.css';
import logo from '../assets/images/scanseta_logo_white.png';
import Webcam from 'react-webcam';
import resetIcon from '../assets/icons/scan_success/reset.png';
import proceedIcon from '../assets/icons/scan_success/proceed.png';
import homeIcon from '../assets/icons/scan_success/home.png';
import axios from 'axios';

const Scan = ({ goNext, goBack }) => {
  const webcamRef = useRef(null);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      alert('Image captured successfully!'); // or update UI to show image captured
    } else {
      alert('Failed to capture image. Please try again.');
    }
  };

  const handleProceed = async () => {
    if (!capturedImage) {
      alert('Please capture an image first.');
      return;
    }

    try {
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

      console.log('Server response:', response.data);
      goNext(); // Proceed to the next step
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to process image. Please try again.');
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
            <div className="progress-bar"></div>
            <p className="progress-text">Scanned successfully</p>
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