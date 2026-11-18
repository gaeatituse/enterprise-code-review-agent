import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts/test-coverage-analyzer.prompt';

export const testCoverageAnalyzer: AgentDefinition = {
  description:
    'Analyzes changed code and existing tests to identify missing coverage, untested paths, branches, functions, classes, and edge cases.',
  prompt: TEST_COVERAGE_ANALYZER_PROMPT,
  model: 'inherit',
  tools: [
    'Read',
    'Grep',
    'Glob',
    'Skill',
  ],
};
