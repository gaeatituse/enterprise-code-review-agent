import * as dotenv from 'dotenv';
import { mkdir,writeFile } from 'node:fs/promises';

import { CodeReviewOrchestrator } from './orchestrator.js';
import { ReportGenerator } from './utils/report-generator.js';
import {
  formatError,
  withRetry,
  withTimeout,
} from './utils/error-handler.js';

dotenv.config();

async function main(): Promise<void> {
  const [owner, repo, prStr] = process.argv.slice(2);

  //Validate command-line arguments
  if (!owner || !repo || !prStr) {
    console.error(
      'Usage: npm run dev -- <owner> <repo> <pr-number>'
    );
    process.exitCode = 1;
    return;
  }
  const prNumber = Number(prStr);

  if (!Number.isInteger(prNumber) || prNumber <=0) {
    console.error(
      'Error: Pull request number must be a positive integer.'
    );
    process.exitCode = 1;
    return;
  }

  const hasAnthropicAPIKey =

  Boolean(process.env.ANTHROPIC_API_KEY);

  const hasAwsCredentials = Boolean(
    process.env.AWS_ACCESSKEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION
  );

  if(!hasAnthropicAPIKey && !hasAwsCredentials) {
    console.error(
      'Error: Configure ANTHROPIC_API_KEY or AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY, and AWS_REGION.'
    );
    process.exitCode = 1;
    return;
  }

  if (!process.env.ANTHROPIC_MODEL) {
    console.error(
      'Error: ANTHROPIC_MODEL environment variable is required.'
    );
    process.exitCode = 1;
    return;
  }

  if (hasAwsCredentials) {
    console.log('Using AWS Bedrock authentication');
  } else {
    console.log('Using Anthropic API authentication');
  }

  try {
    console.log(
      `Reviewing ${owner}/${repo} PR #${prNumber}...`
    );

    const orchestrator = new CodeReviewOrchestrator();

    //Retry failed operations and protect the review
    //with a maximum five-minute timeout
    const report = await withRetry(
      () =>
        withTimeout(
          () =>
            orchestrator.reviewPullRequest(
              owner,
              repo,
              prNumber
            ),
            300000,
            'Code review timed out'
        ),
        3,
        1000
    );
    const generator = new ReportGenerator();

    //Make sure reports directory exists.
    await mkdir('reports',{
      recursive: true,
    });

    const baseName =
    `${owner}_${repo}_${prNumber}`.replace(
      /[^a-zA-z0-9_-]/g,
      '_'
    );
    const jsonReport =
    generator.generateJSONReport(report);

    const markdownReport =
    generator.generateMarkdownReport(report);

    const htmlReport =
    generator.generateHTMLReport(report);

    await Promise.all([
      writeFile(
        `reports/${baseName}.json`,
        jsonReport,
        'utf8'
      ),
      writeFile(
        `reports/${baseName}.md`,
        markdownReport,
        'utf8'
      ),

      writeFile(
        `reports/${baseName}.html`,
        htmlReport,
        'utf8'
      ),
    ]);

    console.log('');
    console.log('Code review completed successfully.');
    console.log('Generated reports:');
    console.log(
      `reports/${baseName}.json`
    );
    console.log(
      `reports/${baseName}.md`
    );
    console.log(
      `reports/${baseName}.html`
    );
  } catch (error) {
    console.error(
      `Error: ${formatError(error)}`
    );

    process.exitCode = 1;
  }
}
 void main();