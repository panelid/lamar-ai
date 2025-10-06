export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("✅ Lamar-AI aktif di Cloudflare Workers!");
    }

    if (url.pathname === "/generate" && request.method === "POST") {
      const { name, experience, skills } = await request.json();

      const prompt = `Buatkan deskripsi CV profesional untuk seseorang bernama ${name}.
      Pengalaman: ${experience}. Skill: ${skills}.
      Gunakan bahasa Indonesia yang sopan dan profesional.`;

      const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", { prompt });

      const id = crypto.randomUUID();
      await env.CVS.put(id, JSON.stringify({
        name, experience, skills,
        result,
        created_at: new Date().toISOString(),
      }));

      return new Response(JSON.stringify({ id, result }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname.startsWith("/cv/")) {
      const id = url.pathname.split("/cv/")[1];
      const data = await env.CVS.get(id);
      return data
        ? new Response(data, { headers: { "Content-Type": "application/json" } })
        : new Response("CV tidak ditemukan", { status: 404 });
    }

    return new Response("404 Not Found", { status: 404 });
  },
};
