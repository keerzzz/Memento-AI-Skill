# Research: AgentSkill Formats & Personal Distillation Best Practices

## 1. Overview of the Ecosystem
In the current landscape of LLM agents and digital twins (e.g., OpenAI Custom GPTs, AutoGen, Character.ai, MindOS, and open-source AgentSkills frameworks), a "Skill" or "Persona" is typically defined using a declarative manifest file (usually JSON or YAML). This allows the persona to be portable, version-controlled, and easily injected into different LLM backends.

For "Personal Distillation" (creating a digital twin of a deceased loved one), the format needs to prioritize **Identity (System Prompt)** and **Memory (Knowledge Base)** over complex functional tools.

## 2. Common Structural Components

Based on industry standards, a robust Skill/Persona manifest consists of four main pillars:

### A. Metadata (Manifest)
Identifies the skill and its compatibility.
*   `manifest_version`: Ensures compatibility with the parser (e.g., "2.0").
*   `skill_id`: A unique identifier (e.g., `memento_persona_grandpa`).
*   `name`: Human-readable name.
*   `type`: Categorizes the skill. Common types are `persona` (roleplay/identity), `tool` (functional script), or `workflow` (multi-agent orchestration).
*   `backend`: The preferred or required LLM backend (e.g., `gemini`, `gpt-4`).

### B. Instructions (The Persona Core)
This is the output of our distillation process.
*   `instructions`: The raw System Prompt. 
    *   *Best Practice:* Use structured Markdown within the string (e.g., `[Identity]`, `[Tone]`, `[Constraints]`).
    *   *Constraint Enforcement:* For digital twins, the "Unknown Event Handling" (cognitive boundary) must be explicitly defined here to prevent hallucinations.

### C. Knowledge Base (Memory / RAG)
Defines the static or dynamic memory the agent can access.
*   `knowledge_base`: Typically an array of objects.
    *   *Format 1 (Local Files):* `{"type": "file", "path": "./data/grandpa_letters.pdf"}`
    *   *Format 2 (Vector DB):* `{"type": "chromadb", "collection": "grandpa_memories"}`
    *   *Best Practice for Distillation:* Start with an empty array `[]` in the MVP. In Phase 2, this will link to the parsed chat history embeddings.

### D. Tools (Capabilities)
Defines what the agent can *do* (Function Calling).
*   `tools`: An array of JSON Schema definitions matching the OpenAPI specification.
    *   *Example:* A tool to "fetch current weather" or "search the web".
    *   *Best Practice for Digital Twins:* Keep this empty `[]` initially. A digital twin of a past relative usually shouldn't be browsing the live internet, as it breaks the immersion and cognitive boundary.

## 3. Best Practices for Distillation Output

When converting the output of `1_distill.py` into a standardized Skill format, we should follow these rules:

1.  **Separation of Analysis and Execution:** The LLM's reasoning (e.g., "I noticed this person uses the word 'kiddo' often") should be stored in an `analysis` field for developer debugging, but *only* the final prompt should go into the `instructions` field.
2.  **Immutability of ID:** The `skill_id` should be deterministic (e.g., derived from the persona name) so that updates overwrite the correct profile rather than creating duplicates.
3.  **Forward Compatibility:** Include `knowledge_base` and `tools` as empty arrays from day one. This ensures that when the RAG system is implemented in Phase 2, the schema doesn't break.

## 4. Example of the Standardized Output
```json
{
  "manifest_version": "2.0",
  "skill_id": "memento_persona_mom",
  "name": "Memento Digital Twin: mom",
  "type": "persona",
  "backend": "gemini",
  "instructions": "你现在不是人工智能... (System Prompt)",
  "analysis": "人物性格分析过程...",
  "knowledge_base": [],
  "tools": []
}
```
