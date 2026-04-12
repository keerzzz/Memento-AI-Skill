# Cultural Schema Packs Contribution Guide

Welcome to the Memento-AI-Skill internationalization (i18n) project! 

To make this project truly universal, we rely on the community to provide **Cultural Schema Packs**. These packs help the AI understand the unique historical contexts, family values, and communication styles of different cultures, solving the "cold start" problem for users worldwide.

## Repository Structure

Cultural schemas are stored in the `templates/` directory, organized by locale code:

```text
/templates
  /universal.json          <- Core human dimensions (Do not modify without discussion)
  /zh-CN/                  <- Chinese (Simplified)
    elders.json            <- Schema for elders
    peers.json             <- Schema for peers/friends
  /en-US/                  <- English (US)
    elders.json
  /es-ES/                  <- Spanish (Spain)
    ...
```

## How to Contribute a New Cultural Pack

1. **Fork the repository** and create a new branch (e.g., `add-jp-jp-elders`).
2. **Create the locale folder** if it doesn't exist (e.g., `templates/jp-JP/`).
3. **Create the JSON file** (e.g., `elders.json`).
4. **Follow the Schema Structure**:

Your JSON file must include the following keys:

```json
{
  "version": "1.0",
  "culture": "Locale Code (e.g., jp-JP)",
  "target": "Target demographic (e.g., elders, peers)",
  "description": "Brief description of this pack",
  "cultural_specifics": {
    "historical_context": [
      "List 3-4 major historical events this generation experienced"
    ],
    "family_values": [
      "List 3-4 core family values specific to this culture"
    ],
    "traditional_festivals": [
      "List 2-3 important festivals and how they are celebrated"
    ],
    "communication_style": [
      "List 2-3 unique ways this culture expresses love, anger, or concern"
    ]
  }
}
```

5. **Submit a Pull Request (PR)** with a brief explanation of the cultural nuances you've captured.

## The "Emotional Vector" Standard
By adhering to this JSON structure, we ensure a unified **Emotional Vector**. Regardless of the language or culture, the distillation engine (`1_distill.py`) can parse these files and inject them into the LLM prompt, ensuring the generated `.skill` file is universally compatible with our chat engine.
