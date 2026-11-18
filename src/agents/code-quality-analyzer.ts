import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts/code-quality-analyzer.prompt';

export const codeQualityAnalyzer: AgentDefinition = {
  description:
    'Analyzes changed code for security, performance, maintainability, bugs, code quality, and JavaScript/TypeScript best practices.',
  prompt: CODE_QUALITY_ANALYZER_PROMPT,
  model: 'inherit',
  tools: [
    'Read',
    'Grep',
    'Glob',
    'Skill',
  ],
};
