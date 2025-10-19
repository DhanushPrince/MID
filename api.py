import os
import json
from datetime import datetime
from typing import Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from search import MisinformationDetector, PERPLEXITY_API_KEY

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Misinformation Detection API",
    description="Multi-agent system for fact-checking and claim verification",
    version="2.2"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://10.151.176.184:3000",  # Network access
        "http://10.151.176.184:3001"   # Network access
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global detector instance
detector: Optional[MisinformationDetector] = None


class ClaimRequest(BaseModel):
    claim: str


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    api_configured: bool


class VerificationResponse(BaseModel):
    success: bool
    claim: str
    timestamp: str
    classification: Dict
    decomposition: Dict
    questions: Dict
    search_results: list
    evaluation: Dict
    execution_log: list = []  # Workflow execution steps for frontend display
    error: Optional[str] = None


@app.on_event("startup")
async def startup_event():
    """Initialize the detector on startup."""
    global detector
    
    if not PERPLEXITY_API_KEY:
        print("⚠️ Warning: PERPLEXITY_API_KEY not configured")
        return
    
    try:
        print("🚀 Initializing Misinformation Detector...")
        detector = MisinformationDetector()
        print("✅ Detector initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize detector: {str(e)}")


@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "api_configured": PERPLEXITY_API_KEY is not None
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy" if detector else "initializing",
        "timestamp": datetime.now().isoformat(),
        "api_configured": PERPLEXITY_API_KEY is not None
    }


@app.post("/verify", response_model=VerificationResponse)
async def verify_claim(request: ClaimRequest):
    """
    Verify a claim using the multi-agent detection system.
    
    Args:
        request: ClaimRequest with the claim text
        
    Returns:
        VerificationResponse with complete analysis
    """
    global detector
    
    if not PERPLEXITY_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="API not configured. Please set PERPLEXITY_API_KEY in .env file"
        )
    
    if not detector:
        try:
            detector = MisinformationDetector()
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Failed to initialize detector: {str(e)}"
            )
    
    claim = request.claim.strip()
    
    if not claim:
        raise HTTPException(
            status_code=400,
            detail="Claim cannot be empty"
        )
    
    if len(claim) < 10:
        raise HTTPException(
            status_code=400,
            detail="Claim is too short. Please provide a meaningful statement."
        )
    
    try:
        print(f"\n📝 Processing claim: {claim}")
        results = detector.verify_claim(claim)
        
        return {
            "success": True,
            "claim": claim,
            "timestamp": datetime.now().isoformat(),
            "classification": results.get("classification", {}),
            "decomposition": results.get("decomposition", {}),
            "questions": results.get("questions", {}),
            "search_results": results.get("search_results", []),
            "evaluation": results.get("evaluation", {}),
            "execution_log": results.get("execution_log", []),  # Add execution_log for workflow display
            "error": None
        }
    
    except Exception as e:
        print(f"❌ Error processing claim: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "claim": claim,
            "timestamp": datetime.now().isoformat(),
            "classification": {},
            "decomposition": {},
            "questions": {},
            "search_results": [],
            "evaluation": {},
            "execution_log": [],
            "error": str(e)
        }


@app.get("/results")
async def list_results():
    """List all verification result files."""
    try:
        results_dir = "verification_results"
        if not os.path.exists(results_dir):
            return {"results": []}
        
        files = []
        for filename in os.listdir(results_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(results_dir, filename)
                stat = os.stat(filepath)
                files.append({
                    "filename": filename,
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "size": stat.st_size
                })
        
        files.sort(key=lambda x: x["created"], reverse=True)
        return {"results": files}
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list results: {str(e)}"
        )


@app.get("/results/{filename}")
async def get_result(filename: str):
    """Get a specific verification result."""
    try:
        filepath = os.path.join("verification_results", filename)
        
        if not os.path.exists(filepath):
            raise HTTPException(
                status_code=404,
                detail=f"Result file not found: {filename}"
            )
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read result: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    
    print("="*80)
    print("🚀 MISINFORMATION DETECTION API")
    print("="*80)
    print(f"\n📅 Starting server at: {datetime.now().strftime('%B %d, %Y %H:%M:%S')}")
    print(f"🌐 Frontend location: /Users/dhanush/Documents/model/mid-aws/misinfo-detector-app")
    print(f"🔑 API Key configured: {PERPLEXITY_API_KEY is not None}")
    print("\n📡 Endpoints:")
    print("  - GET  /          - Health check")
    print("  - GET  /health    - Detailed health")
    print("  - POST /verify    - Verify claim")
    print("  - GET  /results   - List all results")
    print("  - GET  /results/{filename} - Get specific result")
    print("\n🚀 Starting server on http://localhost:8000")
    print("📚 API docs available at http://localhost:8000/docs")
    print("="*80 + "\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
