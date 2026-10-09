#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const execFileAsync = promisify(execFile);
const DOCKER_IMAGE = 'soxoj/maigret:latest';

interface SearchUsernameArgs {
  username: string;
  format?: 'txt' | 'html' | 'pdf' | 'json' | 'csv' | 'xmind';
  use_all_sites?: boolean;
  tags?: string[];
}

interface ParseUrlArgs {
  url: string;
  format?: 'txt' | 'html' | 'pdf' | 'json' | 'csv' | 'xmind';
}

interface ExecResult {
  stdout: string;
  stderr: string;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}

/**
 * Validates username to prevent command injection.
 * Only allows alphanumeric characters, underscores, hyphens, and periods.
 */
function isValidUsername(username: string): boolean {
  // Max length check to prevent DoS
  if (username.length === 0 || username.length > 100) {
    return false;
  }
  // Only allow safe characters commonly found in usernames
  return /^[a-zA-Z0-9_.-]+$/.test(username);
}

/**
 * Validates URL to prevent command injection.
 * Must be a valid HTTP/HTTPS URL.
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    // Only allow http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    // Check for suspicious characters that could be used for injection
    if (/[;&|`$(){}[\]<>\\]/.test(urlString)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates tags to prevent command injection.
 * Only allows alphanumeric characters, underscores, and hyphens.
 */
function isValidTag(tag: string): boolean {
  if (tag.length === 0 || tag.length > 50) {
    return false;
  }
  return /^[a-zA-Z0-9_-]+$/.test(tag);
}

// maigret's --json takes a report type; the other formats are bare flags.
function formatArgs(format: string): string[] {
  return format === 'json' ? ['--json', 'simple'] : [`--${format}`];
}

// maigret names some reports with a type suffix.
function reportFilename(username: string, format: string): string {
  if (format === 'json') return `report_${username}_simple.json`;
  if (format === 'html') return `report_${username}_plain.html`;
  return `report_${username}.${format}`;
}

function isSearchUsernameArgs(args: unknown): args is SearchUsernameArgs {
  if (!args || typeof args !== 'object') return false;
  const a = args as Record<string, unknown>;
  return typeof a.username === 'string' &&
    (a.format === undefined || ['txt', 'html', 'pdf', 'json', 'csv', 'xmind'].includes(a.format as string)) &&
    (a.use_all_sites === undefined || typeof a.use_all_sites === 'boolean') &&
    (a.tags === undefined || (Array.isArray(a.tags) && a.tags.every(t => typeof t === 'string')));
}

function isParseUrlArgs(args: unknown): args is ParseUrlArgs {
  if (!args || typeof args !== 'object') return false;
  const a = args as Record<string, unknown>;
  return typeof a.url === 'string' &&
    (a.format === undefined || ['txt', 'html', 'pdf', 'json', 'csv', 'xmind'].includes(a.format as string));
}

class MaigretServer {
  private server: Server;
  private reportsDir: string;

  constructor() {
    if (!process.env.MAIGRET_REPORTS_DIR) {
      throw new Error('MAIGRET_REPORTS_DIR environment variable must be set');
    }

    this.reportsDir = process.env.MAIGRET_REPORTS_DIR;
    
    this.server = new Server(
      { name: 'maigret-server', version: '0.1.0' },
      { capabilities: { tools: {} } }
    );

    console.error('Using reports directory:', this.reportsDir);
    
    // Create reports directory if it doesn't exist
    if (!existsSync(this.reportsDir)) {
      console.error('Creating reports directory...');
      mkdirSync(this.reportsDir, { recursive: true });
    }
    
    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    // Trigger setup immediately
    this.ensureSetup().catch(error => {
      console.error('Failed to setup maigret:', error);
      process.exit(1);
    });
  }

  /**
   * Executes a command safely using execFile (no shell interpolation).
   * Arguments are passed as an array to prevent command injection.
   */
  private async execCommand(cmd: string, args: string[]): Promise<ExecResult> {
    console.error('Executing command:', cmd, args.join(' '));
    try {
      const result = await execFileAsync(cmd, args, {
        maxBuffer: 10 * 1024 * 1024
      });
      console.error('Command output:', result.stdout);
      if (result.stderr) console.error('Command stderr:', result.stderr);
      return result;
    } catch (error) {
      console.error('Command failed:', error);
      throw error;
    }
  }

  private async ensureSetup(): Promise<void> {
    try {
      console.error('Checking Docker...');
      try {
        await this.execCommand('docker', ['--version']);
      } catch (error) {
        throw new Error('Docker is not installed or not running. Please install Docker and try again.');
      }

      console.error('Checking if maigret image exists...');
      try {
        await this.execCommand('docker', ['image', 'inspect', DOCKER_IMAGE]);
        console.error('Maigret image found');
      } catch (error) {
        console.error('Maigret image not found, pulling...');
        await this.execCommand('docker', ['pull', DOCKER_IMAGE]);
        console.error('Maigret image pulled successfully');
      }
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_username',
          description: 'Search for a username across social networks and sites',
          inputSchema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                description: 'Username to search for'
              },
              format: {
                type: 'string',
                enum: ['txt', 'html', 'pdf', 'json', 'csv', 'xmind'],
                description: 'Output format',
                default: 'txt'
              },
              use_all_sites: {
                type: 'boolean',
                description: 'Use all available sites instead of top 500',
                default: false
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Filter sites by tags (e.g. photo, dating, us)',
                default: []
              }
            },
            required: ['username']
          }
        },
        {
          name: 'parse_url',
          description: 'Parse a URL to extract information and search for associated usernames',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                format: 'uri',
                description: 'URL to parse and analyze'
              },
              format: {
                type: 'string',
                enum: ['txt', 'html', 'pdf', 'json', 'csv', 'xmind'],
                description: 'Output format',
                default: 'txt'
              }
            },
            required: ['url']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        await this.ensureSetup();

        switch (request.params.name) {
          case 'search_username': {
            if (!isSearchUsernameArgs(request.params.arguments)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Invalid arguments for search_username'
              );
            }

            const {
              username,
              format = 'txt',
              use_all_sites = false,
              tags = []
            } = request.params.arguments;

            // Security: Validate username to prevent command injection
            if (!isValidUsername(username)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Invalid username. Username must contain only alphanumeric characters, underscores, hyphens, and periods (max 100 characters).'
              );
            }

            // Security: Validate all tags
            for (const tag of tags) {
              if (!isValidTag(tag)) {
                throw new McpError(
                  ErrorCode.InvalidParams,
                  `Invalid tag: "${tag}". Tags must contain only alphanumeric characters, underscores, and hyphens.`
                );
              }
            }

            const safeUsername = sanitizeFilename(username);
            const reportPath = join(this.reportsDir, reportFilename(safeUsername, format));;

            // Build docker command arguments (passed as array to prevent shell injection)
            const dockerArgs = [
              'run', '--rm',
              '-v', `${this.reportsDir}:/app/reports`,
              DOCKER_IMAGE,
              username,
              ...formatArgs(format),
              '--no-color',
              '--no-progressbar',
              '-n', '200'
            ];

            if (use_all_sites) {
              dockerArgs.push('-a');
            }

            if (tags.length > 0) {
              dockerArgs.push('--tags', tags.join(','));
            }

            // Run maigret in Docker using execFile (safe from shell injection)
            const { stdout, stderr } = await this.execCommand('docker', dockerArgs);

            const reportStatus = existsSync(reportPath)
              ? `Report saved to: ${reportPath}`
              : `No report file was produced at ${reportPath} (the '${format}' format may be unavailable in this maigret image)`;

            return {
              content: [
                {
                  type: 'text',
                  text: `${reportStatus}\n\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`
                }
              ]
            };
          }

          case 'parse_url': {
            if (!isParseUrlArgs(request.params.arguments)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Invalid arguments for parse_url'
              );
            }

            const { url, format = 'txt' } = request.params.arguments;

            // Security: Validate URL to prevent command injection
            if (!isValidUrl(url)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Invalid URL. Must be a valid HTTP or HTTPS URL without special shell characters.'
              );
            }

            // Build docker command arguments (passed as array to prevent shell injection)
            const dockerArgs = [
              'run', '--rm',
              '-v', `${this.reportsDir}:/app/reports`,
              DOCKER_IMAGE,
              '--parse', url,
              ...formatArgs(format),
              '--no-color',
              '--no-progressbar',
              '--timeout', '60',
              '-n', '200'
            ];

            // Run maigret in Docker using execFile (safe from shell injection)
            const { stdout, stderr } = await this.execCommand('docker', dockerArgs);

            return {
              content: [
                {
                  type: 'text',
                  text: stdout + (stderr ? `\nErrors:\n${stderr}` : '')
                }
              ]
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing maigret: ${errorMessage}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Maigret MCP server running on stdio');
  }
}

const server = new MaigretServer();
server.run().catch(console.error);
