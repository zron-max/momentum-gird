// supabase/functions/routine-entries/index.ts
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
  const routine_id = url.searchParams.get("routine_id");

  if (method === "GET" && routine_id) {
    // List all entries for a routine
    const { data, error } = await supabase
      .from("routine_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("routine_id", routine_id)
      .order("date", { ascending: true });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data), { status: 200 });
  }

  if (method === "POST") {
    const body = await req.json();
    const { routine_id, date, completed_tasks } = body;
    const { data, error } = await supabase
      .from("routine_entries")
      .insert({
        routine_id,
        date,
        completed_tasks,
        user_id: user.id,
      })
      .select()
      .single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data), { status: 201 });
  }

  if (method === "PATCH" && id) {
    const body = await req.json();
    const { completed_tasks } = body;
    const { data, error } = await supabase
      .from("routine_entries")
      .update({ completed_tasks })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data), { status: 200 });
  }

  if (method === "DELETE" && id) {
    const { error } = await supabase
      .from("routine_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(null, { status: 204 });
  }

  return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
});