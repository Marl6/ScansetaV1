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
  const [predictedMedicines, setPredictedMedicines] = useState([]); // State to store array of predicted medicine names
  const [originalMedicines, setOriginalMedicines] = useState([]); // State to track original medicines before removal
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
  const [scanButtonState, setScanButtonState] = useState('hidden'); // 'hidden', 'scan', 'loading', 'proceed'
  const [isLoading, setIsLoading] = useState(false); // State to track loading during medicine validation
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // State for confirmation modal
  const [confirmationModalData, setConfirmationModalData] = useState({
    title: '',
    message: '',
    onConfirm: () => {}, // Default empty function
    onCancel: () => {}, // Default empty function
  });
  
  // Fuse.js options for fuzzy matching
  const fuse = new Fuse(validMedicines, {
    includeScore: true,
    threshold: 0.4, // Adjust the threshold for fuzziness (lower is more lenient)
  });

  useEffect(() => {
    if (predictedMedicines.length > 0) {
      // For each predicted medicine, find the closest match using Fuse.js
      const updatedMedicines = predictedMedicines.map(medicine => {
        if (typeof medicine === 'string') {
          const results = fuse.search(medicine);
          return results.length > 0 ? results[0].item : medicine;
        }
        return medicine;
      });
      
      // Update with the closest matches
      setPredictedMedicines(updatedMedicines);
    }
    console.log('Preview image updated:', previewImage); 
  }, [previewImage, predictedMedicines.length]); // Dependencies
  
  // Function to validate medicines against RxNorm
  const validateMedicinesWithRxNorm = async (medicines) => {
    try {
      setIsLoading(true);
      console.log('Validating medicines with RxNorm:', medicines);
      
      // Call the validate-medicines endpoint
      const response = await fetch('http://127.0.0.1:5001/validate-medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ medicines }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Validated medicines:', data.validated_medicines);
        console.log(`Original count: ${data.original_count}, Validated count: ${data.validated_count}`);
        
        // Use validated medicines if any exist, otherwise set to empty array
        // This ensures Final detected medicines is empty when no medicines are validated
        const finalMedicines = data.validated_medicines.length > 0 
          ? data.validated_medicines 
          : [];
        
        console.log('Final detected medicines:', finalMedicines);
        setPredictedMedicines(finalMedicines);
        setOriginalMedicines(finalMedicines); // Store the original list for reset
        
        // Update scan button state based on validation results
        if (finalMedicines.length === 0) {
          // If no medicines were validated, hide the scan button
          setScanButtonState('hidden');
          setStatusMessage('No valid medicines detected');
          setTimeout(() => setStatusMessage(''), 3000);
        } else {
          // Only set to proceed if we have valid medicines
          setScanButtonState('proceed');
        }
      } else {
        console.error('Error validating medicines:', data.error);
        // Fall back to the original medicines
        setPredictedMedicines(medicines);
        setOriginalMedicines(medicines);
      }
    } catch (error) {
      console.error('Error validating medicines:', error);
      // Fall back to the original medicines
      setPredictedMedicines(medicines);
      setOriginalMedicines(medicines);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    // Reset to the original list of medicines
    setPredictedMedicines(originalMedicines);
  };


  
  // Cleanup effect for progress polling interval
  useEffect(() => {
    // Cleanup function that runs when component unmounts
    return () => {
      if (window.progressInterval) {
        clearInterval(window.progressInterval);
        window.progressInterval = null;
      }
    };
  }, []); // Empty dependency array means this runs on mount and cleanup on unmount

  // Reset scanButtonState to 'scan' whenever information-display is hidden (predictedMedicines is empty)
  useEffect(() => {
    if (predictedMedicines.length === 0) {
      setScanButtonState('scan');
    }
  }, [predictedMedicines.length]);
  

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log(selectedFile);
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file)); // Create a preview URL for the selected image
      setStatusMessage('Image uploaded successfully');
      setTimeout(() => setStatusMessage(''), 1800); // Reset after 1.8 seconds
      
      // Show scan button when image is uploaded
      setScanButtonState('scan');
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
      
      // Show scan button when image is captured
      setScanButtonState('scan');
  
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
  
          // goToMedInfo(); // Assuming this function exists to navigate or show results
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
  

  // Function to fetch progress from the backend and simulate smooth progress
  const fetchProgress = async () => {
    try {
      const response = await fetch('http://localhost:5001/scan-progress');
      const data = await response.json();
      const backendProgress = data.progress;
      
      // Get the current progress
      setProgress(prevProgress => {
        // If backend progress is higher, jump to it
        if (backendProgress > prevProgress) {
          return backendProgress;
        }
        // Otherwise increment by 1% up to 99% max regardless of checkpoints
        else if (prevProgress < 99) {
          // Always increment by 1% to ensure smooth progress
          return prevProgress + 1;
        }
        return prevProgress;
      });
      
      // Update status message based on progress
      setProgress(currentProgress => {
        setStatusMessage(`Processing... ${currentProgress}%`);
        return currentProgress;
      });
      
      // If backend says we're done, set to 100%
      if (backendProgress >= 100) {
        setProgress(100);
        setStatusMessage('Scan successful');
        // Clear the interval when we reach 100%
        if (window.progressInterval) {
          clearInterval(window.progressInterval);
          window.progressInterval = null;
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleScanImage = async () => {
    if (!selectedFile) {
      setStatusMessage('No image selected. Please upload or capture one first.');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }
  
    // Reset progress and start from 0
    setProgress(0);
    setStatusMessage('Starting scan process...');
    
    // Update button state to loading
    setScanButtonState('loading');
    
    // Start polling for progress
    if (window.progressInterval) {
      clearInterval(window.progressInterval);
    }
    // Poll every 200ms for smoother 1% increments
    window.progressInterval = setInterval(fetchProgress, 200);
  
    const formData = new FormData();
    formData.append('file', selectedFile);
  
    try {
      const response = await fetch('http://localhost:5001/scan-image', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      console.log(result);
  
      if (response.ok) {
        // Create a smooth transition from current progress to 100%
        // First stop the current interval
        if (window.progressInterval) {
          clearInterval(window.progressInterval);
          window.progressInterval = null;
        }
        
        // Get current progress and create a smooth animation to 100%
        const currentProgress = progress;
        if (currentProgress < 100) {
          // Force a smooth transition to 100% in about 1 second
          const remainingSteps = 100 - currentProgress;
          const stepTime = 1000 / remainingSteps; // Time per step to complete in ~1 second
          
          let progressCounter = currentProgress;
          const completeInterval = setInterval(() => {
            progressCounter += 1;
            setProgress(progressCounter);
            setStatusMessage(`Processing... ${progressCounter}%`);
            
            if (progressCounter >= 100) {
              clearInterval(completeInterval);
              setStatusMessage('Scan successful');
              setTimeout(() => setStatusMessage(''), 3000);
              
              // Don't set button state to proceed yet - will be set after validation completes
              // Only if valid medicines are found
              
              // Now proceed with the rest of the handling after reaching 100%
              // Process scan results - the new structure has medicine-specific data
              setMedicineData({
                detected_medicines: result.detected_medicines, // Comma-separated list of medicines
                medicine_data: result.medicine_data, // Medicine-specific information
              });
              
              // Get detected medicines from the API response
              // The backend now provides a direct list of medicine names
              let detectedMedicines = [];
              
              // Parse the detected_medicines from the API response
              if (result.detected_medicines) {
                // The response should be a comma-separated list of medicine names
                detectedMedicines = result.detected_medicines
                  .split(',')
                  .map(name => name.trim())
                  .filter(name => name.length > 0);
                
                console.log('Detected medicines from API:', detectedMedicines);
                
                // If no medicines were detected, show status message
                if (detectedMedicines.length === 0) {
                  setStatusMessage('No medicine found');
                  setTimeout(() => setStatusMessage(''), 3000);
                  setScanButtonState('hidden');
                } else {
                  // Validate medicines against RxNorm database
                  validateMedicinesWithRxNorm(detectedMedicines);
                }
              } else {
                // If no medicines were detected in the response
                console.log('No medicines detected in API response');
                setStatusMessage('No medicine found');
                setTimeout(() => setStatusMessage(''), 3000);
                
                // Set empty medicines list
                setPredictedMedicines([]);
                setOriginalMedicines([]);
                
                // Hide scan button
                setScanButtonState('hidden');
              }
              
              // Don't automatically navigate to med info, let user click proceed button
              // goToMedInfo();
            }
          }, stepTime);
        } else {
          // Already at 100%, proceed immediately
          setStatusMessage('Scan successful');
          setTimeout(() => setStatusMessage(''), 3000);
          
          // Don't set button state to proceed yet - will be handled after validation
          // setScanButtonState('proceed');
          
          // Process scan results - using the new medicine-specific data structure
          setMedicineData({
            detected_medicines: result.detected_medicines, // Comma-separated list of medicines
            medicine_data: result.medicine_data, // Medicine-specific information
          });
          
          // Get detected medicines from the API response
          // The backend provides a direct list of medicine names
          let detectedMedicines = [];
          
          // Parse the detected_medicines from the API response
          if (result.detected_medicines) {
            // The response should be a comma-separated list of medicine names
            detectedMedicines = result.detected_medicines
              .split(',')
              .map(name => name.trim())
              .filter(name => name.length > 0);
            
            console.log('Detected medicines from API:', detectedMedicines);
          }
          
          // If no medicines were detected, add a placeholder
          if (!detectedMedicines || detectedMedicines.length === 0) {
            detectedMedicines = ['Medicine detected']; // Generic placeholder
            console.log('No medicines detected, using placeholder');
          }
          
          console.log('Final detected medicines:', detectedMedicines);
          setPredictedMedicines(detectedMedicines);
          setOriginalMedicines(detectedMedicines); // Store the original list for reset
          
          // Don't automatically navigate to med info, let user click proceed button
          // goToMedInfo();
        }
      } else {
        // Handle non-OK response
        setStatusMessage(`Error: ${result.error || 'Unknown error occurred'}`);
        setTimeout(() => setStatusMessage(''), 3000);
        
        // Reset the scan button to allow retrying
        setScanButtonState('scan');
        
        // Clean up interval
        if (window.progressInterval) {
          clearInterval(window.progressInterval);
          window.progressInterval = null;
        }
      }
    } catch (error) {
      console.error('Error scanning image:', error);
      setUploadStatus(`Error: ${error.message}`);
      setStatusMessage(`Error: ${error.message}`);
      setTimeout(() => setStatusMessage(''), 3000);
      
      // Reset the scan button to allow retrying
      setScanButtonState('scan');
      
      // Clean up interval
      if (window.progressInterval) {
        clearInterval(window.progressInterval);
        window.progressInterval = null;
      }
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
      // Using port 5001 to match the scan-image endpoint
      const response = await fetch(`http://localhost:5001/search-medicine-ai/${formattedMedicineName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch medicine info');
      }
      return await response.json();
    } catch (err) {
      console.error(err);
      // Since we already have the medicine data from scanning, we can use that as a fallback
      return {
        // This creates a minimal valid response
        medicine_name: formattedMedicineName
      };
    }
  };

  const handleProceed = async () => {
    if (!predictedMedicines || predictedMedicines.length === 0) {
      setUploadStatus('No predicted medicines to proceed with.');
      return;
    }

    try {
      // We should navigate directly to the medicine info page with the current medicine list
      // We've already set the medicine data during scanning, so no need to fetch again
      
      // Create an updated medicine data object with the current list of medicines
      // This ensures only the remaining medicines (after user removal) are sent to MedInfo
      const updatedMedicineData = {
        detected_medicines: predictedMedicines.join(','), // Join as comma-separated string
        medicine_data: {} // We'll populate this with only the remaining medicines
      };
      
      // Get the last set medicine data (which has all medicine info)
      const currentMedicineData = await new Promise(resolve => {
        // This is a hack to get the current medicineData from the parent
        // We first set a dummy value, then immediately call the callback which gives us the updated state
        setMedicineData(prev => {
          resolve(prev);
          return prev; // Return the same state to avoid an actual state change
        });
      });
      
      // Only include data for medicines that haven't been removed
      if (currentMedicineData && currentMedicineData.medicine_data) {
        predictedMedicines.forEach(medicine => {
          if (currentMedicineData.medicine_data[medicine]) {
            updatedMedicineData.medicine_data[medicine] = currentMedicineData.medicine_data[medicine];
          }
        });
      }
      
      console.log('Proceeding with filtered medicines:', predictedMedicines);
      
      // Update the medicine data with only the remaining medicines
      setMedicineData(updatedMedicineData);
      
      // Navigate to the medicine info page with all remaining medicines
      goToMedInfo(predictedMedicines[0]); // We still pass the first medicine as the primary one
    } catch (err) {
      console.error('Error processing data:', err);
      setUploadStatus('Error processing data.');
    }
  };
  
  useEffect(() => {
    if (statusMessage === "No Medicine Found") {
      setIsDetectedDisplayVisible(false); // Hide detected medicine container
      setProceedButtonNotVisible(false); // Hide the proceed button
      setPredictedMedicines([]);
    } else if (statusMessage === "Image uploaded successfully") {
      setIsDetectedDisplayVisible(false); // Hide detected medicine container
      setProceedButtonNotVisible(false); // Hide the proceed button
      setPredictedMedicines([]);


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
          {scanButtonState !== 'hidden' && previewImage && (
          <button
            className={`viewinfo-button ${scanButtonState === 'loading' ? 'loading' : ''}`}
            data-state={scanButtonState === 'proceed' ? 'proceed' : 'scan'}
            onClick={() => {
              if (scanButtonState === 'scan') {
                // Start scanning process
                setScanButtonState('loading');
                handleScanImage();
              } else if (scanButtonState === 'proceed') {
                // Proceed to view information
                handleProceed();
              }
            }}
          >
            {scanButtonState === 'scan' && (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Scan</span>
              </>
            )}
            {scanButtonState === 'loading' && <span className="loading-icon">⟳</span>}
            {scanButtonState === 'proceed' && (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Proceed to View Information</span>
              </>
            )}
          </button>
          )}
          {showWarning &&
          <p className="warning-text">Please reset the medicine display.</p>},

        </div>
  
        <div
          className="content-upload-container"
          style={{
            justifyContent: predictedMedicines.length > 0 ? "center" : "center",
          }}
        >

      
          {/* Conditionally Render Information Display */}
          {predictedMedicines.length > 0 && (
            <div className="information-display">
              <div className="information-title-display">
                <strong>DETECTED MEDICINE</strong>
              </div>


              <div className="information-content-display">
                <div className="medicine-content-display">

                  {isDetectedDisplayVisible && predictedMedicines.map((medicine, index) => (
                    <div className="medicine-detected-display" key={`medicine-${index}`}>
                      <p className="predicted-medicine">{medicine}</p>
                       <button
                        className="medicine-remove-button"
                        onClick={() => {
                          // Check if this is the last medicine in the list
                          if (predictedMedicines.length === 1) {
                            // Show custom confirmation dialog
                            setConfirmationModalData({
                              title: 'Remove Last Medicine',
                              message: 'Medicines are empty, are you sure you want to start again?',
                              onConfirm: () => {
                                // User confirmed, remove the medicine
                                setPredictedMedicines([]);
                                setIsDetectedDisplayVisible(false);
                                setProceedButtonNotVisible(false);
                                setProgress(0); // Initial progress
                                
                                // Show reset button if original list is different
                                if (originalMedicines.length > 0) {
                                  setResetButtonNotVisible(true);
                                }
                                
                                setShowConfirmationModal(false);
                              },
                              onCancel: () => {
                                // User canceled, hide the modal
                                setShowConfirmationModal(false);
                              }
                            });
                            setShowConfirmationModal(true);
                          } else {
                            // Not the last medicine, proceed with normal removal
                            const updatedMedicines = [...predictedMedicines];
                            updatedMedicines.splice(index, 1);
                            setPredictedMedicines(updatedMedicines);
                            
                            // Show reset button whenever any medicine is removed
                            if (originalMedicines.length !== updatedMedicines.length) {
                              setResetButtonNotVisible(true);
                            }
                            
                            // If all medicines are removed, hide the container
                            if (updatedMedicines.length === 0) {
                              setIsDetectedDisplayVisible(false);
                              setProceedButtonNotVisible(false);
                              setProgress(0);
                            }
                          }
                        }}
                      >
                        <span>x</span>
                      </button>
                    </div>
                  ))}
                </div>
                {isResetButtonNotVisible && (
                <div className="buttons-content-display">
                  <button
                    className="reset-button"
                    onClick={() => {
                      // Restore all original medicines from before any removals
                      setPredictedMedicines([...originalMedicines]); // Restore using the stored original list
                      
                      // Show the medicine container if it was hidden
                      setIsDetectedDisplayVisible(true);
                      
                      // Hide the reset button since we've restored all medicines
                      setResetButtonNotVisible(false);
                      
                      // Make sure the proceed button is visible
                      setProceedButtonNotVisible(true);
                      
                      // Restore progress to 100% to indicate complete scanning
                      setProgress(100);
                      
                      // Set scan button to proceed state
                      setScanButtonState('proceed');
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
            <div className="status-image-display">
              {statusMessage && (
                <p className="status-text">{statusMessage}</p>
              )}
              </div>
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
                        setPredictedMedicines([]); 
                        setProceedButtonNotVisible(false);
                        setProgress(0); // Initial progress
                        
                      }}
                    />
                    <span className="slider">
                      <span className="toggle-text"
                        onClick={() => setPredictedMedicines([])} // Hides the display
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
  
            {/* <div
              className="scan-image-container"
              onClick={handleScanImageClick}
              style={{
                cursor: previewImage ? "pointer" : "not-allowed",
              }}
              disabled={!previewImage}
            >
              <span className="scan-image-text">Scan Image</span>
            </div> */}
          </div>
        </div>
      </div>
      <div className="upload-status">{uploadStatus}</div>

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        title={confirmationModalData.title}
        message={confirmationModalData.message}
        onConfirm={confirmationModalData.onConfirm}
        onCancel={confirmationModalData.onCancel}
      />
    </div>
  );
};
  
// Custom Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal">
        <div className="confirmation-modal-header">
          <div className="confirmation-modal-icon">⚠️</div>
          <h2 className="confirmation-modal-title">{title}</h2>
        </div>
        <div className="confirmation-modal-message">{message}</div>
        <div className="confirmation-modal-actions">
          <button className="confirmation-cancel-button" onClick={onCancel || onClose}>Cancel</button>
          <button className="confirmation-confirm-button" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default UploadFile;
