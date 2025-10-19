# Agentic AI Misinformation Detection System

## Problem Statement
**Track 3: Misinformation - Problem Statement 1**

Create an Agentic AI system that continuously scans multiple sources of information, detects emerging misinformation, verifies facts, and provides easy-to-understand, contextual updates to the public during crises.

---

## System Architecture

```mermaid
graph TB
    subgraph "Input Layer"
        A[User Claim Input] --> B[MisinformationDetector Orchestrator]
    end
    
    subgraph "Multi-Agent System"
        B --> C[Classification Agent]
        C --> D[Decomposition Agent]
        D --> E[Question Generation Agent]
        E --> F[Parallel Search Execution]
        F --> G[Evaluation Agent]
    end
    
    subgraph "External Services"
        F --> H[Perplexity API]
        H --> I[Multiple Information Sources]
        I --> |Web Results| F
    end
    
    subgraph "Output Layer"
        G --> J[Verdict Synthesis]
        J --> K[JSON Results Storage]
        J --> L[Public-Facing Report]
    end
    
    style B fill:#ff6b6b
    style C fill:#4ecdc4
    style D fill:#45b7d1
    style E fill:#96ceb4
    style F fill:#ffeaa7
    style G fill:#dfe6e9
    style H fill:#fd79a8
```

---

## Detailed Workflow

```mermaid
flowchart TD
    Start([Claim Received]) --> Init[Initialize Multi-Agent System]
    
    Init --> Step1[STEP 1: Classification Agent]
    
    Step1 --> C1{Analyze Claim}
    C1 --> C2[Domain: Politics/Health/Science/Economics/Social]
    C1 --> C3[Type: Factual/Opinion/Prediction/Satire]
    C1 --> C4[Complexity: Simple/Compound/Complex]
    C1 --> C5[Urgency: High/Medium/Low]
    
    C2 & C3 & C4 & C5 --> Step2[STEP 2: Decomposition Agent]
    
    Step2 --> D1[Break into Atomic Claims]
    D1 --> D2[Identify Dependencies]
    D2 --> D3[Create Dependency Graph]
    D3 --> D4[Foundational vs Derived Claims]
    
    D4 --> Step3[STEP 3: Question Generation Agent]
    
    Step3 --> Q1[Get Current DateTime]
    Q1 --> Q2[Generate 10 Targeted Search Queries]
    Q2 --> Q3[Prioritize by Claim Importance]
    Q3 --> Q4[Include Temporal Context]
    
    Q4 --> Step4[STEP 4: Parallel Search Execution]
    
    Step4 --> S1[ThreadPoolExecutor - 3 Workers]
    S1 --> S2[Query 1-3: Direct Fact Verification]
    S1 --> S3[Query 4-6: Source Verification]
    S1 --> S4[Query 7-9: Expert Consensus]
    S1 --> S5[Query 10: Contradiction Check]
    
    S2 & S3 & S4 & S5 --> S6[Perplexity API /search]
    S6 --> S7[Aggregate Results from Multiple Sources]
    
    S7 --> Step5[STEP 5: Evaluation Agent]
    
    Step5 --> E1[Assess Source Credibility]
    E1 --> E2[Tier 1: .gov, Scientific Journals]
    E1 --> E3[Tier 2: Major News, .edu]
    E1 --> E4[Tier 3: Verified Experts]
    E1 --> E5[Tier 4: Blogs, Unverified]
    
    E2 & E3 & E4 & E5 --> E6[Evidence Strength Analysis]
    E6 --> E7[Validate Dependency Chain]
    E7 --> E8[Synthesize Verdict]
    
    E8 --> V1{Verdict}
    V1 --> |Strong Evidence| V2[TRUE/FALSE]
    V1 --> |Partial Evidence| V3[PARTIALLY_TRUE/MISLEADING]
    V1 --> |Insufficient| V4[UNVERIFIED/UNSUPPORTED]
    
    V2 & V3 & V4 --> Output[Generate Final Report]
    Output --> Save[Save to JSON with Timestamp]
    Output --> Display[Display Public-Friendly Summary]
    
    Display --> End([Crisis Update Published])
    
    style Step1 fill:#4ecdc4
    style Step2 fill:#45b7d1
    style Step3 fill:#96ceb4
    style Step4 fill:#ffeaa7
    style Step5 fill:#dfe6e9
    style V2 fill:#00b894
    style V3 fill:#fdcb6e
    style V4 fill:#d63031
```

---

## Agent Interaction Sequence

```mermaid
sequenceDiagram
    participant User
    participant Orchestrator
    participant Classifier
    participant Decomposer
    participant QuestionGen
    participant SearchAPI
    participant Evaluator
    participant Storage
    
    User->>Orchestrator: Submit Claim
    Orchestrator->>Classifier: Classify Claim
    
    Note over Classifier: Amazon Nova Pro v1<br/>Temperature: 0.3<br/>Analyzes Domain, Type,<br/>Complexity, Urgency
    
    Classifier-->>Orchestrator: Classification Result
    
    Orchestrator->>Decomposer: Decompose into Atomic Claims
    
    Note over Decomposer: Amazon Nova Pro v1<br/>Temperature: 0.3<br/>Creates Dependency Graph<br/>Identifies Foundational Claims
    
    Decomposer-->>Orchestrator: Atomic Claims + Dependencies
    
    Orchestrator->>QuestionGen: Generate Search Queries
    QuestionGen->>QuestionGen: Call get_current_datetime()
    
    Note over QuestionGen: Amazon Nova Pro v1<br/>Temperature: 0.3<br/>Generates 10 Queries<br/>Prioritizes by Dependencies
    
    QuestionGen-->>Orchestrator: 10 Targeted Queries
    
    Orchestrator->>SearchAPI: Execute Parallel Searches (3 workers)
    
    loop For Each Query
        SearchAPI->>SearchAPI: Perplexity API /search
        SearchAPI-->>Orchestrator: Search Results
    end
    
    Note over SearchAPI: Timeout: 30s<br/>Max 10 results per query<br/>Extracts: Title, URL,<br/>Snippet, Domain
    
    Orchestrator->>Evaluator: Evaluate All Evidence
    
    Note over Evaluator: Amazon Nova Pro v1<br/>Temperature: 0.2<br/>Source Credibility Tiers<br/>Dependency Validation
    
    Evaluator-->>Orchestrator: Final Verdict + Confidence
    
    Orchestrator->>Storage: Save Results with Timestamp
    Orchestrator->>User: Display Verdict & Summary
    
    Note over User: Easy-to-Understand<br/>Contextual Update<br/>with Key Findings
```

---

## Data Flow Architecture

```mermaid
graph LR
    subgraph "Input Processing"
        A1[Raw Claim] --> A2[Date Context Added]
        A2 --> A3[Classification Metadata]
    end
    
    subgraph "Claim Decomposition"
        A3 --> B1[Atomic Claim 1]
        A3 --> B2[Atomic Claim 2]
        A3 --> B3[Atomic Claim N]
        B1 --> B4[Dependency Graph]
        B2 --> B4
        B3 --> B4
    end
    
    subgraph "Query Generation"
        B4 --> C1[Foundational Queries]
        B4 --> C2[Derived Queries]
        C1 --> C3[10 Optimized Queries]
        C2 --> C3
    end
    
    subgraph "Information Retrieval"
        C3 --> D1[Query Batch 1]
        C3 --> D2[Query Batch 2]
        C3 --> D3[Query Batch 3]
        D1 --> D4[Perplexity API]
        D2 --> D4
        D3 --> D4
        D4 --> D5[Aggregated Results]
    end
    
    subgraph "Evidence Analysis"
        D5 --> E1[Source Credibility Scoring]
        E1 --> E2[Evidence Strength Assessment]
        E2 --> E3[Dependency Chain Validation]
        E3 --> E4[Verdict Synthesis]
    end
    
    subgraph "Output Generation"
        E4 --> F1[Overall Verdict]
        E4 --> F2[Sub-Claim Verdicts]
        E4 --> F3[Confidence Score]
        E4 --> F4[Key Findings]
        F1 & F2 & F3 & F4 --> F5[JSON Report]
        F1 & F2 & F3 & F4 --> F6[Public Summary]
    end
    
    style A1 fill:#74b9ff
    style D4 fill:#fd79a8
    style E4 fill:#55efc4
    style F5 fill:#ffeaa7
    style F6 fill:#ff7675
```

---

## Key Features Addressing Problem Statement

```mermaid
mindmap
  root((Misinformation<br/>Detection System))
    Continuous Scanning
      Parallel Search Execution
      ThreadPoolExecutor 3 Workers
      30s Timeout per Query
      10 Queries per Claim
    Multiple Sources
      Perplexity API Integration
      Government Sources .gov
      Academic Institutions .edu
      Major News Outlets
      Scientific Journals
      Expert Verification
    Fact Verification
      4-Tier Credibility System
      Dependency Graph Validation
      Atomic Claim Decomposition
      Evidence Strength Analysis
      Temporal Relevance Check
    Easy-to-Understand Updates
      Verdict Categories
        TRUE
        FALSE
        PARTIALLY_TRUE
        MISLEADING
        UNVERIFIED
        UNSUPPORTED
      Confidence Scores
      Key Findings Summary
      Public-Friendly Language
    Crisis Response
      Urgency Classification
        High: Elections, Health Emergencies
        Medium: Ongoing Events
        Low: General Interest
      Real-time Processing
      JSON Storage with Timestamps
      Execution Log Tracking
```

---

## Technology Stack

```mermaid
graph TB
    subgraph "AI Models"
        M1[Amazon Nova Pro v1:0]
        M2[AWS Bedrock]
    end
    
    subgraph "Agent Framework"
        A1[Strands Agent Library]
        A2[Tool Integration]
        A3[System Prompts]
    end
    
    subgraph "Search & Retrieval"
        S1[Perplexity API]
        S2[REST API Integration]
        S3[ThreadPoolExecutor]
    end
    
    subgraph "Data Processing"
        D1[JSON Parsing]
        D2[Regex Pattern Matching]
        D3[URL Domain Extraction]
    end
    
    subgraph "Storage & Logging"
        ST1[JSON File Storage]
        ST2[Execution Log]
        ST3[Timestamp-based Naming]
    end
    
    M1 --> A1
    M2 --> M1
    A1 --> A2
    A2 --> A3
    A1 --> S1
    S1 --> S2
    S2 --> S3
    S3 --> D1
    D1 --> D2
    D2 --> D3
    D3 --> ST1
    ST1 --> ST2
    ST2 --> ST3
    
    style M1 fill:#ff6b6b
    style A1 fill:#4ecdc4
    style S1 fill:#fd79a8
    style ST1 fill:#ffeaa7
```

---

## Configuration & Performance

| Parameter | Value | Purpose |
|-----------|-------|---------||
| **NUM_SEARCH_QUERIES** | 10 | Comprehensive coverage of claim aspects |
| **MAX_PARALLEL_WORKERS** | 3 | Optimal balance of speed and API limits |
| **SEARCH_TIMEOUT** | 30s | Prevent hanging on slow sources |
| **MAX_TOKENS_CONFIG** | 4096 | Detailed analysis capability |
| **Temperature** | 0.2-0.3 | Balance creativity and accuracy |

---

## Crisis Response Workflow

```mermaid
stateDiagram-v2
    [*] --> Monitoring: System Active
    
    Monitoring --> ClaimDetected: New Claim Identified
    
    ClaimDetected --> UrgencyCheck: Classify Urgency
    
    UrgencyCheck --> HighPriority: Health Emergency/Elections
    UrgencyCheck --> MediumPriority: Ongoing Events
    UrgencyCheck --> LowPriority: General Interest
    
    HighPriority --> FastTrack: Immediate Processing
    MediumPriority --> Standard: Normal Queue
    LowPriority --> Standard
    
    FastTrack --> Verification: Multi-Agent Analysis
    Standard --> Verification
    
    Verification --> EvidenceGathering: Parallel Search
    EvidenceGathering --> CredibilityCheck: Source Validation
    CredibilityCheck --> VerdictSynthesis: Evaluate Evidence
    
    VerdictSynthesis --> PublicUpdate: Generate Report
    PublicUpdate --> Distribution: Publish to Public
    
    Distribution --> Monitoring: Continue Monitoring
    
    note right of HighPriority
        Crisis Mode:
        - Faster processing
        - More queries
        - Higher priority sources
    end note
    
    note right of PublicUpdate
        Public-Friendly Format:
        - Clear verdict
        - Confidence score
        - Key findings
        - Source citations
    end note
```

---

## System Benefits

### ✅ Addresses Problem Statement Requirements

1. **Continuous Scanning**: Parallel search execution with configurable workers
2. **Multiple Sources**: Perplexity API aggregates from diverse information sources
3. **Misinformation Detection**: 4-agent system with specialized roles
4. **Fact Verification**: Evidence-based evaluation with credibility tiers
5. **Easy-to-Understand Updates**: Structured verdicts with confidence scores
6. **Contextual Information**: Dependency graphs and temporal relevance
7. **Crisis Response**: Urgency classification and real-time processing

### 🚀 Technical Innovations

- **Dependency Graph Validation**: Ensures logical consistency in complex claims
- **Atomic Claim Decomposition**: Breaks down compound statements for precise verification
- **Multi-Tier Credibility System**: Weights sources by reliability
- **Temporal Context Awareness**: Uses current date for recent event verification
- **Parallel Processing**: Efficient information retrieval with ThreadPoolExecutor

### 📊 Output Quality

- **Structured JSON Reports**: Machine-readable results with full audit trail
- **Confidence Scoring**: Quantifiable trust metrics (0.0-1.0)
- **Verdict Categories**: 6 distinct classifications for nuanced assessment
- **Key Findings**: Digestible summaries for public consumption
- **Execution Logging**: Complete transparency of decision-making process
