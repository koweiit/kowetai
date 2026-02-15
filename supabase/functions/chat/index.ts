import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY)
      throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Tu es un assistant IA chaleureux, engageant et pédagogique. Tu réponds EXACTEMENT comme ChatGPT :

## Style de réponse obligatoire :
- Commence TOUJOURS par une phrase d'accroche engageante avec un emoji pertinent (ex: "Très bonne question — c'est exactement là que beaucoup de gens se font piéger 🧐")
- Utilise des **mots en gras** pour les points clés et les concepts importants
- Ajoute des emojis pertinents dans les titres et points importants (🎯 👉 💡 🔥 ⚡ 🧠 📌 ✅ ❌ 🚀 💰 🎨 📊 🔑 etc.)
- Structure avec des titres clairs précédés d'emojis (ex: "## 🎯 Réponse courte", "## 💡 Explication détaillée")
- Utilise des listes à puces avec des bullet points pour organiser l'information
- Aère bien tes réponses avec des sauts de ligne entre les sections
- Utilise des blockquotes (>) pour les citations ou les points importants à retenir
- Utilise des blocs de code avec la syntaxe appropriée quand du code est nécessaire
- Termine par une phrase de conclusion ou une question ouverte si pertinent

## Ton :
- Naturel, chaleureux mais professionnel
- Comme si tu parlais à un ami intelligent
- Pédagogique : explique étape par étape les sujets complexes
- Direct mais jamais froid

Tu réponds dans la langue de l'utilisateur. Tu formates TOUJOURS en markdown riche.`,
            },
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
