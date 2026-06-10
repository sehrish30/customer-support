import express, { type Request, type Response } from "express";
import {
  streamWebSearchRetrievalAgent,
  webSearchRetrievalAgent,
} from "./webSearchRetrievalAgent.js";
import {
  createGitHubIssue,
  isGitHubConfigured,
} from "./tools/githubMcpTool.js";
import { sendAgentReport, isEmailConfigured } from "./tools/emailTool.js";
import { clearSession } from "./tools/memoryTool.js";
import type { StreamEvent } from "./types.js";
import { supabase } from "./config.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "supportpilot-api",
    github: isGitHubConfigured(),
    email: isEmailConfigured(),
  });
});

app.post("/api/search", async (req: Request, res: Response) => {
  const body = req.body as { query?: string; sessionId?: string } | undefined;
  const query = body?.query;
  const sessionId =
    typeof body?.sessionId === "string" ? body.sessionId : undefined;

  if (!query || typeof query !== "string" || !query.trim()) {
    res.status(400).json({ error: "A non-empty query string is required." });
    return;
  }

  try {
    const result = await webSearchRetrievalAgent(query.trim(), { sessionId });
    res.json(result);
  } catch (err) {
    console.error("[API] /api/search failed:", err);
    res.status(500).json({ error: "Failed to process search request." });
  }
});

app.post("/api/search/stream", async (req: Request, res: Response) => {
  const body = req.body as { query?: string; sessionId?: string; imageBase64?: string } | undefined;
  const query = body?.query;
  const sessionId =
    typeof body?.sessionId === "string" ? body.sessionId : undefined;
  const imageBase64 =
    typeof body?.imageBase64 === "string" ? body.imageBase64 : undefined;

  if (!query || typeof query !== "string" || !query.trim()) {
    res.status(400).json({ error: "A non-empty query string is required." });
    return;
  }

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const writeEvent = (event: StreamEvent): void => {
    res.write(`${JSON.stringify(event)}\n`);
  };

  writeEvent({ type: "start" });

  try {
    const result = await streamWebSearchRetrievalAgent(
      query.trim(),
      {
        onTextDelta: async (delta) => {
          writeEvent({ type: "text-delta", delta });
        },
      },
      { sessionId, imageBase64 },
    );

    writeEvent({ type: "done", ...result });
    res.end();
  } catch (err) {
    console.error("[API] /api/search/stream failed:", err);
    writeEvent({
      type: "error",
      error: "Failed to process streaming search request.",
    });
    res.end();
  }
});

app.post("/api/github/create-issue", async (req: Request, res: Response) => {
  if (!isGitHubConfigured()) {
    res.status(503).json({ error: "GitHub integration is not configured." });
    return;
  }

  const body = req.body as { title?: string; body?: string } | undefined;
  const title = body?.title?.trim();
  const issueBody = body?.body?.trim();

  if (!title || !issueBody) {
    res.status(400).json({ error: "title and body are required." });
    return;
  }

  try {
    const issue = await createGitHubIssue(title, issueBody);
    if (!issue) {
      res.status(500).json({ error: "Failed to create GitHub issue." });
      return;
    }
    res.json(issue);
  } catch (err) {
    console.error("[API] /api/github/create-issue failed:", err);
    res.status(500).json({ error: "Failed to create GitHub issue." });
  }
});

app.post("/api/email/report-to-agent", async (req: Request, res: Response) => {
  if (!isEmailConfigured()) {
    res.status(503).json({ error: "Email integration is not configured." });
    return;
  }

  const body = req.body as { query?: string; answer?: string; customerEmail?: string; imageBase64?: string } | undefined;
  const query = body?.query?.trim();
  const answer = body?.answer?.trim();
  const customerEmail = body?.customerEmail?.trim() || undefined;
  const imageBase64 = typeof body?.imageBase64 === 'string' ? body.imageBase64 : undefined;

  if (!query || !answer) {
    res.status(400).json({ error: "query and answer are required." });
    return;
  }

  try {
    const ok = await sendAgentReport(query, answer, customerEmail, imageBase64);
    if (!ok) {
      res.status(500).json({ error: "Failed to send email." });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[API] /api/email/report-to-agent failed:", err);
    res.status(500).json({ error: "Failed to send email." });
  }
});

app.delete(
  "/api/session/:sessionId",
  (req: Request<{ sessionId: string }>, res: Response) => {
    clearSession(req.params.sessionId);
    res.json({ ok: true });
  },
);

app.get(
  "/api/article/:topic",
  async (req: Request<{ topic: string }>, res: Response) => {
    const topic = req.params.topic;

    if (!topic || !topic.trim()) {
      res.status(400).json({ error: "A topic slug is required." });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, content, metadata")
        .eq("metadata->>topic", topic)
        .limit(1)
        .single();

      if (error || !data) {
        res.status(404).json({ error: "Article not found." });
        return;
      }

      res.json(data);
    } catch (err) {
      console.error("[API] /api/article failed:", err);
      res.status(500).json({ error: "Failed to fetch article." });
    }
  },
);

const server = app.listen(PORT, () => {
  console.log(`SupportPilot running at http://localhost:${PORT}`);
  if (isGitHubConfigured()) {
    console.log("[GitHub MCP] Integration enabled.");
  } else {
    console.log(
      "[GitHub MCP] Not configured — set GITHUB_PERSONAL_ACCESS_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME to enable.",
    );
  }
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nError: Port ${PORT} is already in use.\nRun: kill $(lsof -ti:${PORT})\n`,
    );
    process.exit(1);
  }
  throw err;
});
