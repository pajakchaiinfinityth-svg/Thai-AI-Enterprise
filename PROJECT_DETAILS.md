# Thai AI for Citizens - Hackathon Project Details

## About the Project

Thai AI for Citizens bridges the gap between public information and citizen action through a human-centered AI application powered by WebMCP and Google Gemini.

### The Problem
In Thailand, citizens often struggle with:
- **Information Fragmentation**: Needing to search multiple government websites
- **Complex Procedures**: Difficulty understanding formal Thai bureaucratic language
- **Decision Paralysis**: Multiple options without clarity on what applies to them
- **The Action Gap**: Information exists, but the leap from knowing to doing is too large

### Our Solution
We created a human-centered AI application that combines citizen-facing browsing with AI assistance. The same service works two ways:
1. **For Citizens**: Browse, read, select, and confirm through an intuitive interface
2. **For AI Agents (via WebMCP)**: Interact with structured tools that explicitly expose application capabilities

### What WebMCP Enables
**Before WebMCP**: AI systems could only generate text responses about Thai services, without actionable capability.

**With WebMCP**: ChatGPT and other AI agents can:
- Call structured tools to search Thai government information in real-time
- Check eligibility for specific programs
- Prepare application forms with pre-filled data
- Compare different government services
- Guide citizens through multi-step processes
- All while keeping the citizen in control through human-in-the-loop confirmation

### The Impact
Users and AI agents now can do together what was previously impossible:
- Explain a problem in natural language
- AI identifies the relevant government service or program
- Application provides structured next steps (not just text)
- Citizen reviews, approves, and executes the recommendation
- AI provides guidance throughout the entire workflow

---

## Built With

### Technology Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS + Motion UI
- **Backend**: Express.js + Node.js + SQLite3 (better-sqlite3)
- **AI Engine**: **Google Gemini API** (via Google AI Studio)
- **WebMCP Integration**: Web Model Context Protocol for ChatGPT/AI agent capabilities
- **Build Tool**: Vite
- **Hosting**: Vercel (recommended)
- **Real-time Features**: Motion animations, WebSocket support (future)
- **Database**: Firebase (optional, for conversation history)

### AI Capabilities (via Google Gemini)
- 🧠 **Reasoning Model**: Deep analysis of business/citizen needs
- 🌍 **Translation Model**: Thai ↔ English, intent understanding
- 🎙️ **Voice Model**: Real-time voice input/output processing
- 👁️ **Vision Model**: Document and form analysis
- 🎯 **Routing Model**: Intelligent request routing to appropriate handlers

### WebMCP Tools (5 Core Tools)
1. **search_public_information** - Search Thai government databases
2. **check_eligibility** - Verify program eligibility
3. **prepare_application** - Generate forms and guidance
4. **compare_public_options** - Compare available programs
5. **guide_multi_step_process** - Walk through complex procedures

---

## Why WebMCP?

### The Right Fit
- **Problem Alignment**: Thai citizens need AI that understands both their question AND what government services can actually do
- **Structured Action**: WebMCP allows our app to expose capabilities as structured tools, not just text endpoints
- **Reliability**: Tools with defined names, descriptions, inputs, and execution behavior are more reliable than AI imitating clicks
- **Transparency**: Citizens can see exactly what the AI is allowed to do

### Better User Experience
- **Two Access Methods**: Same service for browsing and AI interaction
- **Clearer Intent**: AI understands citizen needs through conversation
- **Reduced Friction**: AI can prepare materials, forms, and recommendations
- **Human Control**: Citizens approve all important actions
- **Explicit Boundaries**: Clear understanding of what actions are allowed and why

### What's New
Previously, AI chatbots could only answer questions. Now:
- ✅ AI agents can actually help citizens navigate complex procedures
- ✅ Information + Action = Actual progress
- ✅ Multi-step workflows become manageable
- ✅ Thai bureaucracy becomes understandable

---

## Project Architecture

### Multi-Model Routing System
```
User Request
    ↓
Router Model (Intent Analysis)
    ↓
┌───────────────────────────────────────────┐
│                                           │
Reasoning → Translation → Voice → Vision
│                                           │
└───────────────────────────────────────────┘
    ↓
WebMCP Tool Invocation
    ↓
┌───────────────────────────────────────────┐
│ search_public_info | check_eligibility  │
│ prepare_application | compare_options    │
│ guide_multi_step_process                 │
└───────────────────────────────────────────┘
    ↓
Application Execution Layer
    ↓
Human-in-the-Loop Confirmation
    ↓
Final Response & Guidance
```

### Modular Component Structure
```
src/
├── models/                    # AI Processing (Gemini-powered)
│   ├── router/               # Intent routing
│   ├── reasoning/            # Deep analysis
│   ├── translation/          # Thai ↔ English
│   ├── voice/                # Voice processing
│   └── vision/               # Document analysis
├── webmcp/                    # WebMCP Integration
│   ├── tools/                # Tool implementations
│   └── mcp-server.ts         # Tool registration
├── components/               # UI Layer
│   ├── CitizenInterface.tsx
│   ├── ChatAssistant.tsx
│   └── ConfirmationPanel.tsx
├── data/                      # Thai Government Services Data
│   ├── governmentServices/
│   ├── procedures/
│   ├── forms/
│   └── eligibilityRules/
└── services/
    ├── geminiService.ts      # Gemini API integration
    ├── toolExecutor.ts
    ├── contextManager.ts
    └── actionValidator.ts
```

---

## How We Implemented WebMCP

### 1. Google Gemini Integration
```typescript
// src/services/geminiService.ts
import { GoogleGenerativeAI } from "@google/genai";

class GeminiService {
  private client: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }
  
  async processRequest(prompt: string, tools: WebMCPTool[]) {
    const model = this.client.getGenerativeModel({
      model: "gemini-pro",
      tools: this.convertToolsToGeminiFormat(tools)
    });
    
    return await model.generateContent(prompt);
  }
}
```

### 2. WebMCP Tool Registration (Imperative Approach)
```typescript
// src/webmcp/tools/searchPublicInfoTool.ts
document.modelContext.registerTool({
  name: "search_public_information",
  description: "Search Thai government services, procedures, and public information",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      service_type: { type: "string", enum: ["education", "health", "licensing", "etc"] },
      language: { type: "string", enum: ["thai", "english"] }
    },
    required: ["query"]
  },
  execute: async (input) => {
    return await searchGovernmentDatabases(input);
  }
});

document.modelContext.registerTool({
  name: "check_eligibility",
  description: "Check if citizen is eligible for a government program",
  inputSchema: {
    type: "object",
    properties: {
      program_id: { type: "string" },
      citizen_profile: { type: "object" }
    },
    required: ["program_id"]
  },
  execute: async (input) => {
    return await evaluateEligibility(input);
  }
});

// ... Similar registration for other tools
```

### 3. Human-in-the-Loop Execution
```typescript
// src/services/toolExecutor.ts
async function executeToolWithConfirmation(tool: Tool, input: object) {
  // 1. AI suggests action
  const suggestion = await generateSuggestion(tool, input);
  
  // 2. Present to citizen
  const confirmed = await presentForConfirmation(suggestion);
  
  // 3. Only execute if approved
  if (confirmed) {
    return await tool.execute(input);
  } else {
    return await generateAlternatives(tool, input);
  }
}
```

### 4. Routing to Appropriate Models
```typescript
// src/models/router/LeadRouter.ts
async function routeRequest(userInput: string) {
  const intent = await analyzeIntent(userInput);
  
  switch(intent.type) {
    case "complex_analysis":
      return await reasoningModel.process(userInput);
    case "language_barrier":
      return await translationModel.process(userInput);
    case "form_filling":
      return await prepareApplicationTool(userInput);
    case "multi_step_process":
      return await guidanceTool.process(userInput);
    case "document_analysis":
      return await visionModel.analyze(userInput);
    default:
      return await defaultHandler(userInput);
  }
}
```

---

## Why Google Gemini?

### Advantages for This Use Case
- ✅ **Strong Thai Language Support**: Excellent understanding of Thai language nuances
- ✅ **Multi-Modal Capabilities**: Text, voice, vision in one model
- ✅ **Reasoning Models**: Deep analysis of complex government procedures
- ✅ **Free Tier**: Good for hackathon/development phase
- ✅ **Fast Integration**: Google AI Studio for quick setup
- ✅ **Flexible API**: Works seamlessly with WebMCP tool calling

### Integration Benefits
- Gemini's tool-calling capabilities align perfectly with WebMCP
- Context management is seamless
- Real-time processing for voice and vision
- Easy to add more models as needs scale

---

## Demo & Testing

### Try It Out
1. **Live URL**: https://thai-ai-for-citizens.vercel.app
2. **Test with ChatGPT**: 
   - Enable WebMCP in ChatGPT settings
   - Paste the live URL
   - Start asking about Thai government services
3. **Direct Testing**:
   - Open application in browser
   - Use floating chat widget
   - Ask questions about Thai public services

### Example Interactions

**User**: "I need to renew my driver's license but I'm not sure what I need"

**AI Flow**:
1. Router → Reasoning Model (understands the need)
2. Search Tool → Finds license renewal procedures
3. Check Eligibility Tool → Verifies citizen qualifications
4. Prepare Application Tool → Generates required documents checklist
5. Confirmation → Citizen reviews and approves
6. Guidance Tool → Provides step-by-step instructions

---

## Impact & Future Vision

### Current Scope
- Search Thai government services
- Check eligibility for programs
- Prepare application forms
- Compare public options
- Guide through multi-step processes

### Future Expansion
- Integration with actual government APIs
- More government services (education, health, tax, housing)
- Offline capability
- Advanced accessibility features
- Community feedback system
- Multi-language support beyond Thai/English

### Long-term Goal
Explore a new interaction model for Thai public-facing digital services where:
- **Information is not the end goal** — Action is
- **Complexity is hidden** — Understanding is made clear
- **AI augments judgment** — Humans remain in control
- **Systems are transparent** — Citizens know what's happening and why

---

## Key Innovation: Information → Action Pipeline

### The Breakthrough
Traditional government websites present information but stop there. Citizens must:
- Understand the procedure
- Gather documents
- Fill out forms
- Submit applications

**With Thai AI for Citizens + WebMCP**, the process becomes:
- Ask a question in natural language
- AI understands AND TAKES ACTION
- AI prepares materials
- Citizen confirms
- AI guides through execution

This is what WebMCP makes possible: **Bridging the Information-Action Gap**.

---

*Built with ❤️ for Thai citizens | Powered by WebMCP & Google Gemini*
