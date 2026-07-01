import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { SECURA_SYSTEM_PROMPT } from "@/lib/secura-prompt";
import type { Database } from "@/integrations/supabase/types";

type ChatBody = { messages?: UIMessage[]; threadId?: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        if (!LOVABLE_API_KEY) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
        });
        const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userRes.user) return new Response("Unauthorized", { status: 401 });
        const userId = userRes.user.id;

        const { messages, threadId } = (await request.json()) as ChatBody;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("Bad request", { status: 400 });
        }

        // Verify thread belongs to user
        const { data: thread, error: threadErr } = await supabase
          .from("threads")
          .select("id, user_id, title")
          .eq("id", threadId)
          .maybeSingle();
        if (threadErr || !thread || thread.user_id !== userId) {
          return new Response("Forbidden", { status: 403 });
        }

        // Persist the latest user message (last in array)
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        if (lastUser) {
          const { data: existing } = await supabase
            .from("messages")
            .select("id")
            .eq("thread_id", threadId)
            .eq("role", "user")
            .order("created_at", { ascending: false })
            .limit(1);
          const lastText = lastUser.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("")
            .trim();
          const { data: lastRow } = existing?.length
            ? await supabase.from("messages").select("parts").eq("id", existing[0].id).single()
            : { data: null };
          const lastRowText = lastRow
            ? (lastRow.parts as UIMessage["parts"])
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("")
                .trim()
            : "";
          if (lastText && lastText !== lastRowText) {
            await supabase.from("messages").insert({
              thread_id: threadId,
              user_id: userId,
              role: "user",
              parts: lastUser.parts as unknown as Database["public"]["Tables"]["messages"]["Insert"]["parts"],
            });
            // If thread has default title, use first user message
            if (thread.title === "Nouvel audit") {
              await supabase
                .from("threads")
                .update({ title: lastText.slice(0, 80) })
                .eq("id", threadId);
            }
          }
        }

        const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SECURA_SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
          onError: ({ error }) => console.error("streamText error:", error),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            const assistant = [...finalMessages].reverse().find((m) => m.role === "assistant");
            if (assistant) {
              await supabase.from("messages").insert({
                thread_id: threadId,
                user_id: userId,
                role: "assistant",
                parts: assistant.parts as unknown as Database["public"]["Tables"]["messages"]["Insert"]["parts"],
              });
            }
          },
        });
      },
    },
  },
});
