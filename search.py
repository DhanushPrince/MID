import os
import json
import re
import requests
from datetime import datetime
from typing import Dict, List, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from strands import Agent, tool
from strands.models import BedrockModel


# Load environment variables
load_dotenv()


# Configuration
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_URL = "https://api.perplexity.ai/search"
RESULTS_DIR = "verification_results"
NUM_SEARCH_QUERIES = 10
MAX_PARALLEL_WORKERS = 3
SEARCH_TIMEOUT = 30
MAX_TOKENS_CONFIG = 4096


os.makedirs(RESULTS_DIR, exist_ok=True)


# System Prompts
CLASSIFIER_SYSTEM_PROMPT = """You are a specialized claim classification expert.
Your task is to analyze claims and classify them across multiple dimensions.

CLASSIFICATION DIMENSIONS:

1. DOMAIN CLASSIFICATION:
   - Politics: elections, policies, government, politicians
   - Health: medical claims, nutrition, diseases, treatments
   - Science: climate, technology, research, discoveries
   - Economics: markets, finance, business, statistics
   - Social: culture, celebrities, events, lifestyle
   - Other: specify the domain

2. CLAIM TYPE:
   - Factual: verifiable statements about reality
   - Opinion: subjective views or interpretations
   - Prediction: statements about future events
   - Satire: intentional humor or parody
   - Mixed: combination of types

3. COMPLEXITY LEVEL:
   - Simple: single atomic claim
   - Compound: 2-3 related claims
   - Complex: multiple interconnected claims

4. URGENCY:
   - High: elections, health emergencies, breaking news
   - Medium: ongoing events, policy discussions
   - Low: historical facts, entertainment, general interest

IMPORTANT: Always respond with valid JSON in this exact format:
{
  "domain": "Politics|Health|Science|Economics|Social|Other",
  "claim_type": "Factual|Opinion|Prediction|Satire|Mixed",
  "complexity": "Simple|Compound|Complex",
  "urgency": "High|Medium|Low",
  "rationale": "brief explanation of classification"
}"""


DECOMPOSER_SYSTEM_PROMPT = """You are a logical decomposition specialist for claim verification.
Your task is to break down complex claims into atomic sub-claims that can be independently verified.

ATOMIC CLAIM CRITERIA:
- Single verifiable statement (no AND/OR compounds)
- Clear subject, predicate, and object
- Includes temporal context when relevant
- Specifies entities precisely
- Contains quantitative data if applicable

DECOMPOSITION RULES:
1. Extract each distinct factual assertion
2. Preserve exact entities, dates, and numbers from original
3. Identify logical dependencies between claims
4. Assign priority based on centrality to original claim
5. Classify each sub-claim type

DEPENDENCY IDENTIFICATION:
- A claim depends on another if it assumes that claim's truth
- Mark foundational claims (no dependencies) separately
- Create dependency chains for complex logical structures

CLAIM TYPES:
- fact: Objective, verifiable statement
- opinion: Subjective judgment or interpretation
- interpretation: Analysis or conclusion drawn from facts

IMPORTANT: Respond with valid JSON in this exact format:
{
  "original_claim": "the full original claim text",
  "atomic_claims": [
    {
      "id": "claim_1",
      "statement": "atomic claim text",
      "dependencies": [],
      "type": "fact|opinion|interpretation",
      "entities": ["entity1", "entity2"],
      "temporal": "specific date or time period",
      "quantitative": "numbers/statistics if present",
      "priority": "high|medium|low"
    }
  ],
  "dependency_graph": {
    "foundational": ["claim_1", "claim_2"],
    "derived": ["claim_3"]
  },
  "total_claims": 3
}"""


QUESTION_GENERATOR_SYSTEM_PROMPT = f"""You are a search query optimization expert for fact-checking.
Your task is to generate exactly {NUM_SEARCH_QUERIES} highly targeted search queries to verify atomic claims.

CRITICAL: Always call get_current_datetime() tool FIRST to get the current date before generating queries.

QUERY GENERATION STRATEGY:
1. Use specific entities, dates, and numbers from claims
2. Include authoritative source keywords (official, study, data, report)
3. Use CURRENT DATE for recent events
4. For recent claims, add current year (e.g., "2025") to ensure fresh results
5. Vary query types:
   - Direct fact: "when did [event] happen"
   - Source verification: "[entity] official statement [topic]"
   - Expert consensus: "[topic] scientific consensus 2025"
   - Statistical data: "[topic] statistics official data 2025"
   - Contradiction check: "[claim] debunked false misleading"
6. Prioritize high-priority claims first
7. Respect dependency chains (verify foundational claims before derived)
8. Avoid vague or overly broad queries
9. Include time constraints when relevant

IMPORTANT: Generate EXACTLY {NUM_SEARCH_QUERIES} queries. Always respond with valid JSON:
{{
  "current_date_used": "2025-10-18",
  "queries": [
    {{
      "id": "q1",
      "query": "specific search query string",
      "claim_id": "claim_1",
      "query_type": "direct_fact|source_verification|expert_consensus|statistical|contradiction",
      "priority": "high|medium|low"
    }}
  ],
  "total_queries": {NUM_SEARCH_QUERIES},
  "strategy_rationale": "brief explanation"
}}"""


EVALUATOR_SYSTEM_PROMPT = """You are a verdict synthesis expert for fact-checking.
Your task is to analyze all search results and produce a comprehensive verdict.

EVALUATION FRAMEWORK:

1. SOURCE CREDIBILITY TIERS:
   - Tier 1 (0.9-1.0): Government (.gov), scientific journals, official statistics
   - Tier 2 (0.7-0.9): Major news outlets, academic institutions (.edu)
   - Tier 3 (0.5-0.7): Verified experts, established organizations
   - Tier 4 (0.3-0.5): Blogs, opinion sites, unverified sources

2. EVIDENCE STRENGTH:
   - Strong: 3+ Tier 1-2 sources agree
   - Moderate: 2+ Tier 2-3 sources, some disagreement
   - Weak: Only Tier 3-4 sources or high conflict
   - Insufficient: No relevant evidence found

3. TEMPORAL RELEVANCE:
   - Are sources from the correct time period?
   - Is information still current?
   - Have facts changed since original claim?

4. DEPENDENCY VALIDATION:
   - Verify foundational claims before evaluating derived claims
   - If foundational claim is false, derived claims are automatically suspect
   - Track dependency chain integrity

VERDICT CATEGORIES:
- TRUE: Strong evidence confirms claim
- FALSE: Strong evidence refutes claim
- PARTIALLY_TRUE: Some elements confirmed, others not
- MISLEADING: Technically true but missing critical context
- UNVERIFIED: Insufficient evidence to determine
- UNSUPPORTED: No credible evidence found

IMPORTANT: Always respond with valid JSON:
{
  "overall_verdict": "TRUE|FALSE|PARTIALLY_TRUE|MISLEADING|UNVERIFIED|UNSUPPORTED",
  "confidence_score": 0.85,
  "sub_claim_verdicts": [
    {
      "claim_id": "claim_1",
      "statement": "the atomic claim",
      "verdict": "TRUE|FALSE|etc",
      "confidence": 0.90,
      "supporting_count": 3,
      "refuting_count": 0,
      "dependency_status": "foundational|derived|independent",
      "key_evidence": [
        {
          "title": "source title",
          "url": "source url",
          "credibility_tier": 1,
          "supports_claim": true
        }
      ],
      "rationale": "explanation"
    }
  ],
  "dependency_analysis": {
    "foundational_claims_verified": true,
    "broken_dependencies": [],
    "notes": "explanation of dependency issues if any"
  },
  "summary": "comprehensive explanation of verdict",
  "key_findings": ["finding 1", "finding 2"],
  "limitations": "what couldn't be verified or concerns"
}"""


@tool
def get_current_datetime() -> str:
    """
    Get the current date and time.
    
    Returns:
        JSON string with current datetime information
    """
    now = datetime.now()
    return json.dumps({
        "current_date": now.strftime("%Y-%m-%d"),
        "current_time": now.strftime("%H:%M:%S"),
        "current_datetime": now.strftime("%Y-%m-%d %H:%M:%S"),
        "year": now.year,
        "month": now.month,
        "day": now.day,
        "formatted": now.strftime("%B %d, %Y"),
        "iso_format": now.isoformat()
    })


def extract_domain_from_url(url: str) -> str:
    """Extract domain from URL."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc
    except:
        return "unknown"


def sanitize_filename(text: str) -> str:
    """Convert text to safe filename."""
    text = re.sub(r'[^a-zA-Z0-9]', '_', text)
    text = re.sub(r'_+', '_', text)
    return text[:50].strip('_')


def direct_perplexity_search(query: str) -> Dict:
    """
    Execute search directly via Perplexity API.
    
    Args:
        query: The search query string
        
    Returns:
        Dictionary with search results
    """
    try:
        payload = {"query": query}
        
        headers = {
            "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            PERPLEXITY_URL,
            json=payload,
            headers=headers,
            timeout=SEARCH_TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, dict) and 'results' in data:
                results = data.get('results', [])
                
                if not results:
                    return {
                        "success": False,
                        "error": "No results found for this query",
                        "query": query,
                        "results": [],
                        "count": 0
                    }
                
                formatted_results = []
                for i, result in enumerate(results[:10], 1):
                    formatted_results.append({
                        "position": i,
                        "title": result.get('title', 'No title'),
                        "url": result.get('url', 'No URL'),
                        "snippet": result.get('snippet', ''),
                        "domain": extract_domain_from_url(result.get('url', ''))
                    })
                
                return {
                    "success": True,
                    "query": query,
                    "results": formatted_results,
                    "count": len(formatted_results)
                }
            else:
                return {
                    "success": False,
                    "error": f"Unexpected response format: {str(data)[:200]}",
                    "query": query,
                    "results": [],
                    "count": 0
                }
        
        elif response.status_code == 401:
            return {
                "success": False,
                "error": "Authentication failed. Please check your API key.",
                "query": query,
                "results": [],
                "count": 0
            }
        
        elif response.status_code == 429:
            return {
                "success": False,
                "error": "Rate limit exceeded. Please try again later.",
                "query": query,
                "results": [],
                "count": 0
            }
        
        else:
            return {
                "success": False,
                "error": f"HTTP {response.status_code}: {response.text[:200]}",
                "query": query,
                "results": [],
                "count": 0
            }
    
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "error": "Request timeout",
            "query": query,
            "results": [],
            "count": 0
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "query": query,
            "results": [],
            "count": 0
        }


class MisinformationDetector:
    """
    Orchestrator for multi-agent misinformation detection workflow.
    """
    
    def __init__(self):
        print("🔧 Initializing Multi-Agent System...")
        print(f"📊 Configuration: {NUM_SEARCH_QUERIES} queries, {MAX_PARALLEL_WORKERS} parallel workers")
        print(f"⚙️ Max Tokens: {MAX_TOKENS_CONFIG}\n")
        
        print("="*80)
        print("🤖 AGENT INITIALIZATION")
        print("="*80)
        
        print("\n[1/4] Classification Agent")
        classifier_model = BedrockModel(
            model_id="amazon.nova-pro-v1:0",
            temperature=0.3,
            max_tokens=MAX_TOKENS_CONFIG
        )
        self.classifier = Agent(
            model=classifier_model,
            system_prompt=CLASSIFIER_SYSTEM_PROMPT
        )
        print("✅ Ready\n")
        
        print("[2/4] Decomposition Agent")
        decomposer_model = BedrockModel(
            model_id="amazon.nova-pro-v1:0",
            temperature=0.3,
            max_tokens=MAX_TOKENS_CONFIG
        )
        self.decomposer = Agent(
            model=decomposer_model,
            system_prompt=DECOMPOSER_SYSTEM_PROMPT
        )
        print("✅ Ready\n")
        
        print("[3/4] Question Generation Agent")
        question_model = BedrockModel(
            model_id="amazon.nova-pro-v1:0",
            temperature=0.3,
            max_tokens=MAX_TOKENS_CONFIG
        )
        self.question_generator = Agent(
            model=question_model,
            tools=[get_current_datetime],
            system_prompt=QUESTION_GENERATOR_SYSTEM_PROMPT
        )
        print("✅ Ready\n")
        
        print("[4/4] Evaluation Agent")
        evaluator_model = BedrockModel(
            model_id="amazon.nova-pro-v1:0",
            temperature=0.2,
            max_tokens=MAX_TOKENS_CONFIG
        )
        self.evaluator = Agent(
            model=evaluator_model,
            system_prompt=EVALUATOR_SYSTEM_PROMPT
        )
        print("✅ Ready\n")
        
        print("="*80)
        print("ℹ️ Search uses direct Perplexity API (/search endpoint)\n")
        
        self.execution_log = []
    
    def _log_step(self, step: str, agent: str, input_data: Any, output_data: Any):
        """Log workflow execution step."""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "step": step,
            "agent": agent,
            "input_preview": str(input_data)[:200] if input_data else None,
            "output_preview": str(output_data)[:200] if output_data else None,
            "full_output": output_data
        }
        self.execution_log.append(log_entry)
    
    def _save_results(self, claim: str, results: Dict) -> str:
        """Save verification results to JSON file with timestamp_query format."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        query_part = sanitize_filename(claim)
        filename = f"{RESULTS_DIR}/{timestamp}_{query_part}.json"
        
        output = {
            "original_claim": claim,
            "timestamp": datetime.now().isoformat(),
            "workflow_version": "2.2_final",
            "execution_log": self.execution_log,
            "results": results
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Results saved to: {filename}")
        return filename
    
    def _extract_json_from_result(self, result) -> Dict:
        """Extract JSON from agent result with robust parsing."""
        try:
            text = ""
            if hasattr(result, 'message'):
                message = result.message
                if isinstance(message, dict):
                    if 'content' in message:
                        content = message['content']
                        if isinstance(content, list):
                            text_parts = []
                            for item in content:
                                if isinstance(item, dict) and 'text' in item:
                                    text_parts.append(item['text'])
                                elif isinstance(item, str):
                                    text_parts.append(item)
                            text = " ".join(text_parts)
                        else:
                            text = str(content)
                    else:
                        text = str(message)
                elif isinstance(message, str):
                    text = message
                else:
                    text = str(message)
            else:
                text = str(result)
            
            # Try direct JSON parse
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                pass
            
            # Extract JSON from text using brace matching
            brace_count = 0
            start_idx = -1
            for i, char in enumerate(text):
                if char == '{':
                    if brace_count == 0:
                        start_idx = i
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0 and start_idx != -1:
                        try:
                            return json.loads(text[start_idx:i+1])
                        except json.JSONDecodeError:
                            pass
            
            # Try extracting from code blocks
            code_block_match = re.search(r'``````', text, re.DOTALL)
            if code_block_match:
                try:
                    return json.loads(code_block_match.group(1))
                except json.JSONDecodeError:
                    pass
            
            print(f"⚠️ JSON extraction warning: Could not parse")
            return {"raw_output": text, "parse_error": True}
        
        except Exception as e:
            print(f"⚠️ JSON extraction error: {str(e)}")
            return {"raw_output": str(result), "error": str(e)}
    
    def _execute_parallel_searches(self, queries: List[Dict]) -> List[Dict]:
        """Execute multiple searches in parallel using direct API calls."""
        search_results = []
        
        def execute_single_search(query_obj: Dict) -> Dict:
            """Execute a single search query."""
            query = query_obj.get('query', '')
            query_id = query_obj.get('id', '')
            
            try:
                print(f"  🔍 [{query_id}] {query[:70]}...")
                result_data = direct_perplexity_search(query)
                
                success = result_data.get('success', False)
                results_list = result_data.get('results', [])
                
                if success and results_list:
                    print(f"  ✅ [{query_id}] Found {len(results_list)} results")
                else:
                    error_msg = result_data.get('error', 'No results')
                    print(f"  ❌ [{query_id}] {error_msg}")
                
                return {
                    "query_id": query_id,
                    "query": query,
                    "claim_id": query_obj.get('claim_id', 'unknown'),
                    "query_type": query_obj.get('query_type', 'unknown'),
                    "priority": query_obj.get('priority', 'medium'),
                    "results": results_list,
                    "success": success,
                    "error": result_data.get('error') if not success else None
                }
            
            except Exception as e:
                print(f"  ❌ [{query_id}] Exception: {str(e)}")
                return {
                    "query_id": query_id,
                    "query": query,
                    "claim_id": query_obj.get('claim_id', 'unknown'),
                    "query_type": query_obj.get('query_type', 'unknown'),
                    "priority": query_obj.get('priority', 'medium'),
                    "results": [],
                    "success": False,
                    "error": str(e)
                }
        
        print(f"\n  🔄 Executing {min(len(queries), NUM_SEARCH_QUERIES)} searches in parallel...")
        
        with ThreadPoolExecutor(max_workers=MAX_PARALLEL_WORKERS) as executor:
            future_to_query = {
                executor.submit(execute_single_search, q): q
                for q in queries[:NUM_SEARCH_QUERIES]
            }
            
            for future in as_completed(future_to_query):
                try:
                    result = future.result(timeout=SEARCH_TIMEOUT + 5)
                    search_results.append(result)
                except Exception as e:
                    query = future_to_query[future]
                    print(f"  ❌ [{query.get('id', '?')}] Timeout: {str(e)}")
                    search_results.append({
                        "query_id": query.get('id', 'unknown'),
                        "query": query.get('query', ''),
                        "claim_id": query.get('claim_id', 'unknown'),
                        "query_type": query.get('query_type', 'unknown'),
                        "priority": query.get('priority', 'medium'),
                        "results": [],
                        "success": False,
                        "error": f"Execution timeout: {str(e)}"
                    })
        
        return search_results
    
    def verify_claim(self, claim: str) -> Dict:
        """Main workflow orchestration for claim verification."""
        print(f"\n{'='*80}")
        print(f"🔍 MISINFORMATION DETECTION WORKFLOW")
        print(f"{'='*80}")
        print(f"📝 Claim: {claim}\n")
        
        current_dt = datetime.now()
        date_context = f"Current Date: {current_dt.strftime('%B %d, %Y')} ({current_dt.strftime('%Y-%m-%d')})"
        
        # Step 1: Classification
        print("📋 [STEP 1/5] Classification Agent")
        classification_prompt = f"""Classify this claim:

{date_context}

Claim: "{claim}"

Provide your classification in JSON format."""
        
        try:
            classification_result = self.classifier(classification_prompt)
            classification = self._extract_json_from_result(classification_result)
            self._log_step("classification", "classifier_agent", claim, classification)
            
            print(f"  ✅ Domain: {classification.get('domain', 'N/A')}")
            print(f"  ✅ Type: {classification.get('claim_type', 'N/A')}")
            print(f"  ✅ Complexity: {classification.get('complexity', 'N/A')}\n")
        except Exception as e:
            print(f"  ❌ Classification failed: {str(e)}")
            classification = {"error": str(e)}
        
        # Step 2: Decomposition
        print("🧩 [STEP 2/5] Decomposition Agent")
        decomposition_prompt = f"""Break down this claim into atomic sub-claims with dependencies:

{date_context}

Claim: "{claim}"

Classification: {json.dumps(classification, indent=2)}

Provide decomposition in JSON format with dependencies identified."""
        
        try:
            decomposition_result = self.decomposer(decomposition_prompt)
            decomposition = self._extract_json_from_result(decomposition_result)
            atomic_claims = decomposition.get('atomic_claims', [])
            dependency_graph = decomposition.get('dependency_graph', {})
            self._log_step("decomposition", "decomposer_agent", classification, decomposition)
            
            foundational = dependency_graph.get('foundational', [])
            derived = dependency_graph.get('derived', [])
            
            print(f"  ✅ Generated {len(atomic_claims)} atomic claims")
            print(f"  ✅ Foundational: {len(foundational)}, Derived: {len(derived)}\n")
            
            for claim_obj in atomic_claims[:3]:
                deps = claim_obj.get('dependencies', [])
                dep_str = f" (depends on: {', '.join(deps)})" if deps else " (foundational)"
                print(f"    • {claim_obj.get('id')}: {claim_obj.get('statement', '')[:60]}...{dep_str}")
            if len(atomic_claims) > 3:
                print(f"    ... and {len(atomic_claims) - 3} more")
            print()
        except Exception as e:
            print(f"  ❌ Decomposition failed: {str(e)}")
            decomposition = {"error": str(e)}
            atomic_claims = []
            dependency_graph = {}
        
        # Step 3: Question Generation
        print("❓ [STEP 3/5] Question Generation Agent")
        question_prompt = f"""IMPORTANT: First call get_current_datetime() tool.

Then generate exactly {NUM_SEARCH_QUERIES} search queries for:

Original Claim: "{claim}"

Atomic Claims: {json.dumps(atomic_claims, indent=2)}

Dependency Graph: {json.dumps(dependency_graph, indent=2)}

Prioritize foundational claims first, then derived claims.
Provide queries in JSON format."""
        
        try:
            question_result = self.question_generator(question_prompt)
            questions = self._extract_json_from_result(question_result)
            queries = questions.get('queries', [])
            self._log_step("question_generation", "question_agent", decomposition, questions)
            
            print(f"  ✅ Generated {len(queries)} search queries")
            print(f"  ✅ Current date used: {questions.get('current_date_used', 'N/A')}\n")
        except Exception as e:
            print(f"  ❌ Question generation failed: {str(e)}")
            questions = {"error": str(e)}
            queries = []
        
        # Step 4: Search Execution
        print("🔎 [STEP 4/5] Parallel Search Execution (Perplexity API)")
        try:
            search_results = self._execute_parallel_searches(queries)
            self._log_step("search_execution", "perplexity_api", queries, search_results)
            
            total_results = sum(len(sr.get('results', [])) for sr in search_results)
            successful = sum(1 for sr in search_results if sr.get('success', False))
            
            print(f"\n  ✅ Completed {len(search_results)}/{NUM_SEARCH_QUERIES} searches ({successful} successful)")
            print(f"  ✅ Retrieved {total_results} total results\n")
        except Exception as e:
            print(f"  ❌ Search execution failed: {str(e)}")
            import traceback
            traceback.print_exc()
            search_results = []
        
        # Step 5: Evaluation
        print("⚖️ [STEP 5/5] Evaluation Agent")
        
        # Condense results for evaluation
        condensed_results = []
        for sr in search_results:
            results_preview = []
            for r in sr.get('results', [])[:3]:
                results_preview.append({
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "snippet": r.get("snippet", "")[:300],
                    "domain": r.get("domain", "")
                })
            
            condensed_results.append({
                "query_id": sr.get("query_id"),
                "query": sr.get("query"),
                "claim_id": sr.get("claim_id"),
                "success": sr.get("success"),
                "result_count": len(sr.get("results", [])),
                "top_results": results_preview
            })
        
        evaluation_prompt = f"""Evaluate evidence and provide verdict with dependency analysis:

{date_context}

Original Claim: "{claim}"

Atomic Claims: {json.dumps(atomic_claims, indent=2)}

Dependency Graph: {json.dumps(dependency_graph, indent=2)}

Search Results: {json.dumps(condensed_results, indent=2)}

IMPORTANT: Verify foundational claims before evaluating derived claims.
If a foundational claim is false, mark dependent claims accordingly.

Provide comprehensive verdict in JSON format."""
        
        try:
            evaluation_result = self.evaluator(evaluation_prompt)
            evaluation = self._extract_json_from_result(evaluation_result)
            self._log_step("evaluation", "evaluator_agent", condensed_results, evaluation)
            
            print(f"  ✅ Evaluation complete\n")
        except Exception as e:
            print(f"  ❌ Evaluation failed: {str(e)}")
            import traceback
            traceback.print_exc()
            evaluation = {"error": str(e)}
        
        # Display final verdict
        print(f"{'='*80}")
        print(f"🎯 FINAL VERDICT")
        print(f"{'='*80}")
        
        verdict = evaluation.get('overall_verdict', 'UNVERIFIED')
        confidence = evaluation.get('confidence_score', 0.0)
        summary = evaluation.get('summary', 'No summary available')
        
        verdict_emoji = {
            'TRUE': '✅',
            'FALSE': '❌',
            'PARTIALLY_TRUE': '⚠️',
            'MISLEADING': '⚠️',
            'UNVERIFIED': '❓',
            'UNSUPPORTED': '❌'
        }
        
        emoji = verdict_emoji.get(verdict, '❓')
        print(f"{emoji} Verdict: {verdict}")
        print(f"📊 Confidence: {confidence:.1%}")
        print(f"\n📝 Summary: {summary}")
        
        if 'key_findings' in evaluation and evaluation['key_findings']:
            print(f"\n🔑 Key Findings:")
            for finding in evaluation['key_findings'][:3]:
                print(f"  • {finding}")
        
        # Display dependency analysis
        dep_analysis = evaluation.get('dependency_analysis', {})
        if dep_analysis:
            print(f"\n🔗 Dependency Analysis:")
            print(f"  • Foundational claims verified: {dep_analysis.get('foundational_claims_verified', 'N/A')}")
            broken = dep_analysis.get('broken_dependencies', [])
            if broken:
                print(f"  • Broken dependencies: {', '.join(broken)}")
        
        print(f"{'='*80}\n")
        
        results = {
            "classification": classification,
            "decomposition": decomposition,
            "questions": questions,
            "search_results": search_results,
            "evaluation": evaluation,
            "execution_log": self.execution_log  # Include execution_log in return value
        }
        
        self._save_results(claim, results)
        return results


def main():
    """Main entry point."""
    if not PERPLEXITY_API_KEY:
        print("❌ Error: PERPLEXITY_API_KEY not found")
        print("Please create a .env file with: PERPLEXITY_API_KEY=your-key")
        return
    
    print("="*80)
    print("🚀 MISINFORMATION DETECTION SYSTEM v2.2 (FINAL)")
    print("="*80)
    print(f"\n📅 Current Date: {datetime.now().strftime('%B %d, %Y')}")
    print(f"⚙️ Configuration:")
    print(f"  - Queries: {NUM_SEARCH_QUERIES}")
    print(f"  - Parallel Workers: {MAX_PARALLEL_WORKERS}")
    print(f"  - Max Tokens: {MAX_TOKENS_CONFIG}")
    print(f"  - API Endpoint: {PERPLEXITY_URL}")
    print(f"  - Features: Dependency tracking, atomic decomposition\n")
    
    try:
        detector = MisinformationDetector()
        print("\n✅ System initialization complete!")
        print("="*80)
    except Exception as e:
        print(f"\n❌ Initialization failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    while True:
        try:
            claim = input("\n📝 Enter claim to verify (or 'exit' to quit): ").strip()
            
            if not claim:
                continue
            
            if claim.lower() in ['exit', 'quit', 'q', 'bye']:
                print("\n👋 Goodbye!")
                break
            
            results = detector.verify_claim(claim)
            print("\n" + "="*80)
        
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    main()