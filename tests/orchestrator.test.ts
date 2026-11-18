import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { query } from '@anthropic-ai/claude-agent-sdk';
import { CodeReviewOrchestrator } from '../src/orchestrator.js';
import { ReviewReportSchema } from '../src/types/report-types.js';

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: vi.fn(),
}));

const mockedQuery = vi.mocked(query);

function createResultStream(
  structuredOutput:unknown): ReturnType<typeof query> {
    const stream = (async function* () {
      yield {
        type: 'result',
        subtype: 'success',
        structured_output:
        structuredOutput,
      };
    })();
    return stream as unknown as ReturnType<typeof query>;
  }

  function loadValidReport(): unknown{
    const reportPath = resolve(
      process.cwd(),
      'reports/udacity_cd14715-simple-todo-app_1.json'
    );

    return JSON.parse(
      readFileSync(reportPath,'utf8')
    ) as unknown;
  }

    describe('CodeReviewOrchestrator', () =>
    {
      const originalModel = process.env.ANTHROPIC_MODEL;

      beforeEach(() => {
        process.env.ANTHROPIC_MODEL = 'test-model';
        mockedQuery.mockReset();
      });

      afterEach(() => {
        if (originalModel === undefined) {
          delete process.env.ANTHROPIC_MODEL;
        } else {
          process.env.ANTHROPIC_MODEL = originalModel;
        }
      });

      describe('Configuration',() => {
        it('should intialize with default options',async () => {
          const validReport = loadValidReport();

          mockedQuery.mockReturnValue(createResultStream(validReport));
          
          const orchestrator = new CodeReviewOrchestrator();

          await orchestrator.reviewPullRequest(
            'udacity',
            'cd14715-simple-todo-app',
            1
          );

          expect(mockedQuery).toHaveBeenCalledOnce();

          const call = mockedQuery.mock.calls[0]?.[0];

          expect(call?.options?.maxTurns).toBe(30);

          expect(call?.options?.model).toBe('test-model');
        });

        it('should accept custom maxTurns', async () => {
          mockedQuery.mockReturnValue(
            createResultStream(loadValidReport())
          );

          const orchestrator = new CodeReviewOrchestrator({
            maxTurns: 50,
          });

          await orchestrator.reviewPullRequest(
            'udacity',
            'cd14715-simple-todo-app',
            1
          );

          const call = mockedQuery.mock.calls[0]?.[0];

          expect(call?.options?.maxTurns).toBe(50);
        });
      });

      describe('reviewPullRequest', () => {
        it('should configure MCP servers', async () => {
          mockedQuery.mockReturnValue(
            createResultStream(loadValidReport())
          );

          const orchestrator = new CodeReviewOrchestrator();

          await orchestrator.reviewPullRequest(
            'udacity',
            'cd14715-simple-todo-app',
            1
          );

          const call = mockedQuery.mock.calls[0]?.[0];

          expect(call?.options?.mcpServers).toBeDefined();
          expect(call?.options?.mcpServers).toHaveProperty('github');
          expect(call?.options?.mcpServers).toHaveProperty('eslint');
        });

        it('should register all three subagents', async () => {
          mockedQuery.mockReturnValue(
            createResultStream(loadValidReport())
          );

          const orchestrator = new CodeReviewOrchestrator();

          await orchestrator.reviewPullRequest(
            'udacity',
            'cd14715-simple-todo-app',
            1
          );

          const call = mockedQuery.mock.calls[0]?.[0];
          const agents = call?.options?.agents;
          const tools = call?.options?.allowedTools ?? [];

          expect(agents).toBeDefined();

          expect(Object.keys(agents ?? {})).toEqual(
            expect.arrayContaining([
              'code-quality-analyzer',
              'test-coverage-analyzer',
              'refactoring-suggester',
            ])
          );

          expect(tools).toContain('Task');
          expect(tools).toContain('Skill');
        });

        it('should return a ReviewReport', async () => {
          const validReport = loadValidReport();

          mockedQuery.mockReturnValue(createResultStream(validReport));

          const orchestrator = new CodeReviewOrchestrator();

          const result = await orchestrator.reviewPullRequest(
            'udacity',
            'cd14715-simple-todo-app',
            1
          );
          expect(result).toEqual(validReport);

          expect(
            ReviewReportSchema.safeParse(result).success
          ).toBe(true);
        });

        it('should reject invalid structured output', async () =>{
          mockedQuery.mockReturnValue(createResultStream({
            invalid: 'report',
          }));

          const orchestrator = new CodeReviewOrchestrator();

          await expect(
            orchestrator.reviewPullRequest(
              'udacity',
              'cd14715-simple-todo-app',
              1
            )
          ).rejects.toThrow(
            'Review report failed schema validation'
          );
        });

        it('should reject invalid PR number', async () => {
          const orchestrator = new CodeReviewOrchestrator();

          await expect(
            orchestrator.reviewPullRequest(
              'udacity',
              'cd14715-simple-todo-app',
              0
            )
          ).rejects.toThrow(
            'Pull request number must be a positive integer'
          );

          expect(mockedQuery).not.toHaveBeenCalled();
        });
      });

      describe('Integration', () => {
        it.skip(
          'should review a real small PR with API credentials',
          async () => {
            const orchestrator = new CodeReviewOrchestrator();

            const report = await orchestrator.reviewPullRequest(
              'udacity',
              'cd14715-simple-todo-app',
              1
            );

            expect(
              ReviewReportSchema.safeParse(report).success
            ).toBe(true);
          }
        );
      });
    });