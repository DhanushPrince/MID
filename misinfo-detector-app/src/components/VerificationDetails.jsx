import { Check, X, AlertTriangle, Copy, Download, Clock } from 'lucide-react';
import { useState } from 'react';

/**
 * VerificationDetails Component
 * Displays detailed verdict information and summary
 */
const VerificationDetails = ({ 
  claim, 
  verdict, 
  confidence, 
  summary, 
  keyFindings, 
  timestamp, 
  evaluation,
  onExport
}) => {
  const [copied, setCopied] = useState(false);
  
  // Format timestamp to readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid time';
    }
  };
  
  // Get verdict color based on verdict value
  const getVerdictColor = (verdict) => {
    const v = verdict?.toLowerCase();
    if (v === 'true') return 'bg-green-50 border-green-200 text-green-800';
    if (v === 'false') return 'bg-red-50 border-red-200 text-red-800';
    if (v === 'partially_true' || v === 'partially true') return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    if (v === 'misleading') return 'bg-orange-50 border-orange-200 text-orange-800';
    if (v === 'unverified') return 'bg-gray-50 border-gray-200 text-gray-800';
    if (v === 'unsupported') return 'bg-purple-50 border-purple-200 text-purple-800';
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };
  
  // Get verdict icon based on verdict value
  const getVerdictIcon = (verdict) => {
    const v = verdict?.toLowerCase();
    if (v === 'true') return <Check className="w-6 h-6 text-green-600" />;
    if (v === 'false') return <X className="w-6 h-6 text-red-600" />;
    if (v === 'partially_true' || v === 'partially true' || v === 'misleading') {
      return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
    }
    return <AlertTriangle className="w-6 h-6 text-gray-600" />;
  };
  
  // Get verdict label based on verdict value
  const getVerdictLabel = (verdict) => {
    if (!verdict) return 'Unknown';
    
    // Enhanced debugging for verdict transformation
    console.log('VerificationDetails - incoming verdict:', verdict);
    console.log('VerificationDetails - incoming verdict type:', typeof verdict);
    
    // Convert to lowercase for consistent comparison
    const v = verdict.toLowerCase();
    console.log('VerificationDetails - normalized verdict:', v);
    
    // Map all possible verdict values
    const verdictMap = {
      'true': 'Likely True',
      'false': 'Likely False',
      'partially_true': 'Partially True',
      'partially true': 'Partially True',
      'misleading': 'Misleading',
      'unverified': 'Unverified',
      'unsupported': 'Unsupported',
      'unknown': 'Unknown'
    };
    
    // Check if the verdict is in our map
    console.log('VerificationDetails - is verdict in map?', verdictMap.hasOwnProperty(v));
    
    // Return mapped value or original with first letter capitalized
    const result = verdictMap[v] || (verdict.charAt(0).toUpperCase() + verdict.slice(1).toLowerCase());
    console.log('VerificationDetails - display verdict as:', result);
    return result;
  };
  
  // Copy result to clipboard
  const copyToClipboard = () => {
    const text = `Claim: ${claim}
Verdict: ${verdict}
Confidence: ${(confidence * 100).toFixed(1)}%
Summary: ${summary}
Key Findings: ${keyFindings?.join(', ') || 'None'}
Verified at: ${formatTimestamp(timestamp)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Handle export button click
  const handleExport = () => {
    if (typeof onExport === 'function') {
      onExport();
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className={`border-2 rounded-lg p-6 mb-6 ${getVerdictColor(verdict)}`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {getVerdictIcon(verdict)}
            <div>
              <h2 className="text-2xl font-bold">{getVerdictLabel(verdict)}</h2>
              <p className="text-sm mt-1">
                Verified at {formatTimestamp(timestamp)}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold">
              {confidence ? `${(confidence * 100).toFixed(0)}%` : 'N/A'}
            </div>
            <p className="text-xs">Confidence</p>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-70 rounded p-4 mb-4">
          <h3 className="font-semibold mb-2">Claim</h3>
          <p className="text-lg font-medium">{claim}</p>
        </div>
        
        <div className="bg-white bg-opacity-70 rounded p-4">
          <h3 className="font-semibold mb-2">Summary</h3>
          <p className="leading-relaxed">{summary}</p>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded transition-all text-sm font-medium"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy Result'}
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded transition-all text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>
      
      {keyFindings && keyFindings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Key Findings</h3>
          <ul className="space-y-2">
            {keyFindings.map((finding, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="mt-1 flex-shrink-0">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                </div>
                <p>{finding}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {evaluation?.sub_claim_verdicts && evaluation.sub_claim_verdicts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Sub-claim Verdicts</h3>
          <div className="space-y-3">
            {evaluation.sub_claim_verdicts.map((subClaim, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{subClaim.claim_id}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    subClaim.verdict === 'TRUE' ? 'bg-green-100 text-green-800' :
                    subClaim.verdict === 'FALSE' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {subClaim.verdict}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-3">{subClaim.statement}</p>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-gray-600">Confidence:</span> {
                      subClaim.confidence ? `${(subClaim.confidence * 100).toFixed(0)}%` : 'N/A'
                    }
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Supporting:</span> {subClaim.supporting_count || 0}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Refuting:</span> {subClaim.refuting_count || 0}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Status:</span> {subClaim.dependency_status || 'Unknown'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {evaluation?.dependency_analysis && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Dependency Analysis</h3>
          
          <div className="space-y-2">
            <div>
              <span className="font-medium">Foundational Claims Verified:</span> {
                evaluation.dependency_analysis.foundational_claims_verified === true ? 'Yes' :
                evaluation.dependency_analysis.foundational_claims_verified === false ? 'No' :
                'Unknown'
              }
            </div>
            
            {evaluation.dependency_analysis.broken_dependencies && 
             evaluation.dependency_analysis.broken_dependencies.length > 0 && (
              <div>
                <span className="font-medium">Broken Dependencies:</span> {
                  evaluation.dependency_analysis.broken_dependencies.join(', ')
                }
              </div>
            )}
            
            {evaluation.dependency_analysis.notes && (
              <div>
                <span className="font-medium">Notes:</span> {
                  evaluation.dependency_analysis.notes
                }
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>Verification completed at {formatTimestamp(timestamp)}</span>
        </div>
      </div>
    </div>
  );
};

export default VerificationDetails;
