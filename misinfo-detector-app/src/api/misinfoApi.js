// Enhanced API client for Misinformation Detection backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT = 60000; // 60 seconds timeout for long-running operations

/**
 * Custom fetch with timeout and error handling
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 */
const fetchWithTimeout = async (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // Try to parse error response as JSON
      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API Error: ${response.status} ${response.statusText}`);
      } catch (jsonError) {
        // If JSON parsing fails, use status text
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout/1000} seconds`);
    }
    
    throw error;
  }
};

/**
 * Check API health status
 * @returns {Promise<Object>} Health status information
 */
export const checkHealth = async () => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`);
    return response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw new Error(`Health check failed: ${error.message}`);
  }
};

/**
 * Check API root status
 * @returns {Promise<Object>} Basic API status information
 */
export const checkRoot = async () => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/`);
    return response.json();
  } catch (error) {
    console.error('API root check failed:', error);
    throw new Error(`API root check failed: ${error.message}`);
  }
};

/**
 * Verify a claim
 * @param {string} claim - The claim text to verify
 * @returns {Promise<Object>} Verification results
 */
export const verifyClaim = async (claim) => {
  if (!claim || typeof claim !== 'string' || claim.trim().length < 5) {
    throw new Error('Invalid claim: must be a string with at least 5 characters');
  }
  
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ claim: claim.trim() }),
      },
      120000 // 2 minutes timeout for verification which can take longer
    );
    
    return response.json();
  } catch (error) {
    console.error('Claim verification failed:', error);
    throw new Error(`Verification failed: ${error.message}`);
  }
};

/**
 * List all verification results
 * @returns {Promise<Object>} List of all verification results
 */
export const listResults = async () => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/results`);
    return response.json();
  } catch (error) {
    console.error('Failed to fetch results:', error);
    throw new Error(`Failed to fetch results: ${error.message}`);
  }
};

/**
 * Get a specific verification result
 * @param {string} filename - The result filename
 * @returns {Promise<Object>} Specific verification result
 */
export const getResult = async (filename) => {
  if (!filename) {
    throw new Error('Filename is required');
  }
  
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/results/${encodeURIComponent(filename)}`);
    return response.json();
  } catch (error) {
    console.error(`Failed to fetch result ${filename}:`, error);
    throw new Error(`Failed to fetch result: ${error.message}`);
  }
};

/**
 * Transform API response to frontend-friendly format
 * @param {Object} data - Raw API response data
 * @returns {Object} Transformed data for frontend use
 */
export const transformApiResponse = (data) => {
  if (!data) return null;
  
  // Extract verdict information with robust case handling
  const rawVerdict = data.evaluation?.overall_verdict || 'UNKNOWN';
  
  // Log raw verdict for debugging
  console.log('Raw verdict from API:', rawVerdict);
  
  // Map API verdict values to frontend-friendly formats
  // Keep original case for proper display in VerificationDetails component
  let mappedVerdict;
  if (rawVerdict === 'TRUE') {
    mappedVerdict = 'true';
  } else if (rawVerdict === 'FALSE') {
    mappedVerdict = 'false';
  } else if (rawVerdict === 'PARTIALLY_TRUE') {
    mappedVerdict = 'partially_true';
  } else if (rawVerdict === 'MISLEADING') {
    mappedVerdict = 'misleading';
  } else if (rawVerdict === 'UNVERIFIED') {
    mappedVerdict = 'unverified';
  } else {
    // Normalize other verdicts to lowercase for consistency
    mappedVerdict = rawVerdict.toLowerCase();
  }
  
  console.log('Mapped verdict for frontend:', mappedVerdict);
  
  // Transform search results with complete data
  const searchResults = [];
  if (data.search_results && Array.isArray(data.search_results)) {
    console.log(`Processing ${data.search_results.length} search query results`);
    
    data.search_results.forEach((queryResult, queryIndex) => {
      if (queryResult.results && Array.isArray(queryResult.results)) {
        console.log(`Query ${queryIndex + 1} (${queryResult.query_id || 'unknown'}): Found ${queryResult.results.length} results`);
        
        queryResult.results.forEach(result => {
          searchResults.push({
            title: result.title || 'Untitled',
            url: result.url || '#',
            snippet: result.snippet || 'No snippet available',
            source: result.domain || extractDomain(result.url),
            query: queryResult.query || '',
            queryId: queryResult.query_id || '',
            position: result.position || 0,
            credibilityTier: getCredibilityTier(result.domain)
          });
        });
      } else {
        console.log(`Query ${queryIndex + 1} (${queryResult.query_id || 'unknown'}): No results found or invalid format`);
      }
    });
  } else {
    console.log('No search results found in API response or invalid format');
  }
  
  // Log search results count
  console.log(`Transformed ${searchResults.length} total search results`);
  
  // Extract workflow steps
  const workflowSteps = data.execution_log || [];
  console.log(`Extracted workflow steps: ${workflowSteps.length} steps found`);
  if (workflowSteps.length > 0) {
    console.log('Workflow steps:', workflowSteps.map(s => s.step).join(', '));
  } else {
    console.warn('⚠️ No workflow steps found in API response! Check if backend returns execution_log field.');
  }
  
  // Extract classification - check both top-level and nested locations
  const classification = data.classification || data.results?.classification || {};
  console.log('Extracted classification:', classification);
  
  // Extract decomposition - check both top-level and nested locations
  const decomposition = data.decomposition || data.results?.decomposition || {};
  console.log('Extracted decomposition:', decomposition);
  
  // Extract questions - check both top-level and nested locations
  const questions = data.questions || data.results?.questions || {};
  console.log('Extracted questions:', questions);
  
  // Extract evaluation - check both top-level and nested locations
  const evaluation = data.evaluation || data.results?.evaluation || {};
  console.log('Extracted evaluation:', evaluation);
  
  return {
    claim: data.original_claim,
    timestamp: data.timestamp,
    verdict: mappedVerdict, // Using properly mapped verdict for frontend
    confidence: data.evaluation?.confidence_score || 0,
    summary: data.evaluation?.summary || 'No summary available',
    keyFindings: data.evaluation?.key_findings || [],
    searchResults,
    workflowSteps,
    // Ensure classification data is properly passed
    classification,
    decomposition,
    questions,
    evaluation,
    raw: data // Keep raw data for debugging
  };
};

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} Domain name
 */
const extractDomain = (url) => {
  if (!url) return 'unknown';
  try {
    return new URL(url).hostname;
  } catch (error) {
    return 'unknown';
  }
};

/**
 * Get credibility tier based on domain
 * @param {string} domain - Domain name
 * @returns {Object} Credibility information
 */
const getCredibilityTier = (domain) => {
  if (!domain) return { tier: 4, label: 'Unknown' };
  
  // Tier 1: Government, scientific journals, official statistics
  const tier1Domains = ['.gov', '.edu', 'science.org', 'nature.com', 'nih.gov', 'nasa.gov', 'cdc.gov', 'who.int'];
  
  // Tier 2: Major news outlets, academic institutions
  const tier2Domains = ['nytimes.com', 'washingtonpost.com', 'bbc.com', 'reuters.com', 'ap.org', 'britannica.com'];
  
  // Tier 3: Verified experts, established organizations
  const tier3Domains = ['medium.com', 'wikipedia.org', 'nationalgeographic.com', 'smithsonianmag.com'];
  
  if (tier1Domains.some(d => domain.includes(d))) {
    return { tier: 1, label: 'High' };
  } else if (tier2Domains.some(d => domain.includes(d))) {
    return { tier: 2, label: 'Medium-High' };
  } else if (tier3Domains.some(d => domain.includes(d))) {
    return { tier: 3, label: 'Medium' };
  } else {
    return { tier: 4, label: 'Standard' };
  }
};
