# Misinformation Detector

A full-stack AI-powered misinformation detection system that uses multi-agent architecture to verify claims through intelligent decomposition, search, and evaluation.

![Version](https://img.shields.io/badge/version-2.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19.2.0-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688)

## 🌟 Features

- **Multi-Agent System**: Specialized AI agents for classification, decomposition, search, and evaluation
- **Intelligent Claim Analysis**: Automatically classifies claims by domain, type, verifiability, and urgency
- **Smart Decomposition**: Breaks down complex claims into verifiable sub-claims
- **Parallel Search**: Generates and executes multiple search queries concurrently
- **Evidence Evaluation**: Analyzes search results to determine claim veracity
- **Real-time Workflow Visualization**: Track the verification process step-by-step
- **Modern UI**: Beautiful, responsive interface built with React and TailwindCSS
- **Result History**: Browse and review past verification results

## 🏗️ Architecture

### Backend (FastAPI + AWS Bedrock)

The backend uses a multi-agent architecture powered by AWS Bedrock (Claude 3.5 Sonnet):

1. **Classifier Agent**: Analyzes and categorizes claims
2. **Decomposer Agent**: Breaks complex claims into verifiable components
3. **Search Agent**: Generates targeted search queries
4. **Evaluator Agent**: Synthesizes evidence and determines veracity

### Frontend (React)

- Modern, responsive UI with TailwindCSS
- Real-time workflow visualization
- Interactive result display with expandable sections
- Lucide React icons for enhanced UX

## 📋 Prerequisites

- **Python**: 3.8 or higher
- **Node.js**: 14.x or higher
- **npm**: 6.x or higher
- **AWS Account**: With Bedrock access configured
- **Perplexity API Key**: For search functionality

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/mid-aws.git
cd mid-aws
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
pip install fastapi uvicorn python-dotenv pydantic requests strands-framework
```

Or create a `requirements.txt`:

```txt
fastapi
uvicorn[standard]
python-dotenv
pydantic
requests
strands-framework
```

Then install:

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Perplexity API Configuration
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# AWS Configuration (if not using default credentials)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

**Note**: The application uses AWS Bedrock with Claude 3.5 Sonnet. Ensure your AWS credentials have appropriate Bedrock permissions.

### 3. Frontend Setup

```bash
cd misinfo-detector-app
npm install
```

#### Configure Frontend Environment

Create a `.env` file in the `misinfo-detector-app` directory:

```bash
REACT_APP_API_URL=http://localhost:8000
```

## 🎯 Usage

### Starting the Backend

From the root directory:

```bash
python api.py
```

Or use the restart script:

```bash
chmod +x restart_backend.sh
./restart_backend.sh
```

The API will be available at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Starting the Frontend

From the `misinfo-detector-app` directory:

```bash
npm start
```

The application will open at http://localhost:3000

### Using the Application

1. **Enter a Claim**: Type or paste the claim you want to verify
2. **Submit**: Click "Verify Claim" to start the analysis
3. **Watch the Workflow**: See real-time progress through classification, decomposition, search, and evaluation
4. **Review Results**: Examine the detailed analysis, evidence, and verdict
5. **Explore History**: Browse past verification results

## 📡 API Endpoints

### Health Check
```http
GET /
GET /health
```

Returns API status and configuration.

### Verify Claim
```http
POST /verify
Content-Type: application/json

{
  "claim": "Your claim text here"
}
```

Returns complete verification analysis including classification, decomposition, search results, and evaluation.

### List Results
```http
GET /results
```

Returns list of all saved verification results.

### Get Specific Result
```http
GET /results/{filename}
```

Returns a specific verification result by filename.

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **AWS Bedrock**: Claude 3.5 Sonnet for AI agents
- **Strands Framework**: Multi-agent orchestration
- **Perplexity API**: Advanced search capabilities
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation

### Frontend
- **React 19.2**: UI library
- **TailwindCSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library
- **Create React App**: Build tooling

## 📁 Project Structure

```
mid-aws/
├── api.py                      # FastAPI backend server
├── search.py                   # Multi-agent detection system
├── data.py                     # Data models and utilities
├── web.py                      # Additional web utilities
├── restart_backend.sh          # Backend restart script
├── verification_results/       # Saved verification results
├── .env                        # Backend environment variables
├── .gitignore                  # Git ignore rules
└── misinfo-detector-app/       # React frontend
    ├── public/                 # Static assets
    ├── src/
    │   ├── components/         # React components
    │   ├── api/                # API integration
    │   ├── App.js              # Main app component
    │   └── index.js            # Entry point
    ├── package.json            # Frontend dependencies
    ├── tailwind.config.js      # TailwindCSS configuration
    └── .env                    # Frontend environment variables
```

## 🔧 Configuration

### Backend Configuration

Edit `search.py` to customize:

```python
NUM_SEARCH_QUERIES = 10        # Number of search queries to generate
MAX_PARALLEL_WORKERS = 3       # Parallel search workers
SEARCH_TIMEOUT = 30            # Search timeout in seconds
MAX_TOKENS_CONFIG = 4096       # Max tokens for AI responses
```

### CORS Configuration

The backend is configured to accept requests from:
- http://localhost:3000
- http://localhost:3001
- http://127.0.0.1:3000
- http://127.0.0.1:3001

Modify `api.py` to add additional origins if needed.

## 🧪 Testing

### Backend Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test verification endpoint
curl -X POST http://localhost:8000/verify \
  -H "Content-Type: application/json" \
  -d '{"claim": "The Earth is flat"}'
```

### Frontend Testing

```bash
cd misinfo-detector-app
npm test
```

## 📊 Example Verification Flow

1. **Input**: "The Great Wall of China is visible from space"

2. **Classification**:
   - Domain: Science/Geography
   - Type: Factual
   - Verifiability: High
   - Urgency: Low

3. **Decomposition**:
   - Sub-claim 1: The Great Wall of China exists
   - Sub-claim 2: The wall has specific dimensions
   - Sub-claim 3: The wall is visible from space with naked eye

4. **Search**: 10 targeted queries executed in parallel

5. **Evaluation**:
   - Verdict: Mostly False
   - Confidence: High
   - Evidence: Detailed analysis with sources

## 🐛 Troubleshooting

### Backend Issues

**API Key Not Configured**
```bash
# Ensure .env file exists with PERPLEXITY_API_KEY
cat .env
```

**AWS Bedrock Access Denied**
- Verify AWS credentials are configured
- Check IAM permissions for Bedrock access
- Ensure Claude 3.5 Sonnet model access is enabled

**Port Already in Use**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Frontend Issues

**API Connection Failed**
- Verify backend is running on port 8000
- Check REACT_APP_API_URL in `.env`
- Ensure CORS is properly configured

**Dependencies Not Installing**
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **AWS Bedrock**: For providing AWS nova pro
- **Perplexity AI**: For advanced search capabilities
- **Strands Framework**: For multi-agent orchestration
- **React Team**: For the amazing UI library
- **TailwindCSS**: For the utility-first CSS framework

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using AI-powered multi-agent systems**
