# 🇹🇭 Thai AI for Citizens - WebMCP Powered Public Service Assistant

> **A human-centered AI application that helps Thai citizens navigate public information, understand services, and take action together with intelligent assistance.**

Thai AI for Citizens started from a simple question: **What would happen if AI could do more than answer citizens' questions and could actually help them navigate public information, understand services, compare options, and take the next step together with them?**

---

## 📖 The Problem We're Solving

In Thailand, citizens often face:
- 🔍 **Information Fragmentation**: Need to search across different government websites
- 📚 **Complex Procedures**: Complicated information that's hard to understand
- 🤔 **Decision Paralysis**: Multiple options but unclear which applies to them
- ⚡ **The Action Gap**: Information exists, but the leap to action is too large

The real problem isn't the **lack of information** — it's the **gap between information and action**.

---

## ✨ Our Solution: Combining Human Judgment & Machine Assistance

```
CITIZEN INTERACTION LAYER
        │
        ├─→ Browse information
        ├─→ Read procedures
        ├─→ Compare options
        └─→ Confirm actions
        
        ▼
   ROUTER / LEAD MODEL
   (Understands user intent)
        │
┌───────┼───────┬────────────┐
│       │       │            │
▼       ▼       ▼            ▼
Reasoning  Translation  Voice    Vision
 Model      Model      Model    Model
│       │       │            │
└───────┼───────┴────────────┘
        ▼
   WEBMCP TOOLS LAYER
   (Structured Actions)
        │
┌───────┼───────┬────────────┬─────────────┐
│       │       │            │             │
▼       ▼       ▼            ▼             ▼
Search  Check   Prepare    Compare      Guide
Public  Eligibility Forms    Options    Multi-step
Info              Docs                   Process
        │       │       │            │             │
        └───────┼───────┴────────────┴─────────────┘
                ▼
        APPLICATION EXECUTION LAYER
        (Validation, Permissions, Execution)
                │
                ▼
        HUMAN-IN-THE-LOOP CONFIRMATION
        (User retains final control)
```

### What Becomes Possible

With WebMCP, users and AI agents can now:

1. **Explain in Natural Language**
   - "I need to renew my driver's license but don't know where to start"
   - "What government programs am I eligible for?"
   - "Help me understand this tax form"

2. **Get Intelligent Interpretation**
   - AI understands the citizen's need
   - Routes to appropriate government services
   - Identifies relevant information and procedures

3. **Receive Structured Next Steps**
   - Not just a text response
   - Actionable recommendations
   - Prepared forms or applications
   - Clear paths forward

4. **Execute with Confidence**
   - Human remains in control
   - All actions require explicit confirmation
   - AI assists throughout the workflow
   - Clear understanding of consequences

### Why This Matters

**Before WebMCP**: Citizens had to navigate government websites, translate complicated Thai bureaucracy, make sense of multiple documents, and hope they understood correctly.

**With WebMCP**: Citizens can have a conversation with an AI assistant that understands both their question and what the application can do. The AI can find relevant services, prepare information, and guide them through complex processes.

**What's New**: The same service works in two ways:
- **For People**: Browse, read, select, and confirm through an intuitive interface
- **For AI Agents**: Interact with structured tools that explicitly expose application capabilities

---

## 🏗️ Architecture

### Modular Design for Scalability

```
src/
├── models/                         # AI Processing Layer
│   ├── router/
│   │   └── LeadRouter.ts          # Intent routing & orchestration
│   ├── reasoning/
│   │   └── ReasoningEngine.ts      # Deep analysis & logic
│   ├── translation/
│   │   └── TranslationService.ts   # Thai/English & intent translation
│   ├── voice/
│   │   └── VoiceAnalyzer.ts        # Real-time voice processing
│   └── vision/
│       └── VisionProcessor.ts       # Document/form analysis
│
├── webmcp/                         # WebMCP Integration Layer
│   ├── tools/
│   │   ├── searchPublicInfoTool.ts      # Search government databases
│   │   ├── checkEligibilityTool.ts      # Check program eligibility
│   │   ├── preparationTool.ts           # Form & document preparation
│   │   ├── comparisonTool.ts            # Compare public options
│   │   └── guidanceToolTool.ts          # Multi-step process guidance
│   └── mcp-server.ts               # WebMCP server & tool registration
│
├── components/                     # UI Layer
│   ├── CitizenInterface.tsx        # Main citizen-facing interface
│   ├── ChatAssistant.tsx           # Floating AI assistant widget
│   ├── ServiceBrowser.tsx          # Information navigation
│   ├── FormHelper.tsx              # Guided form filling
│   └── ConfirmationPanel.tsx       # Human-in-the-loop confirmation
│
├── data/                           # Data Layer
│   ├── governmentServices/         # Thai government services database
│   ├── procedures/                 # Procedures & workflows
│   ├── forms/                      # Application forms
│   └── eligibilityRules/           # Eligibility criteria
│
└── services/                       # Service Layer
    ├── geminiService.ts            # Google Gemini API integration
    ├── toolExecutor.ts             # Structured tool execution
    ├── contextManager.ts           # Conversation context management
    └── actionValidator.ts          # Permission & validation checks
```

---

## 🔧 WebMCP Implementation

### Registered Tools for Citizens

#### 1. **Search Public Information Tool**
```typescript
{
  name: "search_public_information",
  description: "Search Thai government websites, public services info, procedures, and documents",
  inputSchema: {
    query: string,           // What citizen is looking for
    service_type: string,    // Type of service (education, health, license, etc.)
    language: "thai" | "english"
  },
  execute: async (input) => {
    // Search across government databases
    // Return relevant documents, procedures, links
  }
}
```

#### 2. **Check Eligibility Tool**
```typescript
{
  name: "check_eligibility",
  description: "Check if citizen is eligible for a government program or service",
  inputSchema: {
    program_id: string,
    citizen_profile: {
      age: number,
      income_level: string,
      employment_status: string,
      location: string,
      other_criteria: object
    }
  },
  execute: async (input) => {
    // Evaluate against eligibility rules
    // Return eligibility status + required documents
  }
}
```

#### 3. **Prepare Forms & Documents Tool**
```typescript
{
  name: "prepare_application",
  description: "Prepare and guide citizen through required forms and documents",
  inputSchema: {
    service_id: string,
    citizen_info: object,
    pre_fill_data: boolean
  },
  execute: async (input) => {
    // Generate required forms
    // Pre-fill available information
    // Return step-by-step guidance
  }
}
```

#### 4. **Compare Options Tool**
```typescript
{
  name: "compare_public_options",
  description: "Compare different government programs or services that fit citizen's needs",
  inputSchema: {
    category: string,        // Service category
    citizen_needs: string[], // What they're looking for
    criteria: string[]       // Comparison criteria
  },
  execute: async (input) => {
    // Compare available programs
    // Return comparison matrix + pros/cons
  }
}
```

#### 5. **Guidance Tool**
```typescript
{
  name: "guide_multi_step_process",
  description: "Guide citizen through complex multi-step government processes",
  inputSchema: {
    process_id: string,
    current_step: number,
    citizen_context: object
  },
  execute: async (input) => {
    // Return current step details
    // Explain what to do next
    // Prepare materials needed
    // Provide expected timeline
  }
}
```

### Human-in-the-Loop Design

All tools include confirmation checkpoints:

```typescript
// Example: AI suggests an action
const suggestedAction = {
  type: "submit_application",
  service: "Driver License Renewal",
  details: { /* pre-filled form */ },
  requires_confirmation: true
};

// Citizen sees it and can:
// ✓ Approve and proceed
// ✗ Reject and get alternatives
// ? Ask questions before confirming
// ⚙ Edit details before submitting
```

---

## 🎮 User Experience

### For Citizens

1. **Start Conversation**
   ```
   Citizen: "I need to renew my driver's license"
   ```

2. **Get Interpretation**
   - AI understands: License renewal + location + eligibility
   - Fetches relevant government procedures

3. **Receive Guidance**
   ```
   AI: "You're eligible! You'll need:
        - Current ID
        - Passport photo
        - Fee: ฿200
        - Takes 2-3 days
   
        Ready to start the application?"
   ```

4. **Take Action Together**
   - AI helps prepare required documents
   - Guides through application form
   - Confirms submission with citizen
   - Provides follow-up information

### For AI Agents (via WebMCP)

```typescript
// In ChatGPT with WebMCP enabled:

// 1. Search for relevant information
const info = await mcp.call("search_public_information", {
  query: "driver license renewal",
  service_type: "transportation"
});

// 2. Check eligibility
const eligible = await mcp.call("check_eligibility", {
  program_id: "license-renewal",
  citizen_profile: { /* from context */ }
});

// 3. Prepare application
const application = await mcp.call("prepare_application", {
  service_id: "license-renewal",
  citizen_info: { /* from context */ }
});

// 4. Guide through process
const guidance = await mcp.call("guide_multi_step_process", {
  process_id: "license-renewal",
  current_step: 1
});
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Gemini API key
- WebMCP enabled ChatGPT or compatible client

### Quick Start

```bash
# Clone repository
git clone https://github.com/pajakchaiinfinityth-svg/Thai-AI-for-Citizens.git
cd Thai-AI-for-Citizens

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Edit .env.local with:
# VITE_GOOGLE_GEMINI_API_KEY=your_gemini_key
# WEBMCP_SERVER_URL=http://localhost:3001

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel deploy
```

### Environment Variables

```env
# Google Gemini API
VITE_GOOGLE_GEMINI_API_KEY=your_key_here

# WebMCP Configuration
VITE_WEBMCP_SERVER=http://localhost:3001
VITE_WEBMCP_API_URL=http://localhost:3000/api

# Optional: Firebase for conversation history
VITE_FIREBASE_CONFIG={...}

# Government Data Sources
VITE_THAI_GOV_API_KEY=your_key
VITE_DATA_API_ENDPOINT=https://api.example.com
```

---

## 📦 Technology Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS + Motion
- **Backend**: Express.js + Node.js + SQLite3
- **AI Models**: Google Gemini (Reasoning, Translation, Vision, Voice)
- **WebMCP**: Web Model Context Protocol for ChatGPT integration
- **Build Tool**: Vite
- **Hosting**: Vercel (recommended) / Netlify / Cloudflare Pages
- **Real-time**: Motion animations for smooth UX

---

## 🎯 Key Features

### ✅ Citizen-Centric Design
- Simple, understandable interface
- Natural language interaction
- Guided workflows
- Human remains in control

### ✅ AI-Assisted Operations
- Intelligent query routing
- Automatic information retrieval
- Form preparation & guidance
- Multi-step process orchestration

### ✅ WebMCP Integration
- Structured tool definitions
- Explicit capability exposure
- Reliable agent interaction
- Clear execution behavior

### ✅ Scalable Architecture
- Modular component design
- Separated concerns (UI, AI, Data, Tools)
- Easy to add new services
- Support for future expansions

---

## 📊 Current Capabilities

- 🔍 **Search public information** across Thai government sources
- ✅ **Check eligibility** for government programs
- 📋 **Prepare applications** with guided forms
- 🔄 **Compare options** between different programs
- 📍 **Guide multi-step processes** with clear instructions
- 🗣️ **Multi-language support** (Thai & English)
- 🎙️ **Voice input & output** for accessibility
- 📱 **Mobile responsive** design
- 🔐 **Human-in-the-loop confirmation** for all actions

---

## 🔗 Live Demo

**Live URL**: [https://thai-ai-for-citizens.vercel.app](https://thai-ai-for-citizens.vercel.app)

Test with:
- ChatGPT's in-app browser
- Google Chrome with WebMCP enabled
- Direct browser access

---

## 📹 Demo Video

**YouTube**: [Thai AI for Citizens - WebMCP Hackathon Submission](https://youtube.com)

*Video demonstrates:*
- Citizen asking a question about public services
- AI understanding intent and routing to relevant service
- WebMCP tools retrieving real information
- Guided workflow through application
- Human confirmation of actions
- Multi-language support in action

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/NewCitizenService`)
3. Commit changes (`git commit -m 'Add new service support'`)
4. Push to branch (`git push origin feature/NewCitizenService`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Pakchaiing** - [@pajakchaiinfinityth-svg](https://github.com/pajakchaiinfinityth-svg)

---

## 🙏 Acknowledgments

- Google Gemini for AI capabilities
- WebMCP (Web Model Context Protocol) for agent integration
- Thai citizen communities for inspiration
- Hackathon organizers

---

## 📝 Design Philosophy

> "People should not have to learn how every digital service works. Instead, the service should be understandable to both people and AI agents, while keeping people in control of important decisions."

This project explores a new interaction model where:
- **Information is not the end goal** — Action is
- **Complexity is hidden** — Understanding is made clear
- **AI augments judgment** — Humans remain in control
- **Systems are transparent** — Citizens know what's happening and why

---

**Built with ❤️ to bridge the gap between Thai citizens and public services | Powered by WebMCP & Google Gemini**
