# GRAM-X AI & OCR Architecture

## 1. Provider-Agnostic Abstraction
The AI subsystem (`src/services/ai/`) operates behind a standard adapter interface (`AIServiceAdapter`), enabling seamless swapping between providers:
- **Serverless LLM Adapter**: Dispatches requests to Supabase Edge Functions holding private LLM keys (Gemini, Groq, OpenRouter).
- **Rule-Based Fallback Adapter**: Deterministic local heuristics ensuring 100% platform uptime even if external AI APIs are offline or rate-limited.

## 2. Core Capabilities
- **Grievance Classification & Routing**: Suggests category (`water`, `electricity`, `roads`, `sanitation`, `infrastructure`) and priority based on complaint text.
- **Duplicate & Similar Grievance Detection**: Computes similarity scores against active grievances to prevent redundant field work.
- **OCR Document Processing**: Extracts legible text and reference numbers from uploaded meter receipts, notices, or written complaints.

## 3. Governance & Human-in-the-Loop Rules
- AI recommendations are strictly advisory and highlighted with clear badges.
- Officials and citizens can override AI category and priority suggestions at any time.
- AI never executes destructive operations, role promotions, or automatic complaint rejections.
