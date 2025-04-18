import React, { useState, useEffect, useCallback } from 'react';
import logo from '../assets/images/scanseta_logo_white.png'; // Adjust the path as needed
import homeIcon from '../assets/icons/scan_success/home.png'; // Import the home icon
import searchIcon from '../assets/icons/dashboard3/search.png'; // Import the search icon
import '../css/search_med.css';
// Database function import removed to fix ESLint warning
import Fuse from 'fuse.js'; // Import fuse.js for fuzzy matching

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Backup medicines list in case API is unavailable
const fallbackMedicines = [
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

const Search_med = ({ goBack, handleMedicineSearch, setMedicineData, setSource, goToMedInfo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useLocalFuzzy, setUseLocalFuzzy] = useState(false);
  const [isValidSelection, setIsValidSelection] = useState(false); // Track if the current input is a valid selection
  
  // Fuse.js for fallback local search if API is unavailable
  const fuse = new Fuse(fallbackMedicines, {
    includeScore: true,
    threshold: 0.4, // Adjust the threshold for fuzziness (lower is more lenient)
  });

  // Debounced function to search medicines from RxNorm API
  const fetchMedicines = useCallback(async (term) => {
    // Using inline function as recommended by ESLint
    const debouncedFetch = debounce(async () => {
      if (term.length < 2) {
        setSuggestions([]);
        setSuggestionsVisible(false);
        return;
      }
      
      setIsLoading(true);
      
      // Set a 2-second timeout to automatically clear the loading state
      const loadingTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      
      try {
        const response = await fetch(`http://localhost:5001/medicines/search/${encodeURIComponent(term)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch medicines');
        }
        
        const data = await response.json();
        console.log('Medicines from API:', data);
        
        // Clear the timeout as we got a valid response
        clearTimeout(loadingTimeout);
        
        if (data.medications && data.medications.length > 0) {
          setSuggestions(data.medications);
          setSuggestionsVisible(true);
          setUseLocalFuzzy(false);
        } else {
          // Fall back to local fuzzy search if no API results
          const localResults = fuse.search(term).map(result => result.item);
          setSuggestions(localResults);
          setSuggestionsVisible(localResults.length > 0);
          setUseLocalFuzzy(true);
        }
      } catch (err) {
        console.error('Error fetching medicine suggestions:', err);
        // Fall back to local fuzzy search
        const localResults = fuse.search(term).map(result => result.item);
        setSuggestions(localResults);
        setSuggestionsVisible(localResults.length > 0);
        setUseLocalFuzzy(true);
        
        // Clear the timeout as we're handling the error case
        clearTimeout(loadingTimeout);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce delay
    
    debouncedFetch();
  }, [fuse]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // When user types manually, it's not a valid selection until they choose from dropdown
    setIsValidSelection(false);
    
    if (value) {
      // Clear error and wait for suggestions to appear
      setError('');
      // Show loading state
      setIsLoading(true);
      // Trigger debounced API search
      fetchMedicines(value);
    } else {
      setError('');
      setSuggestions([]);
      setSuggestionsVisible(false);
    }
  };

  const handleSearchSubmit = async () => {
    // Check if the search term is a valid selection from suggestions
    if (!isValidSelection) {
      setError('Please select a medicine from the suggestions dropdown');
      return;
    }
    
    // Hide suggestions dropdown immediately when search button is clicked
    setSuggestionsVisible(false);
    
    if (searchTerm) {
      // Get the selected medicine - either from suggestions or the search term itself
      let selectedMedicine = searchTerm;
      
      // If we have suggestions, use the first suggestion as the most likely match
      if (suggestions.length > 0) {
        selectedMedicine = suggestions[0];
      } else if (useLocalFuzzy) {
        // If using local fuzzy search, get the closest match
        const results = fuse.search(searchTerm);
        selectedMedicine = results.length > 0 ? results[0].item : searchTerm;
      }

      if (selectedMedicine) {
        try {
          // Show loading state while AI generates data
          setIsLoading(true);
          setError('Generating AI information... Please wait, this may take up to 30 seconds.');
          
          // Set a 2-second timeout to ensure loading state doesn't persist indefinitely
          const loadingTimeout = setTimeout(() => {
            if (isLoading) {
              console.log('Timeout reached: Setting loading state to false');
              setIsLoading(false);
            }
          }, 2000);
          
          // Use the AI endpoint to get medicine information
          console.log(`Fetching data for medicine: ${selectedMedicine}`);
          const response = await fetch(`http://localhost:5001/search-medicine-ai/${encodeURIComponent(selectedMedicine)}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          });
          
          // Clear the timeout as we got a response
          clearTimeout(loadingTimeout);
          
          console.log('Response status:', response.status);
          
          if (!response.ok) {
            let errorMessage = 'Failed to generate AI information';
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              console.error('Error parsing error response:', e);
            }
            throw new Error(errorMessage);
          }
          
          const aiData = await response.json();
          console.log('AI generated data:', aiData);
          
          if (aiData) {
            // Set the AI-generated medicine data and navigate to MedInfo
            setMedicineData({
              medicine_info: aiData.medicine_info,
              medicine_usage: aiData.medicine_usage,
              medicine_complication: aiData.medicine_complication
            });
            setError('');
            setIsLoading(false); // Stop loading
            setSource && setSource('search'); // Set source if the function exists
            goToMedInfo && goToMedInfo(); // Navigate if the function exists
          } else {
            setIsLoading(false); // Stop loading
            setError('No AI information generated for this medicine.');
          }
        } catch (err) {
          console.error('Error generating AI information:', err);
          setIsLoading(false); // Stop loading in case of error
          setError(`Error: ${err.message || 'Failed to generate information.'}`);
          setTimeout(() => {
            setError('');
          }, 8000);
        }
      } else {
        setError('No matching medicine found.');
        setSuggestionsVisible(false);
        setTimeout(() => {
          setError('');
        }, 5000);
      }
    } else {
      setError('Please enter a valid medicine name.');
      setSuggestionsVisible(false);
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setSuggestions([suggestion]); // Keep only the selected in suggestions
    setSuggestionsVisible(false);
    setIsValidSelection(true); // Mark as valid selection
    setIsLoading(false); // Ensure loading is false after selection
  };



  const handleClickOutside = useCallback((e) => {
    if (suggestionsVisible && !e.target.closest('.search-wrapper')) {
      setSuggestionsVisible(false);
    }
  }, [suggestionsVisible]);

  useEffect(() => {
    window.addEventListener('click', handleClickOutside);
    
    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [suggestionsVisible, handleClickOutside]);

  return (
    <div className="dashboard">

      <div className="header">
        
        <img src={logo} alt="Scanseta Logo" className="logo" />
        
        <button className="home-button" onClick={goBack}>
          <img src={homeIcon} alt="Home" className="home-icon" />
        </button>
      
      </div>
      

      <div className="search-components-container">
      <div className="search-container">
        <div className="search-wrapper" tabIndex={0} onFocus={() => setSuggestionsVisible(true)}>
          <input
            type="text"
            className="search-bar"
            value={searchTerm}
            placeholder="Search for any medicine name using RxNorm database..."
            onChange={handleSearchChange}
          />
          <button 
            className={`search-button ${isLoading ? 'loading' : ''}`} 
            onClick={handleSearchSubmit} 
            disabled={!isValidSelection || !searchTerm}
            title={!isValidSelection && searchTerm ? 'Please select a medicine from the suggestions' : isLoading ? 'Loading...' : 'Search'}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <img src={searchIcon} alt="Search" className="search-icon" />
            )}
          </button>
        </div>
      </div>



      {/* <div className="error-container">
        <p className="error-message">{error}</p>
      </div> */}

      {/* <div className="search-info">
        {searchTerm && suggestions.length > 0 && !isValidSelection && (
          <p className="selection-hint">Please select a medicine from the list to continue</p>
        )}
      </div> */}

      <div className="suggestions-container">
        {isLoading && searchTerm.length > 0 && !error && (
          <p className="loading-text">Searching medicines database...</p>
        )}
        {suggestionsVisible && (
          <ul className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      </div>

      <div className="footer"></div>
      
    </div>
  );
};

export default Search_med;