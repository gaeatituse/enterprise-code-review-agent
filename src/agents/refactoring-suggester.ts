import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts/refactoring-suggester.prompt';

export const refactoringSuggester: AgentDefinition = {
  description:
    'Analyzes changed code and proposes practical refactoring opportunities that improve readability, maintainability, structure, and modernization.',
  prompt:
  REFACTORING_SUGGESTER_PROMPT,
  model: 'inherit',
  tools: [
    'Read',
    'Grep',
    'Glob',
    'Skill',
  ],
};
