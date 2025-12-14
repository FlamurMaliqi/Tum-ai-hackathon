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

## 🛠️ Technical Solution

### Product Data Collection & Processing

Our solution addresses the challenge of aggregating product information from multiple suppliers (Hilti and Würth) to enable intelligent product search and price comparison. Here's how we solved it step by step:

#### Step 1: Web Scraping with Firecrawl

We used **Firecrawl** to crawl and extract product information from supplier websites:

- **Hilti**: Crawled product pages from `hilti.de` to extract construction tools and materials
- **Würth**: Crawled product pages from `eshop.wuerth.de` to extract similar product categories

Firecrawl allowed us to:
- Navigate complex e-commerce sites with dynamic content
- Extract product URLs, names, and metadata
- Handle JavaScript-rendered pages that traditional scrapers struggle with
- Collect structured data from both suppliers in a consistent format

#### Step 2: Data Normalization

The crawled product URLs and metadata were stored in `links.json`, structured by supplier and product name:

```json
{
  "Würth": {
    "Magnetischer Bithalter": ["https://eshop.wuerth.de/..."],
    "Porenbetondübel": ["https://eshop.wuerth.de/..."],
    ...
  },
  "Hilti": {
    "Magnetischer Bithalter": ["https://www.hilti.de/..."],
    "Porenbetondübel": ["https://www.hilti.de/..."],
    ...
  }
}
```

#### Step 3: Automated SQL Generation

We created a Python script (`server/scripts/populate_artikel_from_links.py`) that:

1. **Reads** the `links.json` file containing crawled product URLs
2. **Maps** product names to standardized categories, units, and consumption types
3. **Generates** unique article IDs using a consistent naming scheme:
   - Format: `{SupplierPrefix}-{ProductCode}-{Index}`
   - Example: `W-MAGN-001` (Würth Magnetischer Bithalter) or `H-BOHR-012` (Hilti Bohrhammer)
4. **Outputs** SQL INSERT statements to `database/init/04_populate_from_links.sql`

#### Step 4: Database Population

The generated SQL file is automatically executed during database initialization, populating the `artikel` table with:
- 19 unique products (9 from Würth, 10 from Hilti)
- Standardized product metadata (category, unit, price, supplier)
- Construction site associations
- Price differentiation between suppliers (Hilti products priced 3-5% higher as premium brand)

#### Step 5: Price Comparison & Alternatives

The system enables:
- **Real-time price comparison** between suppliers for the same product
- **Alternative product suggestions** when ordering (e.g., "Would you like the Würth or Hilti version?")
- **Intelligent matching** during voice orders using product name similarity

#### Benefits of This Approach

✅ **Scalable**: Easy to add new suppliers by crawling their sites and updating `links.json`  
✅ **Maintainable**: Single source of truth (`links.json`) with automated SQL generation  
✅ **Accurate**: Direct extraction from supplier websites ensures up-to-date product information  
✅ **Flexible**: Product metadata can be easily adjusted without manual database edits  

## 🗄️ Database Structure

The database uses PostgreSQL and is structured to support multi-site inventory management, order processing, and product catalog management. Here's how the tables are organized:

### Core Tables

#### 1. `construction_sites`
Stores construction site/warehouse locations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Auto-incrementing site ID |
| `name` | VARCHAR(255) UNIQUE | Site name (e.g., "Hochbau", "tiefbau") |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Initial Data**: `Hochbau`, `tiefbau`

#### 2. `artikel` (Products Catalog)
Master product catalog containing all available products from suppliers.

| Column | Type | Description |
|--------|------|-------------|
| `artikel_id` | VARCHAR(50) PRIMARY KEY | Unique product ID (e.g., `W-MAGN-001`, `H-BOHR-012`) |
| `artikelname` | VARCHAR(255) | Product name |
| `kategorie` | VARCHAR(100) | Product category (Werkzeug, PSA, Befestigung, etc.) |
| `einheit` | VARCHAR(50) | Unit of measurement (Stk, m, Rolle, etc.) |
| `preis_eur` | DECIMAL(10, 2) | Price in EUR |
| `lieferant` | VARCHAR(100) | Supplier name (Würth, Hilti) |
| `verbrauchsart` | VARCHAR(50) | Consumption type (Mehrweg, Einweg) |
| `gefahrgut` | BOOLEAN | Hazardous material flag |
| `lagerort` | VARCHAR(100) | Storage location |
| `construction_site_id` | INTEGER FK | Reference to `construction_sites.id` |

**Relationships**:
- References `construction_sites` (many-to-one)
- Referenced by `bestellpositionen` (one-to-many)

**Initial Data**: 19 products (9 from Würth, 10 from Hilti)

#### 3. `inventory`
Tracks current stock levels per construction site.

| Column | Type | Description |
|--------|------|-------------|
| `artikel_id` | VARCHAR(50) PRIMARY KEY | Product ID (matches `artikel.artikel_id`) |
| `artikelname` | VARCHAR(255) | Product name (denormalized) |
| `kategorie` | VARCHAR(100) | Product category |
| `lieferant` | VARCHAR(100) | Supplier name |
| `construction_site` | VARCHAR(100) | Construction site name |
| `quantity` | INTEGER DEFAULT 0 | Current stock quantity |

**Note**: This table is separate from `artikel` to allow independent inventory tracking. A product can exist in `artikel` but not in `inventory` (not in stock).

**Initial Data**: 4 sample inventory entries with quantities

#### 4. `bestellungen` (Orders)
Stores order headers with metadata and status.

| Column | Type | Description |
|--------|------|-------------|
| `bestell_id` | VARCHAR(50) PRIMARY KEY | Unique order ID (e.g., `ORD-001`) |
| `polier_name` | VARCHAR(255) | Foreman name who placed the order |
| `projekt_name` | VARCHAR(255) | Project/construction site name |
| `gesamt_betrag` | DECIMAL(10, 2) | Total order amount in EUR |
| `status` | VARCHAR(50) | Order status: `pending`, `approved`, `rejected`, `delivered` |
| `admin_notizen` | TEXT | Admin notes/comments |
| `erstellt_am` | TIMESTAMP | Order creation timestamp |
| `aktualisiert_am` | TIMESTAMP | Last update timestamp |
| `erstellt_von` | VARCHAR(100) | User who created the order |
| `genehmigt_von` | VARCHAR(100) | Admin who approved/rejected |
| `genehmigt_am` | TIMESTAMP | Approval/rejection timestamp |

**Indexes**: `status`, `polier_name`, `projekt_name`, `erstellt_am`

#### 5. `bestellpositionen` (Order Items)
Stores individual line items within orders.

| Column | Type | Description |
|--------|------|-------------|
| `position_id` | SERIAL PRIMARY KEY | Auto-incrementing line item ID |
| `bestell_id` | VARCHAR(50) FK | Reference to `bestellungen.bestell_id` |
| `artikel_id` | VARCHAR(50) FK | Reference to `artikel.artikel_id` |
| `artikel_name` | VARCHAR(255) | Product name (denormalized for historical tracking) |
| `menge` | INT | Quantity ordered (must be > 0) |
| `einheit` | VARCHAR(50) | Unit of measurement |
| `einzelpreis` | DECIMAL(10, 2) | Unit price at time of order |
| `gesamt_preis` | DECIMAL(10, 2) | Line total (menge × einzelpreis) |
| `position_nummer` | INT | Line item number within order (1, 2, 3...) |
| `notizen` | TEXT | Item-specific notes |

**Relationships**:
- References `bestellungen` (many-to-one, CASCADE delete)
- References `artikel` (many-to-one)

**Indexes**: `bestell_id`, `artikel_id`

## 🎤 ElevenLabs Voice Integration

The platform uses **ElevenLabs** for bidirectional voice communication, enabling natural spoken interactions for material ordering. The integration combines **Speech-to-Text (Scribe)** and **Text-to-Speech (TTS)** to create a seamless conversational experience.

### Architecture Overview

The voice system operates through a **dual WebSocket architecture**:

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │ ◄─────► │   Backend    │ ◄─────► │ ElevenLabs  │
│  (Client)   │         │  (FastAPI)   │         │     API     │
└─────────────┘         └──────────────┘         └─────────────┘
     │                        │                        │
     │                        │                        │
     ├─ Speech-to-Text ───────┼────────────────────────┤
     │  (Scribe v2)           │                        │
     │                        │                        │
     └─ Text-to-Speech ◄──────┼────────────────────────┤
        (TTS Streaming)       │                        │
```

### Step-by-Step Flow

#### 1. **Speech-to-Text (User Input)**

When a user speaks into the microphone:

1. **Frontend (`VoiceAssistant.tsx`)**:
   - Uses `@elevenlabs/react` SDK's `useScribe` hook
   - Captures microphone audio in real-time (PCM 16kHz format)
   - Streams audio directly to ElevenLabs Scribe API via WebSocket

2. **ElevenLabs Scribe**:
   - Processes audio stream in real-time
   - Returns **partial transcripts** (live updates as user speaks)
   - Returns **committed transcripts** (finalized after speech pauses)

3. **Backend Processing**:
   - Receives committed transcripts via WebSocket (`/api/v1/websocket/`)
   - Sends transcript to Claude AI for intent extraction and product matching
   - Uses silence detection (1.5s threshold) to determine when to process

#### 2. **AI Processing (Claude)**

The backend uses **Anthropic Claude** to:

- Extract product names and quantities from spoken text
- Match products against the `artikel` database
- Check inventory availability
- Generate natural language responses
- Suggest alternative products when needed

#### 3. **Text-to-Speech (AI Response)**

Claude's response is converted to speech in real-time:

1. **Streaming Text**:
   - Claude's response is streamed token-by-token
   - Each text chunk is immediately sent to ElevenLabs TTS

2. **ElevenLabs TTS**:
   - Uses `eleven_turbo_v2_5` model for low latency
   - Converts text chunks to MP3 audio (44.1kHz, 128kbps)
   - Returns audio chunks as they're generated (streaming)

3. **Audio Delivery**:
   - Audio chunks sent to client via WebSocket binary frames
   - Client plays audio as it arrives (no waiting for full response)
   - Creates natural, responsive conversation flow

### Technical Implementation

#### Frontend Components

**`VoiceAssistant.tsx`**:
- Manages microphone state and recording controls
- Handles ElevenLabs Scribe connection via `useScribe` hook
- Displays live transcripts (partial and committed)
- Manages WebSocket connection to backend
- Plays received audio responses

**Key Features**:
- **Silence Detection**: Automatically commits transcripts after 1.5s of silence
- **State Management**: Tracks `idle`, `listening`, `thinking`, `responding` states
- **Word-by-Word Reveal**: Displays AI response text synchronized with audio playback
- **Language Support**: Switches between English and German voices

#### Backend Services

**`websocket_service.py`**:
- Manages WebSocket sessions for voice conversations
- Buffers user transcripts until silence detected
- Streams Claude responses token-by-token
- Coordinates TTS audio generation

**`tts_service.py`**:
- Connects to ElevenLabs TTS WebSocket API
- Streams text chunks as they arrive from Claude
- Receives and yields audio chunks in real-time
- Supports language-specific voices (English/German)

**`elevenlabs_service.py`**:
- Generates single-use tokens for Scribe API
- Handles authentication with ElevenLabs
- Manages token expiry (15 minutes)

### Voice Configuration

#### Speech-to-Text (Scribe)
- **Model**: `scribe_v2_realtime`
- **Audio Format**: PCM 16kHz, 16-bit, mono
- **Features**: 
  - Echo cancellation
  - Noise suppression
  - Auto gain control
- **Languages**: English (`en`), German (`de`)

#### Text-to-Speech (TTS)
- **Model**: `eleven_turbo_v2_5` (optimized for speed)
- **Output Format**: MP3 44.1kHz, 128kbps
- **Voices**:
  - English: "Charlotte" (warm, sultry tone)
  - German: "Matilda" (multilingual, German-optimized)
- **Settings**:
  - Stability: 0.7
  - Similarity Boost: 0.85
  - Speed: 1.15

### Security & Authentication

- **API Key Protection**: ElevenLabs API key stored only on backend (never exposed to client)
- **Token-Based Auth**: Frontend receives single-use tokens from backend
- **Token Expiry**: Tokens expire after 15 minutes for security
- **WebSocket Security**: All connections use WSS (secure WebSocket) in production

### Benefits of This Architecture

✅ **Low Latency**: Streaming audio generation means responses start playing before Claude finishes  
✅ **Natural Flow**: Real-time transcription and audio playback creates conversational experience  
✅ **Multilingual**: Supports both English and German with appropriate voices  
✅ **Scalable**: WebSocket architecture handles concurrent voice sessions efficiently  
✅ **Secure**: API keys never exposed to client-side code  

## 📁 Project Structure

```
Tum-ai-hackathon/
├── server/                 
│   ├── api/
│   │   └── v1/            
│   ├── scripts/
│   │   └── populate_artikel_from_links.py  # Generates SQL from links.json
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
│       ├── 04_populate_from_links.sql      # Auto-generated from links.json
│       └── ...
├── links.json                              # Crawled product URLs from Firecrawl
├── testing/      
│   ├── ws_construction_supervisor_5s_demo.html
│   └── index.html
├── compose.yaml      
├── QUICKSTART.md
├── ELEVENLABS_INTEGRATION.md
├── BAUPROJEKTE_GUIDE.md
└── README.md
```