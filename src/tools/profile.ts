/**
 * Profile tools: get_balance.
 *
 * Uses the Profile API (GET requests, requires Token + Secret).
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callProfileAPI } from "../client.js";
import { success, error } from "../lib/formatters.js";
import type { BalanceResponse } from "../types.js";

export function registerProfileTools(server: McpServer): void {
  server.tool(
    "get_balance",
    "Check your DaData account balance and daily usage statistics.",
    {},
    async () => {
      const balanceResult = await callProfileAPI("profile/balance");
      if (balanceResult.error) return error(balanceResult.error);

      const statResult = await callProfileAPI("stat/daily");

      const balance = balanceResult.data as BalanceResponse;

      return success({
        balance_rub: balance.balance,
        daily_stats: statResult.error ? "unavailable" : statResult.data,
      });
    },
  );
}
