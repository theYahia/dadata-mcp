# @metarebalance/dadata-mcp

Full-featured MCP server for [DaData.ru](https://dadata.ru) — Russian address validation, company lookup, phone cleaning, and geocoding for AI agents.

[![npm](https://img.shields.io/npm/v/@metarebalance/dadata-mcp)](https://www.npmjs.com/package/@metarebalance/dadata-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why this instead of official DaData MCP?

DaData offers an [official remote MCP server](https://mcp.dadata.ru/mcp) with 4 tools. This package provides **full local coverage**:

| Feature | Official MCP | @metarebalance/dadata-mcp |
|---------|:-----------:|:---------------------:|
| Tools | 4 | **8** |
| Resources | 0 | **2** |
| Prompts | 0 | **2** |
| Transport | Remote (needs proxy) | **Local stdio** |
| Free tools | 1 | **6** |
| npm install | No | **Yes** |

## Quick Start

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dadata": {
      "command": "npx",
      "args": ["-y", "@metarebalance/dadata-mcp"],
      "env": {
        "DADATA_API_KEY": "your-api-key",
        "DADATA_SECRET_KEY": "your-secret-key"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add dadata -- npx -y @metarebalance/dadata-mcp
```

### VS Code / Cursor

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "dadata": {
      "command": "npx",
      "args": ["-y", "@metarebalance/dadata-mcp"],
      "env": {
        "DADATA_API_KEY": "your-api-key",
        "DADATA_SECRET_KEY": "your-secret-key"
      }
    }
  }
}
```

## Tools

### Free (Suggestions API, 10K requests/day)

| Tool | Description |
|------|-------------|
| `suggest_address` | Autocomplete Russian addresses with postal code, FIAS ID, coordinates |
| `suggest_company` | Search companies by name, INN, or OGRN |
| `find_company_by_id` | Get detailed company info by INN or OGRN |
| `find_bank` | Find bank by BIC, SWIFT, INN, or name |
| `geolocate_address` | Reverse geocoding: coordinates to nearest addresses |
| `ip_locate` | Detect Russian city by IPv4 address |

### Paid (Cleaner API, 0.20 RUB/request)

| Tool | Description |
|------|-------------|
| `clean_address` | Standardize address with 80+ structured fields and quality codes |
| `clean_phone` | Validate phone number: carrier, region, timezone, mobile/landline |

## Resources

- **quality-codes** — Reference for DaData quality codes (qc, qc_geo) and confidence levels
- **capabilities** — What DaData API can do: free vs paid features, rate limits

## Prompts

- **check_counterparty** — Due diligence check on a Russian company by INN
- **validate_address** — Multi-step address validation with quality assessment

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DADATA_API_KEY` | Yes | API key from [dadata.ru/profile](https://dadata.ru/profile/#info) |
| `DADATA_SECRET_KEY` | No | Secret key for paid clean tools. Without it, 6 free tools still work |

## Example Prompts

```
Find company by INN 7707083893
```

```
Standardize address: мск сухонская 11 кв 89
```

```
What city is IP 46.226.227.20 from?
```

```
Find Sberbank's BIC and correspondent account
```

## Security

- API keys are never logged or included in error responses
- All inputs validated with Zod schemas (length limits, type checks, regex for IPs)
- Path traversal protection on all API endpoint construction
- 10-second hard timeout on all HTTP requests
- Retry with exponential backoff on transient errors only (429, 5xx)
- `stdout` reserved for JSON-RPC — all logs go to `stderr`

## Development

```bash
git clone https://github.com/theYahia/dadata-mcp.git
cd dadata-mcp
npm install
npm run build
npm test
```

### Test with MCP Inspector

```bash
DADATA_API_KEY=your-key npx @modelcontextprotocol/inspector node dist/index.js
```

Opens an interactive UI at `http://localhost:6274` where you can call each tool and see JSON-RPC messages.

## License

MIT
