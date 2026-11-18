import { query } from '@anthropic-ai/claude-agent-sdk';
import {
  ReviewReport,
  ReviewReportSchema,
  ReviewReportJSONSchema,
} from './types/report-types';
import { mcpServersConfig } from './config/mcp.config';
import {
  codeQualityAnalyzer,
  testCoverageAnalyzer,
  refactoringSuggester,
} from './agents';
import { buildOrchestratorPrompt } from './prompts';

export interface OrchestratorOptions {
  maxTurns?: number;
}

export class CodeReviewOrchestrator {
  private readonly maxTurns: number;

  constructor(options: OrchestratorOptions = {}) {
    this.maxTurns = options.maxTurns ?? 30;
}

 async reviewPullRequest(
   owner: string,
   repo: string,
   prNumber: number
 ): Promise<ReviewReport> {
   const model = process.env.ANTHROPIC_MODEL;

  if (!model) {
    throw new Error(
      'ANTHROPIC_MODEL environment variable is required.'
    );
  }

  if (!owner || !repo) {
    throw new Error('Repository owner and repository name are required.');
  }

  if (!Number.isInteger(prNumber) || prNumber <=0) {
    throw new Error('Pull request number must be a positive integer.');
  }

  const prompt = buildOrchestratorPrompt(owner, repo, prNumber);

let structuredOutput: unknown;

const stream = query({
  prompt,
  options: {
    model,
    maxTurns: this.maxTurns,

   mcpServers: mcpServersConfig,

   allowedTools: [
     'Task',
     'Skill',
     'mcp__github__*',
     'mcp__eslint__*',
   ],

   agents: {
     'code-quality-analyzer': codeQualityAnalyzer,
     'test-coverage-analyzer': testCoverageAnalyzer,
     'refactoring-suggester': refactoringSuggester,
   },

   outputFormat: {
     type: 'json_schema',
     schema: ReviewReportJSONSchema,
   },
  },
 });

for await (const message of stream) {
  if (
    message.type === 'result' &&
    message.subtype === 'success'
  )  {
     structuredOutput = message.structured_output;
 }
}

if (structuredOutput === undefined) {
  throw new Error(
    'Claude Agent SDK completed without structured review output.'
  );
}

const validation = ReviewReportSchema.safeParse(structuredOutput);

if (!validation.success) {
  const details = validation.error.issues
    .map(
      (issue) =>
        `${issue.path.join('.') || 'root'}: ${issue.message}`
)
 .join('; ');

   throw new Error(
     `Review report failed schema validation: ${details}`
  );
}

return validation.data;

}

}
