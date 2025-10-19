import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, X, AlertTriangle, Search, Brain, FileText, BarChart } from 'lucide-react';

/**
 * AgentWorkflow Component
 * Displays the multi-agent workflow steps in the verification process
 */
const AgentWorkflow = ({ workflowSteps, classification, decomposition, questions, searchResults, evaluation }) => {
  const [expandedStep, setExpandedStep] = useState(null);

  // Toggle expanded step
  const toggleStep = (step) => {
    if (expandedStep === step) {
      setExpandedStep(null);
    } else {
      setExpandedStep(step);
    }
  };

  // Format timestamp to readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Get step icon based on agent type
  const getStepIcon = (agent) => {
    switch (agent) {
      case 'classifier_agent':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'decomposer_agent':
        return <Brain className="w-5 h-5 text-purple-600" />;
      case 'question_agent':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'perplexity_api':
        return <Search className="w-5 h-5 text-green-600" />;
      case 'evaluator_agent':
        return <BarChart className="w-5 h-5 text-red-600" />;
      default:
        return <Brain className="w-5 h-5 text-gray-600" />;
    }
  };

  // Get step title based on step name
  const getStepTitle = (step) => {
    switch (step) {
      case 'classification':
        return 'Claim Classification';
      case 'decomposition':
        return 'Claim Decomposition';
      case 'question_generation':
        return 'Question Generation';
      case 'search_execution':
        return 'Web Search Execution';
      case 'evaluation':
        return 'Evidence Evaluation';
      default:
        return step.charAt(0).toUpperCase() + step.slice(1).replace(/_/g, ' ');
    }
  };

  // Get step status indicator
  const getStepStatus = (step) => {
    if (step.error) {
      return <X className="w-5 h-5 text-red-500" />;
    }
    return <Check className="w-5 h-5 text-green-500" />;
  };

  // Render JSON data in a readable format
  const renderJsonData = (data) => {
    if (!data) return <p className="text-gray-500 italic">No data available</p>;
    
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        return <p className="text-sm font-mono whitespace-pre-wrap break-words">{data}</p>;
      }
    }
    
    return (
      <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-auto max-h-96 font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  // Render classification step details
  const renderClassificationDetails = () => {
    if (!classification) return <p className="text-gray-500 italic">No classification data available</p>;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-semibold text-blue-800 mb-1">Domain</h4>
            <p className="text-blue-900">{classification.domain || 'Unknown'}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-md">
            <h4 className="font-semibold text-purple-800 mb-1">Claim Type</h4>
            <p className="text-purple-900">{classification.claim_type || 'Unknown'}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-md">
            <h4 className="font-semibold text-amber-800 mb-1">Complexity</h4>
            <p className="text-amber-900">{classification.complexity || 'Unknown'}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-md">
            <h4 className="font-semibold text-green-800 mb-1">Urgency</h4>
            <p className="text-green-900">{classification.urgency || 'Unknown'}</p>
          </div>
        </div>
        
        {classification.rationale && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-semibold text-gray-800 mb-1">Rationale</h4>
            <p className="text-gray-700">{classification.rationale}</p>
          </div>
        )}
      </div>
    );
  };

  // Render decomposition step details
  const renderDecompositionDetails = () => {
    if (!decomposition || !decomposition.atomic_claims) {
      return <p className="text-gray-500 italic">No decomposition data available</p>;
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Original Claim</h4>
          <p className="bg-gray-50 p-3 rounded-md text-gray-700">{decomposition.original_claim}</p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Atomic Claims ({decomposition.atomic_claims.length})</h4>
          <div className="space-y-3">
            {decomposition.atomic_claims.map((claim, index) => (
              <div key={claim.id || index} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-gray-900">{claim.id}</h5>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    claim.priority === 'high' ? 'bg-red-100 text-red-800' :
                    claim.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {claim.priority || 'unknown'} priority
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{claim.statement}</p>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-gray-600">Type:</span> {claim.type || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Dependencies:</span> {
                      claim.dependencies && claim.dependencies.length > 0 
                        ? claim.dependencies.join(', ') 
                        : 'None (foundational)'
                    }
                  </div>
                  {claim.entities && claim.entities.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-600">Entities:</span> {claim.entities.join(', ')}
                    </div>
                  )}
                  {claim.temporal && (
                    <div>
                      <span className="font-semibold text-gray-600">Temporal:</span> {claim.temporal}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {decomposition.dependency_graph && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Dependency Graph</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-700">Foundational Claims:</h5>
                <p className="text-gray-600">
                  {decomposition.dependency_graph.foundational && decomposition.dependency_graph.foundational.length > 0 
                    ? decomposition.dependency_graph.foundational.join(', ') 
                    : 'None'}
                </p>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700">Derived Claims:</h5>
                <p className="text-gray-600">
                  {decomposition.dependency_graph.derived && decomposition.dependency_graph.derived.length > 0 
                    ? decomposition.dependency_graph.derived.join(', ') 
                    : 'None'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render question generation step details
  const renderQuestionsDetails = () => {
    if (!questions || !questions.queries) {
      return <p className="text-gray-500 italic">No questions data available</p>;
    }
    
    return (
      <div className="space-y-4">
        {questions.current_date_used && (
          <div className="bg-blue-50 p-3 rounded-md text-blue-800">
            <span className="font-semibold">Current Date Used:</span> {questions.current_date_used}
          </div>
        )}
        
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Generated Search Queries ({questions.queries.length})</h4>
          <div className="space-y-2">
            {questions.queries.map((query, index) => (
              <div key={query.id || index} className="border border-gray-200 rounded-md p-3">
                <div className="flex justify-between items-center mb-1">
                  <h5 className="font-medium text-gray-900">{query.id}</h5>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    query.priority === 'high' ? 'bg-red-100 text-red-800' :
                    query.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {query.priority || 'unknown'} priority
                  </span>
                </div>
                <p className="text-gray-700 font-medium">{query.query}</p>
                
                <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-2">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    Claim: {query.claim_id || 'Unknown'}
                  </span>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    Type: {query.query_type || 'Unknown'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {questions.strategy_rationale && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-semibold text-gray-800 mb-1">Strategy Rationale</h4>
            <p className="text-gray-700">{questions.strategy_rationale}</p>
          </div>
        )}
      </div>
    );
  };

  // Render search execution step details
  const renderSearchDetails = () => {
    if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
      return <p className="text-gray-500 italic">No search results available</p>;
    }
    
    // Count successful searches
    const successfulSearches = searchResults.filter(sr => sr.success).length;
    
    // Count total results
    const totalResults = searchResults.reduce((total, sr) => {
      return total + (sr.results ? sr.results.length : 0);
    }, 0);
    
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="bg-blue-50 p-3 rounded-md">
            <span className="text-blue-800 font-semibold">Total Searches:</span> {searchResults.length}
          </div>
          <div className="bg-green-50 p-3 rounded-md">
            <span className="text-green-800 font-semibold">Successful:</span> {successfulSearches}
          </div>
          <div className="bg-amber-50 p-3 rounded-md">
            <span className="text-amber-800 font-semibold">Failed:</span> {searchResults.length - successfulSearches}
          </div>
          <div className="bg-purple-50 p-3 rounded-md">
            <span className="text-purple-800 font-semibold">Total Results:</span> {totalResults}
          </div>
        </div>
        
        <div className="space-y-3">
          {searchResults.map((search, index) => (
            <div key={search.query_id || index} className="border border-gray-200 rounded-md overflow-hidden">
              <div className={`p-3 ${search.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">{search.query_id || `Query ${index + 1}`}</h5>
                  {search.success ? (
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 text-xs rounded-full">Success</span>
                  ) : (
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 text-xs rounded-full">Failed</span>
                  )}
                </div>
                <p className="text-gray-700 mt-1 text-sm">{search.query}</p>
              </div>
              
              {search.success && search.results && search.results.length > 0 && (
                <div className="p-3 bg-white">
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Top Results ({search.results.length})</h6>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {search.results.slice(0, 3).map((result, resultIndex) => (
                      <div key={resultIndex} className="border-l-2 border-gray-300 pl-3 py-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{result.title || 'Untitled'}</p>
                        <a 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-blue-600 hover:underline truncate block"
                        >
                          {result.url}
                        </a>
                      </div>
                    ))}
                    
                    {search.results.length > 3 && (
                      <p className="text-xs text-gray-500 italic">
                        + {search.results.length - 3} more results
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {!search.success && search.error && (
                <div className="p-3 bg-white">
                  <p className="text-sm text-red-600">{search.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render evaluation step details
  const renderEvaluationDetails = () => {
    if (!evaluation) {
      return <p className="text-gray-500 italic">No evaluation data available</p>;
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-600">Verdict</h4>
              <p className={`font-bold text-lg ${
                evaluation.overall_verdict === 'TRUE' ? 'text-green-600' :
                evaluation.overall_verdict === 'FALSE' ? 'text-red-600' :
                'text-amber-600'
              }`}>
                {evaluation.overall_verdict || 'Unknown'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-600">Confidence</h4>
              <p className="font-bold text-lg">
                {evaluation.confidence_score 
                  ? `${(evaluation.confidence_score * 100).toFixed(0)}%` 
                  : 'Unknown'}
              </p>
            </div>
          </div>
          
          {evaluation.summary && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-1">Summary</h4>
              <p className="text-gray-800">{evaluation.summary}</p>
            </div>
          )}
          
          {evaluation.key_findings && evaluation.key_findings.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-1">Key Findings</h4>
              <ul className="list-disc pl-5 space-y-1">
                {evaluation.key_findings.map((finding, index) => (
                  <li key={index} className="text-gray-800">{finding}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {evaluation.sub_claim_verdicts && evaluation.sub_claim_verdicts.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Sub-claim Verdicts</h4>
            <div className="space-y-3">
              {evaluation.sub_claim_verdicts.map((verdict, index) => (
                <div key={verdict.claim_id || index} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-gray-900">{verdict.claim_id}</h5>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      verdict.verdict === 'TRUE' ? 'bg-green-100 text-green-800' :
                      verdict.verdict === 'FALSE' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {verdict.verdict}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{verdict.statement}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-gray-600">Confidence:</span> {
                        verdict.confidence ? `${(verdict.confidence * 100).toFixed(0)}%` : 'Unknown'
                      }
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Supporting:</span> {verdict.supporting_count || 0}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Refuting:</span> {verdict.refuting_count || 0}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Status:</span> {verdict.dependency_status || 'Unknown'}
                    </div>
                  </div>
                  
                  {verdict.rationale && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-700">{verdict.rationale}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {evaluation.dependency_analysis && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-semibold text-gray-800 mb-2">Dependency Analysis</h4>
            
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Foundational Claims Verified:</span> {
                  evaluation.dependency_analysis.foundational_claims_verified === true ? 'Yes' :
                  evaluation.dependency_analysis.foundational_claims_verified === false ? 'No' :
                  'Unknown'
                }
              </div>
              
              {evaluation.dependency_analysis.broken_dependencies && 
               evaluation.dependency_analysis.broken_dependencies.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Broken Dependencies:</span> {
                    evaluation.dependency_analysis.broken_dependencies.join(', ')
                  }
                </div>
              )}
              
              {evaluation.dependency_analysis.notes && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Notes:</span> {
                    evaluation.dependency_analysis.notes
                  }
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render step content based on step name
  const renderStepContent = (step) => {
    switch (step.step) {
      case 'classification':
        return renderClassificationDetails();
      case 'decomposition':
        return renderDecompositionDetails();
      case 'question_generation':
        return renderQuestionsDetails();
      case 'search_execution':
        return renderSearchDetails();
      case 'evaluation':
        return renderEvaluationDetails();
      default:
        return renderJsonData(step.full_output);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Verification Workflow</h2>
      
      {workflowSteps && workflowSteps.length > 0 ? (
        <div className="space-y-3">
          {workflowSteps.map((step, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleStep(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getStepIcon(step.agent)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{getStepTitle(step.step)}</h3>
                    <p className="text-xs text-gray-500">{formatTimestamp(step.timestamp)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getStepStatus(step)}
                  </div>
                  {expandedStep === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {expandedStep === index && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  {renderStepContent(step)}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">No workflow steps available</p>
        </div>
      )}
    </div>
  );
};

export default AgentWorkflow;
