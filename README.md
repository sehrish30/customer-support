# SupportPilot AI

SupportPilot AI is an agentic customer support assistant that combines:

- Internal knowledge-base retrieval (RAG with Supabase vectors)
- Tool-calling orchestration
- Optional web-search grounding for broader or real-time questions

It is designed as a portfolio-ready backend project that demonstrates practical LLM engineering for support workflows.

## Why This Project

Many support assistants fail when they only use one source of truth.

This agent uses a hybrid strategy:

- If the question is product-specific, it retrieves internal docs.
- If the question needs broader or recent context, it can use web search.
- If no tool is needed, it responds directly.

## Stack

- Node.js (ESM)
- AI SDK (`ai`)
- OpenAI via `@ai-sdk/openai`
- Supabase (`@supabase/supabase-js`)
- Zod (`zod`)

## Project Structure

- `index.js` : demo entrypoint
- `webSearchRetrievalAgent.js` : main agent orchestration
- `tools/knowledgeBaseTool.js` : vector retrieval tool
- `prompts.js` : routing prompt for tool usage
- `constants.js` : model and KB configuration
- `config.js` : OpenAI + Supabase clients

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment variables:

```bash
cp .env.example .env
```

3. Fill in your values:

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

4. Start the local app:

```bash
npm start
```

5. Open the frontend:

- http://localhost:3000

## Frontend + API

This project now includes a built-in local web UI and API:

- Frontend: `public/index.html`
- API endpoint: `POST /api/search`
- Health endpoint: `GET /api/health`

`POST /api/search` request body:

```json
{
	"query": "How do I upgrade my subscription plan?"
}
```

Response shape:

```json
{
	"answer": "...",
	"sources": [],
	"toolUsed": "knowledgeBaseSearch"
}
```

## Customizing For Your Own Brand

To fully turn this into your own portfolio project:

1. Update the product description in `constants.js`.
2. Replace your vector data source in Supabase with your own support docs.
3. Tune the prompt in `prompts.js` for your support policy and tone.
4. Update sample queries in `index.js` to match your product domain.

## Example Use Cases

- Product FAQ assistant
- Developer platform support assistant
- Learning platform helpdesk copilot
- Internal support triage prototype

## Notes

- The app is served locally from Express on port `3000` by default.
- Knowledge-base retrieval depends on a Supabase RPC named `match_documents`.

## Portfolio Positioning

You can present this project as:

"Built an agentic support system that routes between internal RAG and tool-based retrieval to improve support response quality and trustworthiness."
