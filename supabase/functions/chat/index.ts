import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es NexusAI, un assistant IA concis et clair. Tu réponds comme ChatGPT :

## Règles de longueur (PRIORITAIRE) :
- Sois CONCIS par défaut. Réponds en 2-4 paragraphes courts maximum.
- Ne détaille que si l'utilisateur le demande explicitement ("explique en détail", "développe", "détaille").
- Pour une question simple, une réponse courte de 2-3 phrases suffit.
- Pas de listes à rallonge : 3-5 points max.

## Mise en forme :
- Utilise des **mots en gras** pour les points clés
- Aère avec des paragraphes courts (2-3 phrases par paragraphe)
- Ajoute un emoji pertinent dans les titres si nécessaire (🎯 💡 🔥 ⚡)
- Structure avec des titres Markdown (## Titre) uniquement pour les réponses longues
- Utilise des blocs de code avec syntaxe quand nécessaire

## Ton :
- Naturel, direct et chaleureux
- Va droit au but, pas de remplissage
- Commence directement par la réponse, pas de phrase d'accroche inutile

Tu réponds dans la langue de l'utilisateur. Tu formates en markdown.`;

const TITLE_SYSTEM_PROMPT = "Tu es un générateur de titres. Tu génères un titre TRÈS COURT (max 6 mots) pour une conversation. Tu réponds UNIQUEMENT avec le titre, sans guillemets, sans ponctuation finale, sans explication.";

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, model, generateTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY)
      throw new Error("LOVABLE_API_KEY is not configured");

    const selectedModel = model || "google/gemini-2.5-flash";
    const systemContent = generateTitle ? TITLE_SYSTEM_PROMPT : SYSTEM_PROMPT;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: generateTitle ? "google/gemini-2.5-flash-lite" : selectedModel,
          messages: [
            { role: "system", content: systemContent },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit atteint, réessaye dans un moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits épuisés, ajoute des crédits à ton workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erreur du gateway IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
