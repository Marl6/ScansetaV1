import React, { useState, useEffect, useCallback } from 'react';
import logo from '../assets/images/scanseta_logo_white.png'; // Adjust the path as needed
import homeIcon from '../assets/icons/scan_success/home.png'; // Import the home icon
import searchIcon from '../assets/icons/dashboard3/search.png'; // Import the search icon
import '../css/search_med.css';
import { getMedicineInfo } from '../database'; // Import the database function
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
  
  // Fuse.js for fallback local search if API is unavailable
  const fuse = new Fuse(fallbackMedicines, {
    includeScore: true,
    threshold: 0.4, // Adjust the threshold for fuzziness (lower is more lenient)
  });

  // Debounced function to search medicines from RxNorm API
  const fetchMedicines = useCallback(
    debounce(async (term) => {
      if (term.length < 2) {
        setSuggestions([]);
        setSuggestionsVisible(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5001/medicines/search/${encodeURIComponent(term)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch medicines');
        }
        
        const data = await response.json();
        console.log('Medicines from API:', data);
        
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
      } finally {
        setIsLoading(false);
      }
    }, 300), // 300ms debounce delay
    [fuse]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value) {
      // Show loading state
      setIsLoading(true);
      // Trigger debounced API search
      fetchMedicines(value);
    } else {
      setSuggestions([]);
      setSuggestionsVisible(false);
    }
  };

  const handleSearchSubmit = async () => {
    if (searchTerm) {
      // Get the selected medicine - either from suggestions or the search term itself
      let selectedMedicine = searchTerm;
      
      // If we have suggestions visible, use the first suggestion as the most likely match
      if (suggestions.length > 0 && suggestionsVisible) {
        selectedMedicine = suggestions[0];
      } else if (useLocalFuzzy) {
        // If using local fuzzy search, get the closest match
        const results = fuse.search(searchTerm);
        selectedMedicine = results.length > 0 ? results[0].item : searchTerm;
      }

      if (selectedMedicine) {
        try {
          setError('Generating AI information... Please wait, this may take up to 30 seconds.');
          
          // Use the AI endpoint to get medicine information
          console.log(`Fetching data for medicine: ${selectedMedicine}`);
          const response = await fetch(`http://localhost:5001/search-medicine-ai/${encodeURIComponent(selectedMedicine)}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          });
          
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
            setSource && setSource('search'); // Set source if the function exists
            goToMedInfo && goToMedInfo(); // Navigate if the function exists
          } else {
            setError('No AI information generated for this medicine.');
          }
        } catch (err) {
          console.error('Error generating AI information:', err);
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
    setSuggestionsVisible(false);
  };

  const handleClickOutside = (e) => {
    if (suggestionsVisible && !e.target.closest('.search-wrapper')) {
      setSuggestionsVisible(false);
    }
  };

  useEffect(() => {
    window.addEventListener('click', handleClickOutside);
  }, [suggestionsVisible]);

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
            placeholder="Search for any medicine name using RxNorm database..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button className="search-button" onClick={handleSearchSubmit} disabled={isLoading}>
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <img src={searchIcon} alt="Search" className="search-icon" />
            )}
          </button>
        </div>
      </div>

      <div className="search-info">
        {useLocalFuzzy && suggestions.length > 0 && (
          <p className="api-notice">Using local database. Connected to RxNorm for more comprehensive results.</p>
        )}
      </div>

      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>

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