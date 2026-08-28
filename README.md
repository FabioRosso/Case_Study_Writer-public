# Case Study Writer

An AI-assisted editor that turns structured B2B SaaS briefing notes into a polished, editable case study. Generate a first draft, edit it inline, and refine it with natural-language feedback.

## Features

- Guided brief for problems, solutions, KPIs, and transformation
- Structured long-form drafts generated with Claude
- Inline editing with a live word count
- Full-draft refinement from written feedback
- Simple Express server and dependency-free browser UI

## Requirements

- Node.js 20 or newer
- An [Anthropic API key](https://console.anthropic.com/)

## Run locally

```bash
git clone https://github.com/FabioRosso/Case_Study_Writer-public.git
cd Case_Study_Writer-public
npm install
cp .env.example .env
```

Add your Anthropic API key to `.env`:

```dotenv
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Start the app:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | API key used by the server to generate and refine drafts |
| `PORT` | No | HTTP port; defaults to `3000` |

The API key stays on the server. Never add your `.env` file to Git; it is ignored by default.

## Commands

```bash
npm start       # Start the web server
npm run check   # Run JavaScript syntax checks
npm test        # Run the project checks
```

## How it works

The browser sends briefing notes to the local Express API. The server prompts Anthropic's Claude model and returns a structured JSON document. Draft content remains editable in the browser, and refinement requests send the current draft plus feedback back to the server.

## Responsible use

Treat generated copy as a draft. Verify every customer claim, KPI, attribution, and quotation before publishing. Do not submit confidential customer information unless you are authorized to process it with the configured AI provider.

## License

[MIT](LICENSE)
