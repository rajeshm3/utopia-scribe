import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateContent } from "@/lib/generate.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

type Outputs = {
  linkedin_post: string;
  followup_email: string;
  press_angle: string;
};

const STORAGE_KEY = "studio-content-agent:last-output";
const HISTORY_KEY = "studio-content-agent:history";
const HISTORY_LIMIT = 5;
const MIN_TRANSCRIPT_LENGTH = 100;

type HistoryEntry = {
  id: string;
  snippet: string;
  timestamp: number;
  outputs: Outputs;
};

function Index() {
  const generate = useServerFn(generateContent);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Outputs | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw) as HistoryEntry[]);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!transcript.trim()) {
      setOutputs(null);
      setError(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, [transcript]);

  const handleGenerate = async () => {
    if (!transcript.trim() || loading) return;
    if (transcript.trim().length < MIN_TRANSCRIPT_LENGTH) {
      setError(
        "Please paste a fuller transcript - the agent needs meeting context to produce accurate content.",
      );
      return;
    }
    setLoading(true);
    setError(null);
    setOutputs(null);
    try {
      const result = await generate({ data: { transcript: transcript.trim() } });
      setOutputs(result);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      } catch {
        // ignore
      }
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        snippet: transcript.trim().slice(0, 60),
        timestamp: Date.now(),
        outputs: result,
      };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, HISTORY_LIMIT);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            Utopia Studio
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Studio Content Agent
          </h1>
          <p className="mt-2 text-muted-foreground">
            One transcript. Three publish-ready outputs.
          </p>
        </header>

        <div className="mb-8 -mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-background px-4 py-3 text-xs text-[#A3A3A3]">
          <span><span className="font-medium">Operator:</span> Marketing &amp; Events team</span>
          <span>·</span>
          <span>Replaces manual transcript reading and content writing</span>
          <span>·</span>
          <span>Maps to Utopia LAUNCH framework</span>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-lg shadow-black/20">
          <label htmlFor="transcript" className="text-sm font-medium">
            Paste Granola transcript here
          </label>
          <Textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the full meeting transcript…"
            className="mt-3 min-h-[220px] resize-y border-border bg-background text-sm leading-relaxed focus-visible:ring-ring"
            disabled={loading}
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {transcript.length.toLocaleString()} characters
            </span>
            <Button
              onClick={handleGenerate}
              disabled={loading || !transcript.trim()}
              className="bg-[#FAFAFA] text-[#171717] hover:bg-[#FAFAFA]/90"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
              {error}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-5">
          <OutputCard title="LinkedIn Post" stage="Lead" content={outputs?.linkedin_post ?? ""} loading={loading} />
          <OutputCard title="Follow-up Email" stage="Nurture" content={outputs?.followup_email ?? ""} loading={loading} />
          <OutputCard title="Press Angle" stage="Amplify" content={outputs?.press_angle ?? ""} loading={loading} />
        </section>

        <section className="mt-5">
          <JsonOutput outputs={outputs} loading={loading} />
        </section>

        <section className="mt-5">
          <GenerationHistory
            history={history}
            onSelect={(entry) => {
              setOutputs(entry.outputs);
              setError(null);
            }}
          />
        </section>
      </div>
    </main>
  );
}

function GenerationHistory({
  history,
  onSelect,
}: {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Generation History
      </h2>
      {history.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No generations yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {history.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className="flex w-full items-center justify-between gap-4 py-3 text-left hover:opacity-80"
              >
                <span className="truncate text-sm text-foreground/90">
                  {entry.snippet}
                  {entry.snippet.length >= 60 ? "…" : ""}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function OutputCard({
  title,
  stage,
  content,
  loading,
}: {
  title: string;
  stage: string;
  content: string;
  loading: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          disabled={!content}
          className="h-8 gap-1.5 text-xs hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="mt-3 min-h-[80px] whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        ) : content ? (
          content
        ) : (
          <span className="text-muted-foreground">Output will appear here.</span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">LAUNCH Stage</span>
        <span className="rounded-full bg-[#2A2A2A] px-2 py-0.5 text-[11px] font-medium text-[#A3A3A3]">
          {stage}
        </span>
      </div>
    </article>
  );
}

function JsonOutput({ outputs, loading }: { outputs: Outputs | null; loading: boolean }) {
  const [copied, setCopied] = useState(false);
  const structured = {
    linkedin_post: { content: outputs?.linkedin_post ?? "", launch_stage: "Lead" },
    followup_email: { content: outputs?.followup_email ?? "", launch_stage: "Nurture" },
    press_angle: { content: outputs?.press_angle ?? "", launch_stage: "Amplify" },
  };
  const json = JSON.stringify(structured, null, 2);

  const handleCopy = async () => {
    if (!outputs) return;
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          JSON Output
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          disabled={!outputs}
          className="h-8 gap-1.5 text-xs hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy JSON"}
        </Button>
      </div>
      <pre className="mt-3 max-h-96 overflow-auto rounded-lg border border-border bg-[#141414] p-4 font-mono text-xs leading-relaxed text-foreground/90">
        {loading ? "Generating…" : json}
      </pre>
    </article>
  );
}
