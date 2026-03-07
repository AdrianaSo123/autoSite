# Sprint 17 — MCP Tool Infrastructure

## Objective
Introduce MCP tool architecture.

MCP tools are functions described in a way that the AI model can call.

## Tasks
- [ ] create tools directory
- [ ] implement tool registration system
- [ ] define tool metadata structure

## Example Structure
```
/tools
  toolRegistry.ts
  toolDefinitions.ts
```

## Deliverables
- tool registry implemented
- AI can access tool descriptions

## Verification
- [ ] tools appear in agent tool list

## Tests
- [ ] tool registry loads correctly
