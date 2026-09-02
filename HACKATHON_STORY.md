## Inspiration

In Thailand, citizens often face a frustrating problem: **the gap between information and action**. Government services exist, procedures are documented, and eligibility criteria are defined—but citizens struggle to:

- 🔍 **Find the right service** across multiple fragmented government websites
- 📚 **Understand complex Thai bureaucratic language** in official procedures
- 🤔 **Determine their eligibility** without manual research
- 📋 **Prepare required documents** without confusion
- ⚡ **Take the next step** with clear guidance

We asked ourselves: **What if AI could do more than answer questions? What if AI could actually help citizens navigate services, prepare materials, and take action together with them?**

This question inspired Thai AI for Citizens—a human-centered AI application powered by WebMCP that bridges the information-action gap by combining citizen-facing interfaces with intelligent AI assistance.

---

## What it does

Thai AI for Citizens is a WebMCP-powered AI assistant application that helps Thai citizens navigate public information, understand government services, and take action. It works in two ways:

### **For Citizens (UI Interface)**
- 💬 **Chat with an AI advisor** about government services and procedures
- 🔍 **Search Thai public information** across multiple sources
- ✅ **Check eligibility** for government programs
- 📋 **Prepare application forms** with guidance
- 🔄 **Compare options** between different services
- 📍 **Get step-by-step guidance** through complex multi-step processes

### **For AI Agents (WebMCP Tools)**
ChatGPT and other AI agents can call 5 structured WebMCP tools:

1. **search_public_information** - Search Thai government databases
2. **check_eligibility** - Verify program eligibility  
3. **prepare_application** - Generate and guide through forms
4. **compare_public_options** - Compare available programs
5. **guide_multi_step_process** - Walk through complex procedures

### **The Key Innovation: Human-in-the-Loop Confirmation**
- 🤖 AI suggests actions based on citizen needs
- 👤 **Citizen reviews** the suggestion
- ✓ **Citizen confirms** before execution
- 🔄 Application processes with citizen approval
- 📍 AI provides follow-up guidance

This ensures humans remain in control while AI dramatically reduces friction and confusion.

---

## How we built it

### **Technology Stack**
- **AI Engine**: Google Gemini API (via Google AI Studio)
- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js + SQLite3
- **WebMCP**: Web Model Context Protocol for ChatGPT integration
- **Build Tool**: Vite
- **Hosting**: Vercel (recommended)

### **Architecture: Multi-Model Routing System**

```
User Input
    ↓
[Router / Lead Model] → Analyzes intent & routes to appropriate handler
    ↓
┌─────────────────────────────────────────────┐
│                                             │
├─→ Reasoning Model (deep analysis)           │
├─→ Translation Model (Thai ↔ English)        │
├─→ Voice Model (voice input/output)          │
└─→ Vision Model (document analysis)          │
│                                             │
└─────────────────────────────────────────────┘
    ↓
[WebMCP Tool Invocation] → Structured API calls
    ↓
┌─────────────────────────────────────────────┐
│ search_public_information                   │
│ check_eligibility                           │
│ prepare_application                         │
│ compare_public_options                      │
│ guide_multi_step_process                    │
└─────────────────────────────────────────────┘
    ↓
[Application Layer] → Execute with validation
    ↓
[Human Confirmation] → Citizen approves action
    ↓
[Final Response] → AI provides guidance
```

### **Modular Component Structure**

```
src/
├── models/
│   ├── router/LeadRouter.ts           # Intent routing
│   ├── reasoning/ReasoningEngine.ts    # Deep analysis (Gemini)
│   ├── translation/TranslationService.ts # Thai↔English (Gemini)
│   ├── voice/VoiceAnalyzer.ts         # Voice processing (Gemini)
│   └── vision/VisionProcessor.ts      # Document analysis (Gemini)
├── webmcp/
│   ├── tools/
│   │   ├── searchPublicInfoTool.ts
│   │   ├── checkEligibilityTool.ts
│   │   ├── preparationTool.ts
│   │   ├── comparisonTool.ts
│   │   └── guidanceTool.ts
│   └── mcp-server.ts                  # Tool registration
├── components/
│   ├── CitizenInterface.tsx
│   ├── ChatAssistant.tsx
│   ├── ServiceBrowser.tsx
│   ├── FormHelper.tsx
│   └── ConfirmationPanel.tsx
├── data/
│   ├── governmentServices/
│   ├── procedures/
│   ├── forms/
│   └── eligibilityRules/
└── services/
    ├── geminiService.ts               # Gemini API wrapper
    ├── toolExecutor.ts
    ├── contextManager.ts
    └── actionValidator.ts
```

### **WebMCP Implementation (Imperative Approach)**

We registered 5 core tools using WebMCP's imperative pattern:

```typescript
// Example: search_public_information tool
document.modelContext.registerTool({
  name: "search_public_information",
  description: "Search Thai government services and public information",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
      service_type: { type: "string", enum: ["education", "health", "licensing", "etc"] },
      language: { type: "string", enum: ["thai", "english"] }
    },
    required: ["query"]
  },
  execute: async (input) => {
    return await searchGovernmentDatabases(input);
  }
});
```

### **Google Gemini Integration**

We integrated Google Gemini to power:
- 🧠 **Reasoning**: Deep analysis of citizen needs and procedures
- 🌍 **Translation**: Thai ↔ English with intent understanding
- 🎙️ **Voice**: Real-time voice input and output
- 👁️ **Vision**: Document and form analysis

```typescript
// Gemini service wrapper
class GeminiService {
  async processRequest(prompt: string, tools: WebMCPTool[]) {
    const model = this.client.getGenerativeModel({
      model: "gemini-pro",
      tools: this.convertToolsToGeminiFormat(tools)
    });
    return await model.generateContent(prompt);
  }
}
```

### **Human-in-the-Loop Confirmation**

Every action requires citizen approval:

```typescript
async function executeToolWithConfirmation(tool, input) {
  // 1. AI suggests action
  const suggestion = await generateSuggestion(tool, input);
  
  // 2. Present for confirmation
  const confirmed = await presentForConfirmation(suggestion);
  
  // 3. Only execute if approved
  if (confirmed) {
    return await tool.execute(input);
  } else {
    return await generateAlternatives(tool, input);
  }
}
```

---

## Challenges we ran into

### **1. Bridging Information and Action**
**Challenge**: Traditional chatbots can answer questions but can't take structured action with verification.

**Solution**: Implemented WebMCP to expose application capabilities as structured tools that AI agents can reliably call.

### **2. Thai Language Complexity**
**Challenge**: Thai bureaucratic language is formal, contains abbreviations, and uses complex structures that generic models struggle with.

**Solution**: Used Google Gemini's strong Thai language support + custom prompts optimized for Thai government procedures + translation model for clarification.

### **3. Multi-Model Routing**
**Challenge**: Different citizen questions require different models (reasoning for analysis, translation for language barriers, vision for documents, voice for accessibility).

**Solution**: Implemented intelligent router that analyzes user intent and routes to appropriate model handler automatically.

### **4. Maintaining Human Control**
**Challenge**: AI systems can suggest actions, but we needed to ensure citizens stayed in control of important decisions.

**Solution**: Implemented human-in-the-loop confirmation pattern where:
- AI makes suggestion
- Citizen reviews
- Citizen approves/rejects
- Only then does application execute

### **5. Context Management**
**Challenge**: Multi-turn conversations with complex government procedures require maintaining context across model invocations.

**Solution**: Built context manager that maintains conversation state, tool execution history, and citizen profile information across multiple WebMCP tool calls.

### **6. Tool Definition Clarity**
**Challenge**: Defining WebMCP tools that are neither too restrictive nor too permissive.

**Solution**: Designed tools with clear, specific purposes (e.g., `check_eligibility` only validates, doesn't commit; `prepare_application` generates forms, doesn't submit).

---

## Accomplishments that we're proud of

### **🏆 Core Innovation**
✅ **First implementation of WebMCP for Thai public services** - Combining human-centered design with AI agent capabilities

✅ **True Human-in-the-Loop System** - Citizens remain in control while benefiting from AI assistance

✅ **Multi-Model Architecture** - Single application leveraging multiple AI capabilities (reasoning, translation, voice, vision)

### **🎯 Technical Achievements**
✅ **Seamless Gemini Integration** - Gemini API works transparently with WebMCP tools

✅ **Modular Design** - Components separated (UI, AI, data, tools) for easy expansion

✅ **Intelligent Routing** - Automatic routing to appropriate model based on user intent

✅ **Scalable Tool System** - Can add new WebMCP tools without redesigning application

### **🌟 UX Accomplishments**
✅ **Floating Widget** - Non-intrusive, always-accessible AI advisor

✅ **Two Access Methods** - Same services via UI browsing or AI agent interaction

✅ **Natural Language Interaction** - Citizens ask in Thai, get help naturally

✅ **Clear Confirmation Flow** - Citizens see exactly what AI will do before it happens

### **🚀 Launch Readiness**
✅ **Comprehensive Documentation** - README, PROJECT_DETAILS, architecture diagrams

✅ **Open Source** - MIT License, public GitHub repository

✅ **Production-Ready Stack** - React, Express, TypeScript, Vite, Vercel deployment

✅ **WebMCP Compliance** - Follows WebMCP imperative tool registration pattern

---

## What we learned

### **About WebMCP**
- WebMCP is more than just tool calling—it's a protocol that formalizes the boundary between what AI can suggest and what applications can execute
- Explicit tool definitions with clear schemas make AI interactions significantly more reliable
- The imperative approach (registering tools directly) is cleaner than declarative for action-oriented applications

### **About Thai Government Services**
- Thai citizens need more than information—they need guided workflows
- Procedures are often complex with multiple eligibility criteria
- Pre-filling forms and preparing documents massively reduces citizen friction
- Thai language nuances (formal vs informal, abbreviations) require specialized handling

### **About Human-AI Collaboration**
- Confirmation checkpoints are essential—citizens want to understand what AI will do
- Different users need different interaction modes (text, voice, visual)
- Context preservation across multiple AI model invocations is complex but achievable
- Transparency builds trust—show citizens the reasoning, not just the recommendation

### **About AI Integration**
- Google Gemini's multi-modal capabilities (text, voice, vision) are powerful but require careful orchestration
- Routing logic to appropriate models prevents "wrong tool" problems
- Conversation context management is the biggest implementation complexity
- Tool schemas should be as specific as possible to prevent hallucinations

### **About Product Design**
- The "information-action gap" is a real usability problem
- Combining UI browsing + AI agents serves different user needs
- Citizens appreciate clear boundaries on what AI can/cannot do
- Multi-language support (Thai/English) is important but complex

---

## What's next for Thai AI for Citizens

### **Short-term (Next 3 months)**
- 🔗 **Government API Integration** - Connect to real Thai government data sources
- 📱 **Mobile App** - iOS/Android native apps for better accessibility
- 🎓 **Expand Services** - Add education, healthcare, housing, employment services
- 🔊 **Voice Enhancement** - Improve real-time voice interaction quality
- 🌍 **Additional Languages** - Support Khmer, Lao, Burmese communities

### **Medium-term (6-12 months)**
- 🏛️ **Government Integration** - Partner with Thai government agencies
- 📊 **Analytics Dashboard** - Help governments understand citizen needs
- 🤖 **Agent Ecosystem** - Support third-party agents beyond ChatGPT
- 📲 **SMS/WhatsApp Bots** - Reach citizens without smartphones
- 🔐 **Advanced Security** - Government-grade authentication (Digital ID)

### **Long-term Vision (1-2 years)**
- **Network Effect** - Multiple government agencies using same platform
- **AI Training** - Custom models trained on Thai government data
- **Accessibility First** - Service for elderly, rural, disabled citizens
- **Community Feedback** - Ratings and reviews help improve services
- **Policy Insights** - Anonymous aggregation to improve government programs

### **Research Directions**
- Exploring WebMCP beyond public services (healthcare, education, business)
- Advanced multi-model orchestration patterns
- Federated learning for sensitive government data
- Cultural adaptation of AI for different Thai communities

### **Success Metrics**
We'll measure success by:
- ✅ Number of citizens served
- ✅ Reduction in time to complete procedures
- ✅ Improvement in citizen satisfaction
- ✅ Decrease in government service inquiries (self-service)
- ✅ Accessibility metrics (voice, mobile, multiple languages)

---

**Our ultimate goal**: Build a new paradigm where digital government services are designed for both humans and AI agents, where citizens don't have to learn how each service works, and where the leap from information to action becomes natural and empowering.

*Thai citizens deserve better. AI can help make it happen.*
