import { useState } from 'react';
import { Search, ExternalLink, ChevronDown, ChevronUp, Filter, SortAsc, SortDesc } from 'lucide-react';

/**
 * SearchResults Component
 * Displays detailed web search results from Perplexity API
 */
const SearchResults = ({ results }) => {
  const [expandedResult, setExpandedResult] = useState(null);
  const [sortBy, setSortBy] = useState('position');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Toggle expanded result
  const toggleResult = (index) => {
    if (expandedResult === index) {
      setExpandedResult(null);
    } else {
      setExpandedResult(index);
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Set sort field
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Get unique sources for filter dropdown
  const getSources = () => {
    if (!results || !Array.isArray(results)) return [];
    
    const sources = new Set();
    results.forEach(result => {
      if (result.source) {
        sources.add(result.source);
      }
    });
    
    return Array.from(sources).sort();
  };

  // Filter and sort results
  const getFilteredAndSortedResults = () => {
    if (!results || !Array.isArray(results)) return [];
    
    console.log(`SearchResults - Processing ${results.length} total results`);
    
    // Filter results
    let filteredResults = results;
    
    if (filterQuery) {
      const query = filterQuery.toLowerCase();
      filteredResults = filteredResults.filter(result => 
        result.title?.toLowerCase().includes(query) || 
        result.snippet?.toLowerCase().includes(query) ||
        result.query?.toLowerCase().includes(query)
      );
      console.log(`SearchResults - After keyword filter: ${filteredResults.length} results`);
    }
    
    if (filterSource) {
      filteredResults = filteredResults.filter(result => 
        result.source === filterSource
      );
      console.log(`SearchResults - After source filter: ${filteredResults.length} results`);
    }
    
    // Group results by query
    const groupedByQuery = {};
    filteredResults.forEach(result => {
      const queryId = result.queryId || 'unknown';
      if (!groupedByQuery[queryId]) {
        groupedByQuery[queryId] = [];
      }
      groupedByQuery[queryId].push(result);
    });
    
    console.log(`SearchResults - Grouped into ${Object.keys(groupedByQuery).length} queries`);
    
    // Flatten and sort results
    let sortedResults = [];
    
    // Sort queries by query ID
    const sortedQueries = Object.keys(groupedByQuery).sort();
    
    sortedQueries.forEach(queryId => {
      // Sort results within each query
      const queryResults = groupedByQuery[queryId].sort((a, b) => {
        let valueA, valueB;
        
        switch (sortBy) {
          case 'position':
            valueA = a.position || 0;
            valueB = b.position || 0;
            break;
          case 'credibility':
            valueA = a.credibilityTier?.tier || 4;
            valueB = b.credibilityTier?.tier || 4;
            break;
          case 'source':
            valueA = a.source || '';
            valueB = b.source || '';
            break;
          default:
            valueA = a.position || 0;
            valueB = b.position || 0;
        }
        
        // For strings
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortOrder === 'asc' 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        }
        
        // For numbers
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      });
      
      // Add query header
      const query = queryResults[0]?.query || queryId;
      sortedResults.push({
        isHeader: true,
        queryId,
        query,
        count: queryResults.length
      });
      
      // Add results
      sortedResults = [...sortedResults, ...queryResults];
    });
    
    console.log(`SearchResults - Final sorted results: ${sortedResults.length} items`);
    return sortedResults;
  };

  // Get credibility badge color
  const getCredibilityBadgeColor = (tier) => {
    if (!tier) return 'bg-gray-100 text-gray-700';
    
    switch (tier.tier) {
      case 1:
        return 'bg-green-100 text-green-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Highlight search terms in text
  const highlightText = (text, term) => {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-200">{part}</mark> : part
    );
  };

  // Truncate text with ellipsis
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const filteredResults = getFilteredAndSortedResults();
  const sources = getSources();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search Results
          <span className="text-sm font-normal text-gray-500">
            ({results?.length || 0} total from {filteredResults.filter(r => r.isHeader).length} queries)
          </span>
        </h2>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
      
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter by keyword..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Sources</option>
                {sources.map((source, index) => (
                  <option key={index} value={source}>{source}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="position">Relevance</option>
                <option value="credibility">Credibility</option>
                <option value="source">Source</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <button
                onClick={toggleSortOrder}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-sm"
              >
                {sortOrder === 'asc' ? (
                  <>
                    <SortAsc className="w-4 h-4" />
                    Ascending
                  </>
                ) : (
                  <>
                    <SortDesc className="w-4 h-4" />
                    Descending
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setFilterQuery('');
                setFilterSource('');
                setSortBy('position');
                setSortOrder('asc');
              }}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
      
      {filteredResults.length > 0 ? (
        <div className="space-y-4">
          {filteredResults.map((item, index) => (
            item.isHeader ? (
              // Query Header
              <div 
                key={`header-${item.queryId}`}
                className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-6 first:mt-0"
              >
                <h3 className="font-medium text-blue-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-2">
                      Query {index/2 + 1}
                    </span>
                    {item.query}
                  </div>
                  <span className="text-sm font-normal text-blue-600">
                    {item.count} results
                  </span>
                </h3>
              </div>
            ) : (
              // Search Result Item
              <div 
                key={`${item.url}-${index}`} 
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow ml-4"
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => toggleResult(index)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-lg text-gray-900 hover:text-blue-600 transition-colors">
                      {highlightText(item.title, filterQuery)}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getCredibilityBadgeColor(item.credibilityTier)}`}>
                        {item.credibilityTier?.label || 'Standard'} Source
                      </span>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span className="font-mono">{item.source}</span>
                    {item.position && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                        Result #{item.position}
                      </span>
                    )}
                  </div>
                  
                  <p className="mt-2 text-gray-700 line-clamp-2">
                    {highlightText(truncateText(item.snippet, 200), filterQuery)}
                  </p>
                  
                  <div className="mt-2 flex justify-end">
                    {expandedResult === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {expandedResult === index && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-line">
                        {highlightText(item.snippet, filterQuery)}
                      </p>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {item.queryId && <span>Query ID: {item.queryId}</span>}
                      </div>
                      
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Visit Source
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700">No search results found</h3>
          <p className="text-gray-500 mt-1">
            {filterQuery || filterSource ? 'Try adjusting your filters' : 'No search results available'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
