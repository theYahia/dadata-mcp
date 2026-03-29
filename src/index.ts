#!/usr/bin/env node

/**
 * @metarebalance/dadata-mcp — MCP server for DaData.ru API
 *
 * Full coverage of DaData API: 30 tools, 2 resources, 2 prompts.
 * Addresses, companies, banks, FIO, phones, email, passports,
 * vehicles, logistics, and 9 reference directories.
 *
 * Security:
 *   - stdout is reserved for JSON-RPC — all logs go to stderr
 *   - API keys are never logged or included in error responses
 *   - Input validation via Zod on every tool call
 *   - Hard timeout (10s) on all API requests
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerSuggestTools } from "./tools/suggest.js";
import { registerFindTools } from "./tools/find.js";
import { registerCleanTools } from "./tools/clean.js";
import { registerGeoTools } from "./tools/geo.js";
import { registerProfileTools } from "./tools/profile.js";
import { registerPassportTools } from "./tools/passport.js";
import { registerCompanyExtraTools } from "./tools/company-extra.js";
import { registerEmailExtraTools } from "./tools/email-extra.js";
import { registerVehicleTools } from "./tools/vehicle.js";
import { registerPostalTools } from "./tools/postal.js";
import { registerReferenceTools } from "./tools/reference.js";
import { registerResources } from "./resources/reference.js";
import { registerPrompts } from "./prompts/workflows.js";

// ---------------------------------------------------------------------------
// Environment validation
// ---------------------------------------------------------------------------

const apiKey = process.env.DADATA_API_KEY;

if (!apiKey) {
  console.error(
    "[dadata-mcp] FATAL: DADATA_API_KEY is not set.\n" +
    "  Get your free key at https://dadata.ru/profile/#info\n" +
    "  Then add it to your MCP client env configuration.",
  );
  process.exit(1);
}

if (!process.env.DADATA_SECRET_KEY) {
  console.error(
    "[dadata-mcp] INFO: DADATA_SECRET_KEY is not set.\n" +
    "  Suggest tools (free) will work. Clean tools (paid) will return an error.\n" +
    "  Get your secret at https://dadata.ru/profile/#info",
  );
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "dadata-mcp",
  version: "1.0.0",
});

// Core tools (14)
registerSuggestTools(server);       // suggest_address, suggest_company, suggest_fio
registerFindTools(server);          // find_company_by_id, find_bank, find_by_id_address, find_delivery_city
registerCleanTools(server);         // clean_address, clean_phone, clean_email, clean_name
registerGeoTools(server);           // geolocate_address, ip_locate
registerProfileTools(server);       // get_balance, get_versions

// Passport (3)
registerPassportTools(server);      // clean_passport, find_fms_unit, find_inn_by_passport

// Company extra (6)
registerCompanyExtraTools(server);  // find_affiliated, find_company_by_email, find_brand, find_self_employed, suggest_company_by, suggest_company_kz

// Email extra (1)
registerEmailExtraTools(server);    // suggest_email

// Vehicle (2)
registerVehicleTools(server);       // clean_vehicle, suggest_car_brand

// Postal & countries (2)
registerPostalTools(server);        // find_postal_unit, suggest_country

// Reference directories (1 tool covering 12 directories)
registerReferenceTools(server);     // lookup_reference (okved2, okpd2, oktmo, metro, fns, fts, courts, currency, mktu, professions, positions, medical)

// Resources (2)
registerResources(server);          // quality-codes, capabilities

// Prompts (2)
registerPrompts(server);            // check_counterparty, validate_address

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);

console.error(
  "[dadata-mcp] Server started — 30 tools, 2 resources, 2 prompts ready.",
);
