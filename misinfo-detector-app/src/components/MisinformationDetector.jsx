import { useState, useEffect } from 'react';
import { Search, X, ExternalLink, Loader, FileText, History } from 'lucide-react';
import { verifyClaim, checkHealth, listResults, getResult, transformApiResponse } from '../api/misinfoApi';

// Import new components
import AgentWorkflow from './AgentWorkflow';
import SearchResults from './SearchResults';
import ClaimAnalysis from './ClaimAnalysis';
import VerificationDetails from './VerificationDetails';

export default function MisinformationDetectorUI() {
  const [claim, setClaim] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState({ online: false, checking: true });
  const [activeTab, setActiveTab] = useState('verdict');
  const [historicalResults, setHistoricalResults] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);

  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const status = await checkHealth();
        setApiStatus({
          online: true,
          checking: false,
          details: status
        });
      } catch (error) {
        console.error('API health check failed:', error);
        setApiStatus({
          online: false,
          checking: false,
          error: error.message
        });
      }
    };

    checkApiStatus();
  }, []);

  // Load historical results
  useEffect(() => {
    const loadHistoricalResults = async () => {
      if (!apiStatus.online || !showHistory) return;
      
      try {
        const response = await listResults();
        if (response && response.results) {
          setHistoricalResults(response.results);
        }
      } catch (error) {
        console.error('Failed to load historical results:', error);
      }
    };

    loadHistoricalResults();
  }, [apiStatus.online, showHistory]);

  // Handle claim verification
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!claim.trim() || claim.length < 5) return;
    
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const data = await verifyClaim(claim.trim());
      console.log('Raw API response:', data);
      console.log('API response has execution_log?', !!data.execution_log);
      console.log('execution_log length:', data.execution_log?.length || 0);
      
      const transformedResult = transformApiResponse(data);
      console.log('Transformed result:', transformedResult);
      console.log('Transformed workflowSteps length:', transformedResult.workflowSteps?.length || 0);
      
      // Enhanced debugging for classification data
      console.log('Classification data structure:', transformedResult.classification);
      console.log('Classification domain:', transformedResult.classification?.domain);
      
      setResult(transformedResult);
      setActiveTab('verdict');
    } catch (error) {
      console.error('Error verifying claim:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load a historical result
  const loadHistoricalResult = async (filename) => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const data = await getResult(filename);
      const transformedResult = transformApiResponse(data);
      
      // Enhanced debugging for historical results
      console.log('Historical result transformed:', transformedResult);
      console.log('Historical classification data:', transformedResult.classification);
      console.log('Historical verdict:', transformedResult.verdict);
      
      setResult(transformedResult);
      setClaim(transformedResult.claim);
      setActiveTab('verdict');
      setShowHistory(false);
    } catch (error) {
      console.error('Error loading historical result:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Export result as JSON
  const exportResult = () => {
    if (!result) return;
    
    const dataStr = JSON.stringify(result.raw, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `verification_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Search className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Truth Finder</h1>
                <p className="text-sm text-slate-600">Multi-Agent Misinformation Detection System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                apiStatus.checking ? 'bg-gray-100 text-gray-800' :
                apiStatus.online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {apiStatus.checking ? 'Checking API...' :
                 apiStatus.online ? 'API Online' : 'API Offline'}
              </span>
              
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="ml-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                title="View History"
              >
                <History className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <label className="block text-sm font-semibold text-slate-900 mb-3">
            Enter a claim to verify
          </label>
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              placeholder="e.g., The Earth is flat"
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || claim.length < 5 || !apiStatus.online}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 sm:w-auto w-full"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Verify Claim
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-2">
            {!apiStatus.online ? 'API is offline. Please check your backend server.' : 
             'Minimum 5 characters required'}
          </p>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Verification History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            
            {historicalResults.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {historicalResults.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => loadHistoricalResult(item.filename)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.filename}</p>
                      <p className="text-xs text-gray-500">{formatTimestamp(item.created)}</p>
                    </div>
                    <div className="text-blue-600">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No verification history found.</p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <X className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Verification Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px space-x-8">
                <button
                  onClick={() => setActiveTab('verdict')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'verdict'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Verdict
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'search'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Search Results
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analysis'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Claim Analysis
                </button>
                <button
                  onClick={() => setActiveTab('workflow')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'workflow'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Verification Workflow
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'verdict' && (
              <VerificationDetails
                claim={result.claim}
                verdict={result.verdict}
                confidence={result.confidence}
                summary={result.summary}
                keyFindings={result.keyFindings}
                timestamp={result.timestamp}
                evaluation={result.evaluation}
                onExport={exportResult}
              />
            )}
            
            {activeTab === 'search' && (
              <SearchResults results={result.searchResults} />
            )}
            
            {activeTab === 'analysis' && (
              <ClaimAnalysis
                claim={result.claim}
                classification={result.classification}
                decomposition={result.decomposition}
              />
            )}
            
            {activeTab === 'workflow' && (
              <AgentWorkflow
                workflowSteps={result.workflowSteps}
                classification={result.classification}
                decomposition={result.decomposition}
                questions={result.questions}
                searchResults={result.raw?.search_results}
                evaluation={result.evaluation}
              />
            )}
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && !error && (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-slate-700 mb-2">Enter a claim to verify</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Our multi-agent system will analyze the claim using web search results and provide a detailed verification.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-medium text-slate-700 mb-2">Verifying claim...</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Our multi-agent system is analyzing the claim. This may take up to 30 seconds.
            </p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-600 mb-4 md:mb-0">
              Powered by Amazon Bedrock Nova Pro & Perplexity API
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500">
                Multi-Agent Misinformation Detection System v2.2
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
