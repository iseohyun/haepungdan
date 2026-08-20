---
description: Rules for structuring AI agent responses, clarifying ambiguities, language conventions, and action logging.
---

# Agent Response & Communication Directives

## 1. Clarification of Ambiguity & Omissions
- **ALWAYS ask and clarify before implementing** whenever user requests contain ambiguous requirements, underspecified details, or suspected omissions.
- *Rationale*: Human users cannot always convey their full design intent perfectly in initial prompts; proactive clarification ensures alignment with the user's actual intent.

## 2. Language & Communication Style
- **Default Language**: Respond in clear, polite, and technical **Korean (한국어)** unless the user explicitly requests another language.
- **Clarity & Transparency**: Explain architectural decisions, trade-offs, and file changes clearly with file links.

## 3. Auto-Accepted Actions Summary
- Append `### 📋 Auto-Accepted Actions` at the very end of **every response**.
- List all tool invocations performed during the turn, or write `- 없음` if no tools were called.
