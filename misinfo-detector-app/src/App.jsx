import React, { useState } from 'react';
import { 
  Search, Check, X, AlertCircle, ExternalLink, Copy, Download, Loader, 
  ChevronDown, ChevronUp, FileText, Brain, List, Globe, Shield, Target 
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export default function MisinformationDetectorUI() {
  const [claim, setClaim] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  
  // Phase expansion states
  const [showClassification, setShowClassification] = useState(true);
  const [showDecomposition, setShowDecomposition] = useState(true);
  const [showQuestions, setShowQuestions] = useState(true);
  const [showSearchResults, setShowSearchResults] = useState(true);
  const [showCredibility, setShowCredibility] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(true);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!claim.trim() || claim.length < 5) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Sending request to:', `${API_BASE_URL}/verify`);
      const response = await fetch(`${API_BASE_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ claim: claim.trim() }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Received data from backend:', data);
      
      // Transform backend response to match frontend expectations
      const transformedData = {
        verdict: data.evaluation?.overall_verdict || 'Unverified',
        confidence: data.evaluation?.confidence_score || 0,
        reasoning: data.evaluation?.summary || 'No reasoning available',
        analysis: data.evaluation?.limitations || 'No analysis available',
        result_count: data.search_results?.length || 0,
        
        classification: data.classification || {},
        atomic_claims: data.decomposition?.atomic_claims || [],
        search_questions: data.questions?.queries?.map(q => q.query) || [],
        searches_list: data.search_results?.flatMap(sr => 
          sr.results?.slice(0, 3).map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.snippet,
            source: r.domain,
            credibility: 'Medium'
          })) || []
        ) || [],
        source_credibility: data.search_results?.slice(0, 5).map(sr => ({
          domain: sr.results?.[0]?.domain || 'Unknown',
          title: sr.query,
          credibility_score: sr.success ? 0.7 : 0.3,
          reasoning: sr.success ? `Found ${sr.results?.length || 0} results` : sr.error || 'No results'
        })) || []
      };
      
      console.log('📊 Transformed data:', transformedData);
      setResult(transformedData);
    } catch (err) {
      console.error('❌ Verification error:', err);
      setError(err.message || 'Failed to verify claim. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict) => {
    if (verdict === 'True') return 'bg-green-50 border-green-200';
    if (verdict === 'False') return 'bg-red-50 border-red-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getVerdictIcon = (verdict) => {
    if (verdict === 'True') return <Check className="w-6 h-6 text-green-600" />;
    if (verdict === 'False') return <X className="w-6 h-6 text-red-600" />;
    return <AlertCircle className="w-6 h-6 text-yellow-600" />;
  };

  const copyToClipboard = () => {
    const text = `Claim: ${claim}\nVerdict: ${result.verdict}\nConfidence: ${(result.confidence * 100).toFixed(1)}%\n\nReasoning:\n${result.reasoning}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReport = () => {
    const report = `MISINFORMATION DETECTION REPORT
${'='.repeat(80)}

CLAIM: ${claim}

VERDICT: ${result.verdict}
CONFIDENCE: ${(result.confidence * 100).toFixed(1)}%

CLASSIFICATION:
${JSON.stringify(result.classification, null, 2)}

ATOMIC CLAIMS:
${result.atomic_claims?.map((c, i) => `${i+1}. ${c.statement}`).join('\n')}

SEARCH QUESTIONS:
${result.search_questions?.map((q, i) => `${i+1}. ${q}`).join('\n')}

BASELINE ASSESSMENT:
${result.baseline}

REASONING:
${result.reasoning}

ANALYSIS:
${result.analysis}

${'='.repeat(80)}
Generated: ${new Date().toLocaleString()}
Powered by Gemini AI & Tavily Search
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fact-check-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const PhaseCard = ({ icon: Icon, title, children, expanded, setExpanded }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-blue-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {expanded && (
        <div className="p-6 pt-0 border-t border-slate-200">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Truth Finder</h1>
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Chain of Verification</span>
          </div>
          <p className="text-slate-600">AI-powered fact-checking with multi-agent verification</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <label className="block text-sm font-semibold text-slate-900 mb-3">
            Enter a claim to verify
          </label>
          <form onSubmit={handleVerify}>
            <div className="flex gap-3">
              <input
                type="text"
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="e.g., The Earth is flat"
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading || claim.length < 5}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Verify
                  </>
                )}
              </button>
            </div>
          </form>
          <p className="text-xs text-slate-500 mt-2">Minimum 5 characters required</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-xs text-red-600 mt-2">Make sure the FastAPI backend is running on port 8000</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Debug Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-xs font-mono">
                ✅ Data received!<br/>
                Classification: {result.classification ? 'YES ✓' : 'NO ✗'}<br/>
                Atomic Claims: {result.atomic_claims ? `YES (${result.atomic_claims.length}) ✓` : 'NO ✗'}<br/>
                Search Questions: {result.search_questions ? `YES (${result.search_questions.length}) ✓` : 'NO ✗'}<br/>
                Source Credibility: {result.source_credibility ? `YES (${result.source_credibility.length}) ✓` : 'NO ✗'}
              </p>
            </div>

            {/* Verdict Summary */}
            <div className={`border-2 rounded-lg p-8 ${getVerdictColor(result.verdict)}`}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  {getVerdictIcon(result.verdict)}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {result.verdict === 'True' ? 'Likely True' : result.verdict === 'False' ? 'Likely False' : 'Unverified'}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Based on {result.result_count} search results
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-slate-900">
                    {(result.confidence * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-slate-600">Confidence</p>
                </div>
              </div>

              <div className="bg-white bg-opacity-60 rounded p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Final Reasoning</h3>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{result.reasoning}</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-70 hover:bg-opacity-100 text-slate-900 rounded transition-all text-sm font-medium"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Result'}
                </button>
                <button
                  onClick={downloadReport}
                  className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-70 hover:bg-opacity-100 text-slate-900 rounded transition-all text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>
            </div>

            {/* Phase 1: Classification */}
            {result.classification && (
              <PhaseCard
                icon={Brain}
                title="Phase 1: Claim Classification"
                expanded={showClassification}
                setExpanded={setShowClassification}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Category</p>
                    <p className="text-lg font-semibold text-slate-900">{result.classification.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Domain</p>
                    <p className="text-lg font-semibold text-slate-900">{result.classification.domain}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Complexity</p>
                    <p className="text-lg font-semibold text-slate-900">{result.classification.complexity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Key Entities</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {result.classification.key_entities?.map((entity, idx) => (
                        <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {entity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-slate-500 uppercase mb-2">Description</p>
                  <p className="text-sm text-slate-700">{result.classification.description}</p>
                </div>
              </PhaseCard>
            )}

            {/* Phase 2: Decomposition */}
            {result.atomic_claims && result.atomic_claims.length > 0 && (
              <PhaseCard
                icon={List}
                title={`Phase 2: Claim Decomposition (${result.atomic_claims.length} atomic claims)`}
                expanded={showDecomposition}
                setExpanded={setShowDecomposition}
              >
                <div className="space-y-3">
                  {result.atomic_claims.map((claim, idx) => (
                    <div key={idx} className="border border-slate-200 rounded p-4 bg-slate-50">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-slate-900">{claim.statement}</p>
                          {claim.dependencies && claim.dependencies.length > 0 && (
                            <p className="text-xs text-slate-500 mt-2">
                              Dependencies: {claim.dependencies.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </PhaseCard>
            )}

            {/* Phase 3: Search Questions */}
            {result.search_questions && result.search_questions.length > 0 && (
              <PhaseCard
                icon={Target}
                title={`Phase 3: Search Questions (${result.search_questions.length} questions)`}
                expanded={showQuestions}
                setExpanded={setShowQuestions}
              >
                <div className="space-y-2">
                  {result.search_questions.map((question, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-slate-900">{question}</p>
                    </div>
                  ))}
                </div>
              </PhaseCard>
            )}

            {/* Phase 4: Search Results */}
            {result.searches_list && result.searches_list.length > 0 && (
              <PhaseCard
                icon={Globe}
                title={`Phase 4: Web Search Results (${result.searches_list.length} sources)`}
                expanded={showSearchResults}
                setExpanded={setShowSearchResults}
              >
                <div className="space-y-4">
                  {result.searches_list.map((search, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{search.title}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              search.credibility === 'High' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {search.credibility} Credibility
                            </span>
                            <span className="text-xs text-slate-500">{search.source}</span>
                          </div>
                        </div>
                        <a
                          href={search.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-700 leading-relaxed">{search.snippet}</p>
                        <p className="text-xs text-blue-600 mt-3 font-mono break-all">{search.url}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </PhaseCard>
            )}

            {/* Phase 5: Source Credibility */}
            {result.source_credibility && result.source_credibility.length > 0 && (
              <PhaseCard
                icon={Shield}
                title={`Phase 5: Source Credibility Analysis (${result.source_credibility.length} sources)`}
                expanded={showCredibility}
                setExpanded={setShowCredibility}
              >
                <div className="space-y-3">
                  {result.source_credibility.map((source, idx) => (
                    <div key={idx} className="border border-slate-200 rounded p-4 bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{source.domain}</h4>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                source.credibility_score > 0.7 ? 'bg-green-500' : 
                                source.credibility_score > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${source.credibility_score * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-900">
                            {(source.credibility_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{source.title}</p>
                      <p className="text-sm text-slate-700">{source.reasoning}</p>
                    </div>
                  ))}
                </div>
              </PhaseCard>
            )}

            {/* Phase 6: Detailed Analysis */}
            {result.analysis && result.analysis !== 'No analysis logged' && (
              <PhaseCard
                icon={FileText}
                title="Phase 6: Detailed Analysis"
                expanded={showAnalysis}
                setExpanded={setShowAnalysis}
              >
                <div className="prose prose-sm max-w-none">
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded">
                    {result.analysis}
                  </div>
                </div>
              </PhaseCard>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900 mb-1">Note</p>
              <p>This tool uses a multi-agent Chain of Verification approach to analyze claims. Always verify critical information from primary sources.</p>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Enter a claim above to get started</p>
            <p className="text-slate-400 text-sm mt-2">The system will analyze it through 6 verification phases</p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-slate-600">
          <p>Powered by Gemini AI & Tavily Search • Multi-Agent Chain of Verification</p>
        </div>
      </footer>
    </div>
  );
}
