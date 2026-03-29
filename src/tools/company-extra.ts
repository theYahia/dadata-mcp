/**
 * Extra company tools: find_affiliated, find_company_by_email, find_brand.
 *
 * All use Suggestions API. Some require paid tiers.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callSuggestions } from "../client.js";
import { success, error } from "../lib/formatters.js";
import { formatCompany } from "./suggest.js";
import type { PartyData, BrandData, SuggestResponse } from "../types.js";

export function registerCompanyExtraTools(server: McpServer): void {
  // --- find_affiliated ---
  server.tool(
    "find_affiliated",
    "Find companies affiliated with a person or company by INN. Requires 'Maximum' plan.",
    {
      query: z
        .string()
        .min(1)
        .max(15)
        .describe("INN of a person or company to find affiliations for"),
      count: z.number().int().min(1).max(20).default(10),
      scope: z
        .array(z.enum(["FOUNDERS", "MANAGERS"]))
        .optional()
        .describe("Search scope: FOUNDERS, MANAGERS, or both"),
    },
    async (params) => {
      const body: Record<string, unknown> = {
        query: params.query,
        count: params.count,
      };
      if (params.scope) body.scope = params.scope;

      const result = await callSuggestions("findAffiliated/party", body);
      if (result.error) return error(result.error);

      const resp = result.data as SuggestResponse<PartyData>;
      if (!resp.suggestions?.length) {
        return success({
          status: "no_results",
          message: `No affiliated companies found for INN "${params.query}". This may require a "Maximum" plan.`,
        });
      }

      return success({
        count: resp.suggestions.length,
        affiliated: resp.suggestions.map((s) => formatCompany(s.data)),
      });
    },
  );

  // --- find_company_by_email ---
  server.tool(
    "find_company_by_email",
    "Find a company by its corporate email address or domain. Paid: 7 RUB/req.",
    {
      query: z
        .string()
        .min(1)
        .max(200)
        .describe("Corporate email or domain, e.g. 'info@sberbank.ru' or 'sberbank.ru'"),
    },
    async (params) => {
      const result = await callSuggestions("findByEmail/company", {
        query: params.query,
      });
      if (result.error) return error(result.error);

      const resp = result.data as SuggestResponse<PartyData>;
      if (!resp.suggestions?.length) {
        return success({
          status: "not_found",
          message: `No company found for email/domain "${params.query}".`,
        });
      }

      return success({
        count: resp.suggestions.length,
        companies: resp.suggestions.map((s) => formatCompany(s.data)),
      });
    },
  );

  // --- find_brand ---
  server.tool(
    "find_brand",
    "Find a company's brand name, website, and logo by INN. Paid: 7 RUB/req.",
    {
      query: z
        .string()
        .min(1)
        .max(15)
        .describe("Company INN"),
    },
    async (params) => {
      const result = await callSuggestions("findById/brand", {
        query: params.query,
      });
      if (result.error) return error(result.error);

      const resp = result.data as SuggestResponse<BrandData>;
      if (!resp.suggestions?.length) {
        return success({
          status: "not_found",
          message: `No brand info found for INN "${params.query}".`,
        });
      }

      const b = resp.suggestions[0].data;
      return success({
        brand_name: b.name,
        website: b.site,
        logo_url: b.logo,
      });
    },
  );

  // --- find_self_employed ---
  server.tool(
    "find_self_employed",
    "Check if an INN belongs to a self-employed person (via FNS API). Availability not guaranteed.",
    {
      query: z
        .string()
        .min(1)
        .max(12)
        .describe("INN of the person to check (12 digits)"),
    },
    async (params) => {
      const result = await callSuggestions("findById/party", {
        query: params.query,
        type: "INDIVIDUAL",
      });
      if (result.error) return error(result.error);

      const resp = result.data as SuggestResponse<PartyData>;
      if (!resp.suggestions?.length) {
        return success({
          status: "not_found",
          message: `No self-employed person found for INN "${params.query}". The FNS API may be unavailable.`,
        });
      }

      return success(formatCompany(resp.suggestions[0].data));
    },
  );
}
