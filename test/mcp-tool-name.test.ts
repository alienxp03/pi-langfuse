import test from "node:test";
import assert from "node:assert/strict";

import { directMcpObservationName } from "../src/mcp-tool-name.ts";

test("directMcpObservationName labels server-prefixed direct tools", () => {
  assert.equal(
    directMcpObservationName("time_get_current_time", {
      mcpServers: { time: { directTools: true } },
    }),
    "mcp.time.get_current_time",
  );
});

test("directMcpObservationName honors selected tools and prefix modes", () => {
  assert.equal(
    directMcpObservationName("linear_create_issue", {
      settings: { toolPrefix: "short" },
      mcpServers: { "linear-mcp": { directTools: ["create_issue"] } },
    }),
    "mcp.linear-mcp.create_issue",
  );
  assert.equal(
    directMcpObservationName("mcp__time_convert_time", {
      settings: { toolPrefix: "mcp", directTools: true },
      mcpServers: { time: {} },
    }),
    "mcp.time.convert_time",
  );
});

test("directMcpObservationName does not guess for native or prefix-free tools", () => {
  assert.equal(
    directMcpObservationName("web_search", {
      mcpServers: { time: { directTools: true } },
    }),
    undefined,
  );
  assert.equal(
    directMcpObservationName("get_current_time", {
      settings: { toolPrefix: "none", directTools: true },
      mcpServers: { time: {} },
    }),
    undefined,
  );
});
