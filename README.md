# CMats

This platform is a specialized full-stack management application designed to streamline material ordering and inventory oversight for Site Foremen and Logistics Personnel. 

The platform replaces manual processes with a conversational voice interface. Users can effortlessly place CMats orders in real-time by speaking, receiving immediate confirmation or follow-up questions via natural Text-to-Speech voice prompts.

## Features

- **Voice Interface**: 
  - Integrated voice recognition with AI-powered conversational responses
- **Admin Dashboard**: 
  - Manage inventory across multiple sites
  - Track incoming/outgoing shipments
  - Review orders with alternative product selection
- **Multi-site Support**: 
  - Handle stock levels per warehouse/location

## Local Development Setup

### Prerequisites
- Docker & Docker Compose installed
- API Keys (you must obtain your own):
  - ElevenLabs API Key
  - Anthropic API Key

### Installation

**1. Clone the repository:**
```bash
# Clone the repository
git clone <repository-url>
cd Tum-ai-hackathon
```

**2. Set up environment variables:**

Create environment files with your API keys. You can use the provided example files as templates:

**Server (.env.example):**

```bash
# replace with actual keys in server/.env.example
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Client (.env.local):**
```bash
# client/.env.local
VITE_API_URL=http://localhost:8000
```

**3. Start services with Docker:**

```bash
# Build and start all services
docker compose up --build

# Or if already built:
docker compose up
```

Open http://localhost:5173 in your browser.

**3. Stop services:**
Stop:
```bash
docker compose down
```

## 📁 Project Structure

```
Tum-ai-hackathon/
├── server/                 
│   ├── api/
│   │   └── v1/            
│   ├── scripts/
│   ├── tests/
│   ├── main.py           
│   ├── cors.py            
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── .env.example
│   ├── .env
│   └── README.md
├── database/
│   └── init/   
│       ├── 01_schema.sql
│       ├── 02_data.sql
│       └── ...
├── testing/      
│   ├── ws_construction_supervisor_5s_demo.html
│   └── index.html
├── compose.yaml      
├── QUICKSTART.md
├── ELEVENLABS_INTEGRATION.md
├── BAUPROJEKTE_GUIDE.md
└── README.md
```