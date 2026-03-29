/**
 * Passport tools: clean_passport, find_fms_unit.
 *
 * clean_passport — Cleaner API (paid, Token + Secret)
 * find_fms_unit — Suggestions API (free, Token only)
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callCleaner, callSuggestions } from "../client.js";
import { success, error, qcToConfidence } from "../lib/formatters.js";
import type { CleanPassportResult, FmsUnitData, SuggestResponse } from "../types.js";

export function registerPassportTools(server: McpServer): void {
  // --- clean_passport ---
  server.tool(
    "clean_passport",
    "Validate a Russian passport against the MVD invalid passports registry. Paid: 0.20 RUB/req.",
    {
      passport: z
        .string()
        .min(1)
        .max(20)
        .describe("Passport series and number, e.g. '45 04 346825'"),
    },
    async (params) => {
      const result = await callCleaner("passport", [params.passport]);
      if (result.error) return error(result.error);

      const raw = result.data;
      const r: CleanPassportResult = Array.isArray(raw) ? raw[0] : raw;

      if (!r) {
        return success({
          status: "unrecognized",
          message: "Passport could not be parsed.",
          source: params.passport,
        });
      }

      const QC_PASSPORT: Record<number, string> = {
        0: "Valid passport (not in MVD invalid list)",
        1: "Invalid passport (found in MVD invalid list)",
        2: "Empty or garbage input",
        10: "Passport not checked (MVD registry unavailable)",
      };

      return success({
        source: r.source,
        series: r.series,
        number: r.number,
        quality: QC_PASSPORT[r.qc] ?? `Unknown (qc=${r.qc})`,
        is_valid: r.qc === 0,
        confidence: qcToConfidence(r.qc),
      });
    },
  );

  // --- find_fms_unit ---
  server.tool(
    "find_fms_unit",
    "Find passport issuing authority by subdivision code (e.g. '770-001'). Returns the full name of the office.",
    {
      query: z
        .string()
        .min(1)
        .max(20)
        .describe("FMS subdivision code, e.g. '770-001'"),
      count: z.number().int().min(1).max(20).default(5),
    },
    async (params) => {
      const result = await callSuggestions("suggest/fms_unit", {
        query: params.query,
        count: params.count,
      });
      if (result.error) return error(result.error);

      const resp = result.data as SuggestResponse<FmsUnitData>;
      if (!resp.suggestions?.length) {
        return success({
          status: "not_found",
          message: `No FMS unit found for code "${params.query}".`,
        });
      }

      return success({
        count: resp.suggestions.length,
        units: resp.suggestions.map((s) => ({
          code: s.data.code,
          name: s.value,
          region_code: s.data.region_code,
          type: s.data.type,
        })),
      });
    },
  );
}
