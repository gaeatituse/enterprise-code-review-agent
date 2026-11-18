/**
* Model Context Protocol (MCP) server configurations
*
* GitHub MCP provides GitHub pull request/repository tools.
* ESLint MCP provides linting and code-quality analysis tools.
*/

export const mcpServersConfig = {
github: {
type: 'stdio' as const,
command:'npx',
args: ['-y', '@modelcontextprotocol/server-github'],
env: {
 GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || '',
},
},

eslint: {
type: 'stdio' as const,
command: 'npx',
args: ['-y', '@eslint/mcp@latest'],
env: {},
},
};
