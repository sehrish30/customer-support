import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import type { GitHubSource } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = join(__dirname, '..', 'node_modules', '@modelcontextprotocol', 'server-github', 'dist', 'index.js');

let _client: Client | null = null;
let _connecting: Promise<Client> | null = null;

async function getClient(): Promise<Client> {
  if (_client) return _client;
  if (_connecting) return _connecting;

  _connecting = (async () => {
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (!token) throw new Error('GITHUB_PERSONAL_ACCESS_TOKEN not set');

    const transport = new StdioClientTransport({
      command: 'node',
      args: [SERVER_PATH],
      env: { ...process.env as Record<string, string> },
      stderr: 'pipe',
    });

    const client = new Client({ name: 'supportpilot', version: '1.0.0' });
    await client.connect(transport);
    _client = client;
    console.log('[GitHub MCP] Connected to server-github.');
    return client;
  })();

  try {
    return await _connecting;
  } finally {
    _connecting = null;
  }
}

function extractText(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null;
  const r = result as { content?: Array<{ type: string; text?: string }> };
  return r.content?.find(c => c.type === 'text')?.text ?? null;
}

export function isGitHubConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN &&
    process.env.GITHUB_REPO_OWNER &&
    process.env.GITHUB_REPO_NAME,
  );
}

export async function searchGitHubIssues(query: string): Promise<GitHubSource[]> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  if (!owner || !repo) return [];

  try {
    const client = await getClient();
    const result = await client.callTool({
      name: 'search_issues',
      arguments: { query: `${query} repo:${owner}/${repo} is:issue` },
    });

    const text = extractText(result);
    if (!text) return [];

    const parsed = JSON.parse(text) as {
      items?: Array<{ number: number; title: string; html_url: string; state: string; body: string | null }>;
    };

    return (parsed.items ?? []).slice(0, 3).map(issue => ({
      type: 'github' as const,
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      state: issue.state as 'open' | 'closed',
      body: issue.body?.slice(0, 300) ?? '',
    }));
  } catch (err) {
    console.error('[GitHub MCP] searchIssues failed:', err);
    return [];
  }
}

export async function createGitHubIssue(
  title: string,
  body: string,
  labels: string[] = ['bug', 'customer-support'],
): Promise<{ url: string; number: number } | null> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  if (!owner || !repo) return null;

  try {
    const client = await getClient();
    const result = await client.callTool({
      name: 'create_issue',
      arguments: { owner, repo, title, body, labels },
    });

    const text = extractText(result);
    if (!text) return null;

    const parsed = JSON.parse(text) as { html_url?: string; number?: number };
    if (!parsed.html_url || !parsed.number) return null;

    return { url: parsed.html_url, number: parsed.number };
  } catch (err) {
    console.error('[GitHub MCP] createIssue failed:', err);
    return null;
  }
}
