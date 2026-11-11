# Campus Pluse – AI-Powered Smart Campus Assistant

[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-orange?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

> **Campus Pluse** is an intelligent, full-stack campus assistant and information hub designed to bridge the communication gap between university administration and students. Powered by Next.js, Supabase PostgreSQL with `pgvector`, and Google Gemini, Campus Pluse delivers strictly grounded, hallucination-free answers to academic inquiries, real-time notice board access, and a resilient document ingestion pipeline for faculty coordinators.

---

## 📖 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Screenshots](#-screenshots)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Installation and Setup](#-installation-and-setup)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Future Enhancements](#-future-enhancements)
- [Contribution](#-contribution)
- [License](#-license)
- [Author](#-author)

---

## 🌟 Project Overview

Navigating university circulars, examination schedules, lab guidelines, and scholarship criteria is often fragmented across multiple departmental notice boards, PDFs, and message channels. Students frequently miss critical deadlines or struggle to find specific venue allocations.

**Campus Pluse** centralizes campus knowledge into an accessible, unified digital platform where students can:

- **Browse Official Announcements**: Filter and search notices across categories such as exams, laboratory schedules, placement drives, scholarships, and general campus operations.
- **Query Exam Schedules & Timetables**: Ask conversational questions regarding mid-term and end-term exam dates, batch shifts, roll-number ranges, and seating venues.
- **Access Academic & Lab Guidelines**: Retrieve laboratory manuals, viva voce grading schemes, equipment safety rules, and faculty coordinator makeup slots.
- **Inspect Circulars & Uploaded PDFs**: Preview official circulars with an integrated modal document viewer and instantly cross-query circular details via AI.
- **Get Hallucination-Free AI Answers**: Receive direct, factual answers synthesized from official Supabase database records, complete with verifiable source citations.

---

## ✨ Key Features

- 🤖 **Context-Grounded AI Assistant**
  Conversational question answering strictly grounded in verified campus documents and announcements. Avoids fabricated answers by notifying students if an official record is not yet cataloged.

- 📅 **Examination & Timetable Retrieval**
  Instantly answers complex queries regarding dates, shifts (e.g., Morning 10:00 AM – 12:00 PM vs. Afternoon 2:00 PM – 4:00 PM), batch roll numbers, and venue locations (e.g., Lab 302, Block B).

- 📢 **Filterable Notice Board**
  Category-based circular navigation (`All`, `Exams`, `Lab Schedule`, `Placements`, `Scholarships`, `General`) with real-time text search and priority pinned announcements.

- 🔍 **Multi-Field Hybrid Search & Relevance Scoring**
  Combines multi-field lexical matching across document titles, categories, and full contents with intent boosts (dates, venues, shifts) and optional `pgvector` semantic similarity.

- 📑 **In-App Document & PDF Viewer**
  Embedded preview modal displaying publication metadata, issuer department, and notice content with a one-click *"Ask AI About This Notice"* shortcut.

- 🛡️ **Role-Based Admin Ingestion Portal**
  Faculty and coordinator management panel to publish circulars and ingest new knowledge base documents with automatic text extraction from uploaded files.

- ⚡ **Resilient Ingestion Pipeline**
  Document vectorization using `gemini-embedding-001` (768 dimensions) with automated duplicate prevention, sequential pacing, exponential backoff for HTTP 429 quota exhaustion, and network retry logic.

- 📌 **Verifiable Grounding Citations**
  Every response from the assistant includes citation badges detailing the source document title, category, and an excerpt from the official record.

---

## 📸 Screenshots

<!-- Place actual application screenshots in the assets folder or update paths below -->

| Landing Page & Search | AI Assistant Chat Interface |
|:---:|:---:|
| ![Landing Page Placeholder](https://via.placeholder.com/600x340/0f172a/38bdf8?text=Campus+Pluse+Landing+Page) | ![Chat Interface Placeholder](https://via.placeholder.com/600x340/0f172a/38bdf8?text=AI+Assistant+Chat+Interface) |

| Central Notice Board | Admin Knowledge Manager |
|:---:|:---:|
| ![Notice Board Placeholder](https://via.placeholder.com/600x340/0f172a/38bdf8?text=Central+Announcements+Board) | ![Admin Panel Placeholder](https://via.placeholder.com/600x340/0f172a/38bdf8?text=Admin+Ingestion+Panel) |

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React Server Components & Client Components)
- **UI Library**: [React 18](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) with PostCSS & Autoprefixer
- **Animations & Icons**: [Framer Motion](https://www.framer.com/motion/) & [Lucide React](https://lucide.dev/)

### Backend
- **API Runtime**: Next.js Route Handlers (`app/api/*`)
- **Document Processing**: `pdf-parse` for text extraction from uploaded documents

### Database & Storage
- **Database**: [Supabase](https://supabase.com/) (Managed PostgreSQL)
- **Vector Extension**: [`pgvector`](https://github.com/pgvector/pgvector) for 768-dimensional vector cosine distance search
- **Client Libraries**: `@supabase/supabase-js` with separate administrative and anonymous clients

### AI & Machine Learning
- **SDK**: Google Generative AI SDK (`@google/generative-ai`)
- **Generation Models**: `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.8-flash`
- **Embedding Model**: `gemini-embedding-001` (768-dimensional embeddings)
- **Technique**: Retrieval-Augmented Generation (RAG) with strict grounding prompt constraints

### Development Tools
- Node.js (v18+ or v20+)
- npm package manager

---

## 🏗️ System Architecture

Campus Pluse uses a decoupled client-server architecture built on Next.js 14 App Router, integrating Supabase PostgreSQL and Google Gemini:

```mermaid
flowchart TD
    subgraph Client ["Client Layer (Next.js 14 App Router)"]
        UI_Home["Landing Page (/)"]
        UI_Chat["AI Chat (/chat)"]
        UI_Announcements["Notice Board (/announcements)"]
        UI_Admin["Admin Panel (/admin)"]
    end

    subgraph API ["Serverless API Route Handlers"]
        API_Chat["/api/chat"]
        API_Ingest["/api/ingest"]
        API_Announcements["/api/announcements"]
        API_Documents["/api/documents"]
    end

    subgraph Services ["External & Backend Services"]
        Gemini_LLM["Google Gemini\n(gemini-3.5-flash)"]
        Gemini_Embed["Google Gemini\n(gemini-embedding-001)"]
        Supabase_DB[("Supabase PostgreSQL\n+ pgvector")]
    end

    UI_Home --> UI_Chat
    UI_Chat -->|User Query| API_Chat
    UI_Announcements -->|Fetch / Filter| API_Announcements
    UI_Admin -->|Upload / Ingest| API_Ingest
    UI_Admin -->|Publish Notice| API_Announcements

    API_Chat -->|Structured & Semantic Retrieval| Supabase_DB
    API_Chat -->|Grounded Context + Prompt| Gemini_LLM
    Gemini_LLM -->|Synthesized Answer + Citations| API_Chat

    API_Ingest -->|Check Duplicates| Supabase_DB
    API_Ingest -->|Generate Vector (768-dim)| Gemini_Embed
    API_Ingest -->|Insert Record + Vector| Supabase_DB

    API_Announcements -->|Read / Write Notices| Supabase_DB
    API_Documents -->|List / Reindex Records| Supabase_DB
```

### Retrieval & Grounding Flow
1. **User Submits Question**: Student enters an academic query (e.g., *"When is the DSP lab exam for Batch A?"*).
2. **Context Document Retrieval**:
   - `lib/rag.ts` queries the Supabase `documents` and `announcements` tables directly.
   - Evaluates multi-field relevance across **Title**, **Category**, and **Content** with keyword matching and domain-specific intent boosts (dates, venues, shifts).
   - Augments with `pgvector` similarity search if embeddings are present.
3. **Strict Grounding Prompt**:
   - Retrieved records are formatted into context blocks (`[Record N: Title (Category)] Content`).
   - Prompt enforces strict factual boundary rules: the model must extract exact dates, timings, and venue numbers, cite source titles, and refuse to speculate if information is absent.
4. **Response Delivery**:
   - Assistant streams or renders the answer with highlighted **bold** facts and interactive source citation cards.

---

## 🚀 Installation and Setup

Follow these steps to run Campus Pluse locally on your development machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.17.0 or higher recommended, Node.js 20+ fully supported)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- A [Supabase](https://supabase.com/) account and project
- A [Google AI Studio](https://aistudio.google.com/) Gemini API key

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/campus-pluse.git
cd campus-pluse
```

---

### Step 2: Install Dependencies
```bash
npm install
```

---

### Step 3: Configure Environment Variables
Create a `.env.local` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env.local
```

Open `.env.local` and provide your actual credentials:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key
```

> **Note**: `SUPABASE_SERVICE_ROLE_KEY` is required on the server to permit admin document insertions and manage database records securely without exposing credentials to the client.

---

### Step 4: Initialize the Database Schema
1. Open your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Navigate to **SQL Editor** in the left navigation menu.
3. Open [`supabase/schema.sql`](supabase/schema.sql) from this repository, copy its contents, paste them into the SQL Editor, and click **Run**.
4. This script sets up:
   - The `vector` extension (`pgvector`).
   - The `documents` table with a 768-dimension `vector(768)` column.
   - The `announcements` table with categories and pinned notice flags.
   - The `match_documents` RPC similarity function.
   - Initial verified seed records for instant evaluation.
   - Role permissions for `anon`, `authenticated`, and `service_role`.

---

### Step 5: Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser to view the application.

---

### Step 6: Build for Production
To test production compilation:
```bash
npm run build
npm run start
```

---

## 🔐 Environment Variables

The project requires the following environment variables defined in `.env.local`:

| Variable Name | Required | Scope | Description |
|:---|:---:|:---:|:---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Client & Server | The URL of your Supabase project instance (e.g., `https://xyz.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Client & Server | The public publishable/anon key used for client-side queries. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-Only | The elevated secret service role key used for server-side admin mutations. |
| `GEMINI_API_KEY` | **Yes** | Server-Only | Google Gemini API key used for embedding generation and chat completions. |

Template (`.env.example`):
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key
```

---

## 📁 Project Structure

```text
campus-pluse/
├── app/
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx          # Faculty / Coordinator login page
│   │   └── page.tsx                # Admin knowledge & announcement portal
│   ├── announcements/
│   │   └── page.tsx                # Filterable student announcement board
│   ├── api/
│   │   ├── announcements/
│   │   │   └── route.ts            # GET/POST endpoints for circulars
│   │   ├── chat/
│   │   │   └── route.ts            # RAG AI conversational endpoint
│   │   ├── documents/
│   │   │   └── route.ts            # Knowledge base document management
│   │   └── ingest/
│   │       └── route.ts            # Secure document ingestion & vectorization
│   ├── chat/
│   │   └── page.tsx                # Full-page AI student assistant interface
│   ├── globals.css                 # Global styles and Tailwind utility layers
│   ├── layout.tsx                  # Root HTML layout with Navigation & Footer
│   └── page.tsx                    # Student landing page & search portal
├── components/
│   ├── AnnouncementCard.tsx        # Card component for individual circulars
│   ├── ChatWindow.tsx              # Interactive chat window with citations
│   ├── Navbar.tsx                  # Responsive navigation bar with active states
│   └── PDFViewerModal.tsx          # Modal document previewer with AI shortcut
├── lib/
│   ├── gemini.ts                   # Gemini LLM and gemini-embedding-001 utilities
│   ├── mockStore.ts                # Structured types and fallback data models
│   ├── rag.ts                      # Multi-field retrieval & pgvector sync engine
│   ├── supabaseAdmin.ts            # Server-side Supabase admin client (Service Role)
│   └── supabaseClient.ts           # Client-side Supabase client (Anon Key)
├── supabase/
│   └── schema.sql                  # PostgreSQL DDL, pgvector index & seed data
├── types/
│   └── index.ts                    # TypeScript interfaces (Document, Citation, Chat)
├── .env.example                    # Template environment variables file
├── next.config.js                  # Next.js configuration
├── package.json                    # Project dependencies and npm scripts
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.js              # Tailwind CSS theme customization
└── tsconfig.json                   # TypeScript compiler configuration
```

---

## 🔮 Future Enhancements

The following features represent planned architectural and capability expansions:

- **Autonomous Multi-Agent Coordination**: Integrate dedicated specialized subagents (e.g., Timetable Agent, Exam Seating Agent, Placement Eligibility Verifier) using the Google Antigravity Agent Framework.
- **Advanced Dense & Sparse RAG Pipeline**: Implement BM25 lexical ranking combined with vector cosine distance via reciprocal rank fusion (RRF).
- **OCR & Scanned Document Parsing**: Incorporate Optical Character Recognition (OCR) for scanned physical notice board circulars and multi-page timetable PDFs.
- **Student Profile Personalization**: Role-based views allowing students to filter circulars and exam schedules by specific branch, semester, and batch enrollments.
- **Push & WhatsApp Notification Gateway**: Automated alerts when new high-priority notices (e.g., rescheduled exams, recruitment drives) are published.

---

## 🤝 Contribution

Contributions to **Campus Pluse** are welcome. To contribute:

1. **Fork** the repository.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit Your Changes**:
   ```bash
   git commit -m "feat: add descriptive feature explanation"
   ```
4. **Push to Your Branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** describing your changes and testing steps.

Please ensure all TypeScript checks pass before submitting:
```bash
npx tsc --noEmit
```

---

## 📄 License

*No license has been added to this repository yet.*

All rights are reserved by the project author and maintainers. For permissions, usage, or distribution inquiries, please contact the repository owner.

---

## 👤 Author

**Campus Pluse Project Team**  
Built as an AI-powered smart campus solution for university students and academic coordinators.

For feedback, questions, or inquiries, please open an issue in this repository.

