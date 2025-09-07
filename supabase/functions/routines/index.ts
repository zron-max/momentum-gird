// supabase/functions/routines/index.ts
import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { user } = await supabase.auth.getUser(req);

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const url = new URL(req.url);
  const method = req.method;
  const id = url.searchParams.get("id");

  if (method === "GET") {
    // List all routines for user
    const { data, error } = await supabase
      .from("routines")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data), { status: 200 });
  }

  if (method === "POST") {
    const body = await req.json();
    const { title, tasks } = body;
    const { data, error } = await supabase
      .from("routines")
      .insert({ title, tasks, user_id: user.id })
      .select()
      .single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data), { status: 201 });
  }

  if (method === "PATCH" && id) {
    const body = await req.json();
    const { title, tasks } = body;
    const { data, error } = await supabase
      .from("routines")
      .update({ title, tasks })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data), { status: 200 });
  }

  if (method === "DELETE" && id) {
    const { error } = await supabase
      .from("routines")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(null, { status: 204 });
  }

  return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
});