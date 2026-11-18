export function buildOrchestratorPrompt(
owner: string,
repo: string,
prNumber:number
): string {
return `
Review GitHub pull request #${prNumber} in ${owner}/${repo}.

You are the main code review orchestrator.

Required workflow:

1.Use the GitHub MCP tools to retrieve pull request #${prNumber}, including its changed files and relevant diff information.

2.Analyze every relevant changed source file.

3.You MUST use the code-quality-analyzer subagent to analyze code quality, security,performance,maintainability,bugs,and best practices.

4.You MUST use the test coverga-analyzer subagent to analyze existing tests and identify important untested functions, classes,branhces, and edge cases.

5.You MUST use the refactoring-suggester subagent to identify useful and actionable refactoring opportunities.

6.Aggregate the results from all three subagents for each reviewed file.

7.Produce one complete ReviewReport for :
owner:${owner}
repo:${repo}
PR number: ${prNumber}

The final response must exactly folow the supplied stricured ReviewReport output schema.

Requirements:
-Do not omit any of the three subagents.
-Do not fabricate file paths or line numbers.
-Scores must be between 0 and 100.
-Provide meaningful summaries.
-Recommandations must be actionable.
-Populate report metadata.
`;
}
