import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
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

function Index() {
  const generate = useServerFn(generateContent);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Outputs | null>(null);

  const handleGenerate = async () => {
    if (!transcript.trim() || loading) return;
    setLoading(true);
    setError(null);
    setOutputs(null);
    try {
      const result = await generate({ data: { transcript: transcript.trim() } });
      setOutputs(result);
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
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Utopia Studio
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Studio Content Agent
          </h1>
          <p className="mt-2 text-muted-foreground">
            Paste a Granola meeting transcript. Get a LinkedIn post, follow-up email, and press angle.
          </p>
        </header>

        <div className="mb-8 -mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs text-foreground/80">
          <span><span className="font-semibold text-primary">Operator:</span> Marketing &amp; Events team</span>
          <span className="text-muted-foreground">·</span>
          <span>Replaces manual transcript reading and content writing</span>
          <span className="text-muted-foreground">·</span>
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
            className="mt-3 min-h-[220px] resize-y border-border bg-background/50 text-sm leading-relaxed focus-visible:ring-primary"
            disabled={loading}
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {transcript.length.toLocaleString()} characters
            </span>
            <Button
              onClick={handleGenerate}
              disabled={loading || !transcript.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
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
      </div>
    </main>
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
          className="h-8 gap-1.5 text-xs hover:bg-primary/10 hover:text-primary"
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
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
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
          className="h-8 gap-1.5 text-xs hover:bg-primary/10 hover:text-primary"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy JSON"}
        </Button>
      </div>
      <pre className="mt-3 max-h-96 overflow-auto rounded-lg border border-border bg-background/50 p-4 font-mono text-xs leading-relaxed text-foreground/90">
        {loading ? "Generating…" : json}
      </pre>
    </article>
  );
}
