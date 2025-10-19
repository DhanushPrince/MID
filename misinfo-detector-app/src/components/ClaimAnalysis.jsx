import { FileText, Layers, Network } from 'lucide-react';

/**
 * ClaimAnalysis Component
 * Visualizes claim decomposition and analysis
 */
const ClaimAnalysis = ({ claim, classification, decomposition }) => {
  // Render domain classification
  const renderDomainClassification = () => {
    // Enhanced debugging for classification data
    console.log('ClaimAnalysis - classification data:', classification);
    console.log('ClaimAnalysis - domain value:', classification?.domain);
    
    if (!classification || !classification.domain) {
      console.log('ClaimAnalysis - missing domain data!');
      return <p className="text-gray-500 italic">No classification data available</p>;
    }
    
    const getDomainColor = (domain) => {
      const domainMap = {
        'Politics': 'bg-red-100 text-red-800 border-red-200',
        'Health': 'bg-green-100 text-green-800 border-green-200',
        'Science': 'bg-blue-100 text-blue-800 border-blue-200',
        'Economics': 'bg-amber-100 text-amber-800 border-amber-200',
        'Social': 'bg-purple-100 text-purple-800 border-purple-200',
        'Other': 'bg-gray-100 text-gray-800 border-gray-200'
      };
      
      return domainMap[domain] || 'bg-gray-100 text-gray-800 border-gray-200';
    };
    
    const getClaimTypeColor = (type) => {
      const typeMap = {
        'Factual': 'bg-blue-100 text-blue-800 border-blue-200',
        'Opinion': 'bg-purple-100 text-purple-800 border-purple-200',
        'Prediction': 'bg-amber-100 text-amber-800 border-amber-200',
        'Satire': 'bg-pink-100 text-pink-800 border-pink-200',
        'Mixed': 'bg-gray-100 text-gray-800 border-gray-200'
      };
      
      return typeMap[type] || 'bg-gray-100 text-gray-800 border-gray-200';
    };
    
    const getComplexityColor = (complexity) => {
      const complexityMap = {
        'Simple': 'bg-green-100 text-green-800 border-green-200',
        'Compound': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Complex': 'bg-red-100 text-red-800 border-red-200'
      };
      
      return complexityMap[complexity] || 'bg-gray-100 text-gray-800 border-gray-200';
    };
    
    const getUrgencyColor = (urgency) => {
      const urgencyMap = {
        'High': 'bg-red-100 text-red-800 border-red-200',
        'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Low': 'bg-green-100 text-green-800 border-green-200'
      };
      
      return urgencyMap[urgency] || 'bg-gray-100 text-gray-800 border-gray-200';
    };
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`border rounded-lg p-4 ${getDomainColor(classification.domain)}`}>
            <h3 className="text-sm font-medium mb-1">Domain</h3>
            <p className="text-lg font-bold">{classification.domain}</p>
          </div>
          
          <div className={`border rounded-lg p-4 ${getClaimTypeColor(classification.claim_type)}`}>
            <h3 className="text-sm font-medium mb-1">Claim Type</h3>
            <p className="text-lg font-bold">{classification.claim_type}</p>
          </div>
          
          <div className={`border rounded-lg p-4 ${getComplexityColor(classification.complexity)}`}>
            <h3 className="text-sm font-medium mb-1">Complexity</h3>
            <p className="text-lg font-bold">{classification.complexity}</p>
          </div>
          
          <div className={`border rounded-lg p-4 ${getUrgencyColor(classification.urgency)}`}>
            <h3 className="text-sm font-medium mb-1">Urgency</h3>
            <p className="text-lg font-bold">{classification.urgency}</p>
          </div>
        </div>
        
        {classification.rationale && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Classification Rationale</h3>
            <p className="text-gray-800">{classification.rationale}</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render claim decomposition
  const renderClaimDecomposition = () => {
    if (!decomposition || !decomposition.atomic_claims || decomposition.atomic_claims.length === 0) {
      return <p className="text-gray-500 italic">No decomposition data available</p>;
    }
    
    const getPriorityColor = (priority) => {
      const priorityMap = {
        'high': 'bg-red-50 border-red-200',
        'medium': 'bg-yellow-50 border-yellow-200',
        'low': 'bg-green-50 border-green-200'
      };
      
      return priorityMap[priority] || 'bg-gray-50 border-gray-200';
    };
    
    const getTypeIcon = (type) => {
      switch (type) {
        case 'fact':
          return <FileText className="w-4 h-4 text-blue-600" />;
        case 'opinion':
          return <Layers className="w-4 h-4 text-purple-600" />;
        case 'interpretation':
          return <Network className="w-4 h-4 text-amber-600" />;
        default:
          return <FileText className="w-4 h-4 text-gray-600" />;
      }
    };
    
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Original Claim</h3>
          <p className="text-gray-900 font-medium">{decomposition.original_claim}</p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Atomic Claims ({decomposition.atomic_claims.length})</h3>
          <div className="space-y-4">
            {decomposition.atomic_claims.map((claim, index) => (
              <div 
                key={claim.id || index} 
                className={`border rounded-lg p-4 ${getPriorityColor(claim.priority)}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(claim.type)}
                    <h4 className="font-medium text-gray-900">{claim.id}</h4>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      claim.priority === 'high' ? 'bg-red-100 text-red-800' :
                      claim.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {claim.priority} priority
                    </span>
                    
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      claim.type === 'fact' ? 'bg-blue-100 text-blue-800' :
                      claim.type === 'opinion' ? 'bg-purple-100 text-purple-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {claim.type}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-800 mb-4">{claim.statement}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {claim.dependencies && claim.dependencies.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Dependencies:</span>{' '}
                      {claim.dependencies.join(', ')}
                    </div>
                  )}
                  
                  {claim.entities && claim.entities.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Entities:</span>{' '}
                      {claim.entities.join(', ')}
                    </div>
                  )}
                  
                  {claim.temporal && (
                    <div>
                      <span className="font-medium text-gray-700">Temporal Context:</span>{' '}
                      {claim.temporal}
                    </div>
                  )}
                  
                  {claim.quantitative && (
                    <div>
                      <span className="font-medium text-gray-700">Quantitative Data:</span>{' '}
                      {claim.quantitative}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {decomposition.dependency_graph && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Dependency Graph</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Foundational Claims</h4>
                {decomposition.dependency_graph.foundational && 
                 decomposition.dependency_graph.foundational.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {decomposition.dependency_graph.foundational.map((claimId, index) => (
                      <span 
                        key={index} 
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {claimId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No foundational claims identified</p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Derived Claims</h4>
                {decomposition.dependency_graph.derived && 
                 decomposition.dependency_graph.derived.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {decomposition.dependency_graph.derived.map((claimId, index) => (
                      <span 
                        key={index} 
                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                      >
                        {claimId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No derived claims identified</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Claim Analysis</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Classification</h3>
        {renderDomainClassification()}
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Decomposition</h3>
        {renderClaimDecomposition()}
      </div>
    </div>
  );
};

export default ClaimAnalysis;
