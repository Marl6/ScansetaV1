import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam'; // Install with `npm install react-webcam`
import logo from '../assets/images/scanseta_logo_white.png'; // Adjust the path as needed
import homeIcon from '../assets/icons/scan_success/home.png'; // Import the home icon
import '../css/uploadFile.css';
import Fuse from 'fuse.js'; // Import fuse.js for fuzzy matching
import 'animate.css';

// Define valid medicines with full names
const validMedicines = [
  "Acyclovir",
  "Penicillin",
  "Amlodipine",
  "Amoxicillin",
  "Azathioprine",
  "Bactrim",
  "Clavulanate",
  "Fosfomycin",
  "Glimepiride",
  "Griseofulvin",
  "Insulin",
  "Losartan",
  "Metformin",
  "Metropolol",
  "Nitrofurantoin"
];

const UploadFile = ({ goNext, goBack, goToMedInfo, setMedicineData }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [previewImage, setPreviewImage] = useState(null); // State for the image preview
  const [predictedMedicine, setPredictedMedicine] = useState(null); // State to store predicted medicine name
  const [toggleMode, setToggleMode] = useState('Upload'); // State for the toggle mode
  const webcamRef = useRef(null); // Reference for the webcam
  const [fadeAnimation, setFadeAnimation] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showMedicineDisplay, setShowMedicineDisplay] = useState(true);
  const [statusMessage, setStatusMessage] = useState(''); // State for status message
  const [isDetectedDisplayVisible, setIsDetectedDisplayVisible] = useState(true); // State for controlling visibility
  const [isResetButtonNotVisible, setResetButtonNotVisible] = useState(false); // State for controlling visibility
  const [isProceedtButtonNotVisible, setProceedButtonNotVisible] = useState(false); // State for controlling visibility
  const [progress, setProgress] = useState(0); // State for progress bar
  
  // Fuse.js options for fuzzy matching
  const fuse = new Fuse(validMedicines, {
    includeScore: true,
    threshold: 0.4, // Adjust the threshold for fuzziness (lower is more lenient)
  });

  useEffect(() => {
    if (predictedMedicine) {
      const results = fuse.search(predictedMedicine);
      const closestMatch = results.length > 0 ? results[0].item : null;
  
      if (closestMatch) {
        setPredictedMedicine(closestMatch); // Automatically update with the closest match
      }
    }
    console.log('Preview image updated:', previewImage); 
  }, [previewImage, predictedMedicine]); // Both dependencies should be in a single array
  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log(selectedFile);
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file)); // Create a preview URL for the selected image
      setStatusMessage('Image uploaded successfully');
      setTimeout(() => setStatusMessage(''), 1800); // Reset after 3 seconds
    }
  };

  const handleCaptureImage = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      const blob = dataURItoBlob(imageSrc);
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      
      if (!file.size || file.size === 0) {
        setStatusMessage('Failed to capture image. Please try again.');
        setTimeout(() => setStatusMessage(''), 3000);
        return;
      }
  
      setPreviewImage(imageSrc);
      setSelectedFile(file);
      setProgress(20); // Example progress update
      setStatusMessage('Image captured successfully');
      setTimeout(() => setStatusMessage(''), 3000);
  
      console.log('File to upload:', file.name, file.type); // Debug logging
  
      setProgress(40);
      const formData = new FormData();
      formData.append('file', file);
  
      try {
        const response = await fetch('http://localhost:5001/scan-image', {
          method: 'POST',
          body: formData,
        });
  
        setProgress(60);
        const result = await response.json();
        console.log(result);
  
        if (response.ok) {
          setStatusMessage('Scan successful');
          setTimeout(() => setStatusMessage(''), 3000);
  
          setMedicineData({
            medicine_info: result.medicine_info,
            medicine_usage: result.medicine_usage,
            medicine_complication: result.medicine_complication,
            medicine_hazard: result.medicine_hazard,
            medicine_emergency: result.medicine_emergency
          });
  
          goToMedInfo(); // Assuming this function exists to navigate or show results
        } else {
          setStatusMessage(result.error || 'Failed to scan the image.');
          setProgress(0);
        }
      } catch (error) {
        console.error('Error in handleCaptureImage:', error);
        setUploadStatus('Error occurred while scanning the image.');
        setProgress(0);
      }
    }
  };
  

  const handleScanImage = async () => {
    if (!selectedFile) {
      setStatusMessage('No image selected. Please upload or capture one first.');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }
  
    setProgress(40);
    const formData = new FormData();
    formData.append('file', selectedFile);
  
    try {
      const response = await fetch('http://localhost:5001/scan-image', {
        method: 'POST',
        body: formData,
      });
  
      setProgress(60);
      const result = await response.json();
      console.log(result);
  
      if (response.ok) {
        setStatusMessage('Scan successful');
        setTimeout(() => setStatusMessage(''), 3000);
  
        setMedicineData({
          medicine_info: result.medicine_info,
          medicine_usage: result.medicine_usage,
          medicine_complication: result.medicine_complication,
          medicine_hazard: result.medicine_hazard,
          medicine_emergency: result.medicine_emergency
        });
  
        goToMedInfo();
      } else {
        setStatusMessage(result.error || 'Failed to scan the image.');
        setProgress(0);
      }
    } catch (error) {
      setUploadStatus('Error occurred while scanning the image.');
      setProgress(0);
    }
  };
  

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const getMedicineInfo = async (medicineName) => {
    // Capitalize the first letter and make the rest lowercase
    const formattedMedicineName = medicineName.charAt(0).toUpperCase() + medicineName.slice(1).toLowerCase();
  
    try {
      const response = await fetch(`http://localhost:5000/medicine/${formattedMedicineName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch medicine info');
      }
      return await response.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleProceed = async () => {
    if (!predictedMedicine) {
      setUploadStatus('No predicted medicine to proceed with.');
      return;
    }

    try {
      const data = await getMedicineInfo(predictedMedicine);
      console.log(data); // Log fetched data to inspect its structure
      if (data) {
        // Set the medicine data and navigate to the next page
        setMedicineData(data); // Pass the data to the parent component
        goToMedInfo(predictedMedicine); // Navigate to the next page
      } else {
        setUploadStatus('No data found for this medicine.');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setUploadStatus('Error fetching data.');
    }
  };
  
  useEffect(() => {
    if (statusMessage === "No Medicine Found") {
      setIsDetectedDisplayVisible(false); // Hide detected medicine container
      setProceedButtonNotVisible(false); // Hide the proceed button
      setPredictedMedicine(null);
    } else if (statusMessage === "Image uploaded successfully") {
      setIsDetectedDisplayVisible(false); // Hide detected medicine container
      setProceedButtonNotVisible(false); // Hide the proceed button
      setPredictedMedicine(null);


    } else if (statusMessage) {
      setIsDetectedDisplayVisible(true); // Default behavior for other status messages
      setProceedButtonNotVisible(true); // Default behavior for other status messages
    }
  }, [statusMessage]);
  

  const handleScanImageClick = () => {
    handleScanImage(); // This should update statusMessage accordingly
  };
  return (
    <div className="dashboard">
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
        />
      <div className="header">
        <img src={logo} alt="Scanseta_Logo" className="logo" />
        <button className="home-button" onClick={goBack}>
          <img src={homeIcon} alt="Home" className="home-icon" />
        </button>
      </div>
  
      <div className="overall-upload-container">
  
        <div className="proceed-viewinfo-button">
          {isProceedtButtonNotVisible&& (
          <button
            className="viewinfo-button"
            onClick={() => {
              handleProceed(); 
            }}
            style={{
              cursor: predictedMedicine ? "pointer" : "not-allowed",
            }}
          >
            <span>Proceed to View Information</span>
          </button>
          )}
          {showWarning &&
          <p className="warning-text">Please reset the medicine display.</p>},

        </div>
  
        <div
          className="content-upload-container"
          style={{
            justifyContent: predictedMedicine ? "center" : "center",
          }}
        >

      
          {/* Conditionally Render Information Display */}
          {predictedMedicine && toggleMode !== "Camera" && (
            <div className="information-display">
              <div className="information-title-display">
                <strong>DETECTED MEDICINE</strong>
              </div>


              <div className="information-content-display">
                <div className="medicine-content-display">

                  {isDetectedDisplayVisible && (
                  <div className="medicine-detected-display">
                    <p className="predicted-medicine">{predictedMedicine}</p>
                    <button
                      className="medicine-remove-button"
                      onClick={() => {
                        setIsDetectedDisplayVisible(false)
                        setResetButtonNotVisible(true);
                        setProceedButtonNotVisible(false);
                        setProgress(0); // Initial progress

                      }} // Hide the container
                    >
                      <span>x</span>
                    </button>
                  </div>
                  )}
                </div>
                {isResetButtonNotVisible && (
                <div className="buttons-content-display">
                  <button
                    className="reset-button"
                    onClick={() => {
                      setIsDetectedDisplayVisible(true); // Show the container
                      setResetButtonNotVisible(false);  // Update reset button visibility
                      setProceedButtonNotVisible(true);
                      setProgress(100);
                    }}
                    
                  >
                    <span>Reset</span>
                  </button>
                </div>
                )}
              </div>
  
              <div className="note-content-display">
                <strong>Note: </strong> You may remove drugs as desired for medicine information view.
              </div>
            </div>
          )}
          <div className="divider-information-display">

          </div>
          {/* Image Display */}
          <div className="image-display">
  
            <div className="main-container-image-display">
              <div className="container-image-display">
                {toggleMode === "Camera" ? (
                  previewImage ? (
                    <img src={previewImage} alt="Captured" className="preview-img" />
                  ) : (
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="webcam-feed"
                    />
                  )
                ) : previewImage ? (
                  <img src={previewImage} alt="Selected" className="preview-img" />
                ) : (
                  <p className="placeholder">No image selected.</p>
                )}
              </div>


              <div class="progress-container">
                <div className="progress-image-display" style={{ width: `${progress}%` }}></div>
              </div>


              <div className="status-image-display">
              {statusMessage && (
                <p className="status-text">{statusMessage}</p>
              )}
              </div>
            </div>
  
            <div className="overall-buttons-container">
              <div className="choose-container">
                <div className="toggle-container">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      id="toggle"
                      onChange={(e) => {
                        const mode = e.target.checked ? "Camera" : "Upload";
                        setToggleMode(mode);
                        setPreviewImage(null); // Clear webcam feed
                        setPredictedMedicine(null); 
                        setProceedButtonNotVisible(false);
                        setProgress(0); // Initial progress
                        
                      }}
                    />
                    <span className="slider">
                      <span className="toggle-text"
                        onClick={() => setPredictedMedicine(null)} // Hides the display
                      > {toggleMode}</span>
                    </span>
                  </label>
                </div>
  
                <div className="divider-scan-buttons"></div>
                {toggleMode === "Upload" ? (
                  <>
                    <button
                      className="upload-button"
                      onClick={() => {
                        setProceedButtonNotVisible(false);
                        document.getElementById("file-input").click();
                        
                      }}
                    >
                      Upload
                    </button>
                    <input
                      type="file"
                      id="file-input"
                      className="file-input"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </>
                ) : (
                  <button className="upload-button" onClick={handleCaptureImage}>
                    <span>Capture</span>
                    <input
                      type="file"
                      id="file-input"
                      className="file-input"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </button>
                  
                )}
              </div>
            </div>
  
            <div
              className="scan-image-container"
              onClick={handleScanImageClick}
              style={{
                cursor: previewImage ? "pointer" : "not-allowed",
              }}
              disabled={!previewImage}
            >
              <span className="scan-image-text">Scan Image</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer"></div>
      
    </div>
  );
}
  
export default UploadFile;
