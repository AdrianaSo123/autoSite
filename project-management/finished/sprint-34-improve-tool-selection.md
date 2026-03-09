# Sprint 34 — Improve Agent Tool Selection

## Objective
Improve reliability of tool execution with hybrid selection.

## Tasks
1. Implement hybrid tool selection:
   - Keyword detection (primary)
   - LLM fallback tool selection
2. Flow: User message → keyword detection → tool match → execute
3. If no keyword match: User message → LLM tool selection → execute tool
4. Extend keyword coverage for better matching

## Verification
- Tools trigger reliably for natural language queries
- Keyword detection catches common patterns
- LLM fallback handles ambiguous requests
