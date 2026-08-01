import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

interface McpServerConfig {
  directTools?: boolean | string[];
}

interface McpConfig {
  mcpServers?: Record<string, McpServerConfig>;
  settings?: {
    directTools?: boolean | string[];
    toolPrefix?: "server" | "short" | "mcp" | "none";
  };
}

function serverPrefix(serverName: string, mode: NonNullable<McpConfig["settings"]>["toolPrefix"]): string {
  if (mode === "none") return "";
  if (mode === "short") {
    return serverName.replace(/-?mcp$/i, "").replace(/-/g, "_") || "mcp";
  }
  if (mode === "mcp") return `mcp__${serverName.replace(/-/g, "_")}`;
  return serverName.replace(/-/g, "_");
}

function formattedToolName(toolName: string, serverName: string, mode: NonNullable<McpConfig["settings"]>["toolPrefix"]): string {
  const prefix = serverPrefix(serverName, mode);
  const sanitized = toolName.replace(/\./g, "_");
  return prefix ? `${prefix}_${sanitized}` : sanitized;
}

/** Resolve a Pi direct-tool name back to its MCP server and original tool. */
export function directMcpObservationName(toolName: string, config: McpConfig): string | undefined {
  const mode = config.settings?.toolPrefix ?? "server";
  // Prefix-free direct tools cannot be identified reliably from Pi's event.
  if (mode === "none") return undefined;

  for (const [serverName, definition] of Object.entries(config.mcpServers ?? {})) {
    const selection = definition.directTools ?? config.settings?.directTools ?? false;
    if (!selection) continue;

    if (Array.isArray(selection)) {
      const original = selection.find(
        (candidate) => formattedToolName(candidate, serverName, mode) === toolName,
      );
      if (original) return `mcp.${serverName}.${original}`;
      continue;
    }

    const prefix = `${serverPrefix(serverName, mode)}_`;
    if (toolName.startsWith(prefix) && toolName.length > prefix.length) {
      return `mcp.${serverName}.${toolName.slice(prefix.length)}`;
    }
  }

  return undefined;
}

let cachedConfig: McpConfig | null | undefined;

export function getDirectMcpObservationName(toolName: string): string | undefined {
  if (cachedConfig === undefined) {
    const agentDir = process.env.PI_CODING_AGENT_DIR || resolve(homedir(), ".pi", "agent");
    try {
      cachedConfig = JSON.parse(readFileSync(resolve(agentDir, "mcp.json"), "utf-8")) as McpConfig;
    } catch {
      cachedConfig = null;
    }
  }

  return cachedConfig ? directMcpObservationName(toolName, cachedConfig) : undefined;
}
