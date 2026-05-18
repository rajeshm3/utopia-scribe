# Studio Content Agent

Turns a Granola meeting transcript into three publish-ready outputs in one run: a LinkedIn post, a personalised follow-up email, and a press angle sentence - each mapped to a stage of the Utopia LAUNCH framework.

Built for the Marketing & Events operator at Utopia Studio.

## How to run

Live at: https://utopia-scribe.lovable.app

Paste a Granola transcript from a Utopia co-build session. Hit Generate Content. Copy the outputs.

## What it does

1. Takes a raw Granola transcript as input
2. Sends it to the Claude API (claude-sonnet-4-5) with a system prompt built around Utopia's voice - declarative, specific, no hedging
3. Returns structured JSON with three keys: linkedin_post, followup_email, press_angle - each with a launch_stage label
4. Displays outputs in a clean UI with copy buttons
5. JSON output at the bottom is readable by a downstream agent without a human in the middle
6. Saves generation history locally - operators can retrieve outputs from past sessions without regenerating

## Prompt used

System prompt sent to Claude API:

You are a content operator for Utopia Studio, an AI-native venture studio based in Doha. Your voice is declarative, specific, and confident. No hedging. No filler. You publish opinions not summaries. Only use information explicitly stated in the transcript. Do not invent, assume, or extrapolate any facts, names, numbers, or events not directly mentioned.

Given a meeting transcript, produce exactly three outputs in JSON format:
- linkedin_post: A LinkedIn post for Utopia Studio. Max 150 words. Specific insight from the meeting, not a summary. Maps to LAUNCH stage: Lead.
- followup_email: A personalised follow-up email to the key attendee. Subject line included. Max 100 words. References something specific they said. Maps to LAUNCH stage: Nurture.
- press_angle: One sentence. Specific enough for a journalist to write a story from. Maps to LAUNCH stage: Amplify.

Return only valid JSON with these three keys. No other text.

## Tools and APIs called

- Anthropic Claude API (claude-sonnet-4-5)
- Lovable (frontend build and deployment)

## Input validation

- Transcripts under 100 characters are blocked with a warning
- Operator instruction shown above input: paste Granola transcripts from Utopia co-build sessions only
- Agent handles English and Arabic transcripts

## Non-technical spec

Input: raw Granola transcript (text)
Processing: Claude API call with Utopia voice system prompt
Output: JSON with linkedin_post, followup_email, press_angle, each with launch_stage
Downstream: JSON is machine-readable for the next agent in Utopia OS
