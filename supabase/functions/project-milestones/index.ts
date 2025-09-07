// supabase/functions/project-milestones/index.ts
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
  const project_id = url.searchParams.get("project_id");

  if (method === "GET" && project_id) {
    // List all milestones for a project
    const { data, error } = await supabase
      .from("project_milestones")
      .select("*")
      .eq("user_id", user.id)
      .eq("project_id", project_id)
      .order("due_date", { ascending: true });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data), { status: 200 });
  }

  if (method === "POST") {
    const body = await req.json();
    const { project_id, title, due_date, status, description } = body;
    const { data, error } = await supabase
      .from("project_milestones")
      .insert({
        project_id,
        title,
        due_date,
        status,
        description,
        user_id: user.id,
      })
      .select()
      .single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data), { status: 201 });
  }

  if (method === "PATCH" && id) {
    const body = await req.json();
    const { title, due_date, status, description } = body;
    const { data, error } = await supabase
      .from("project_milestones")
      .update({ title, due_date, status, description })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify(data), { status: 200 });
  }

  if (method === "DELETE" && id) {
    const { error } = await supabase
      .from("project_milestones")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(null, { status: 204 });
  }

  return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
});