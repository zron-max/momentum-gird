import { serve } from 'https://deno.land/std@0.178.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

console.log('Hello from Functions!')

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    },
  )

  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  const { method } = req

  try {
    switch (method) {
      case 'POST': {
        const { title, description, start_time, end_time, category } = await req.json()
        if (!title || !start_time || !end_time) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: title, start_time, end_time' }),
            { headers: { 'Content-Type': 'application/json' }, status: 400 },
          )
        }
        const { data, error } = await supabaseClient
          .from('time_blocks')
          .insert([{ user_id: user.id, title, description, start_time, end_time, category }])
          .select()
        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' },
          status: 201,
        })
      }
      case 'GET': {
        const { data, error } = await supabaseClient
          .from('time_blocks')
          .select('*')
          .eq('user_id', user.id)
        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      case 'PUT': {
        const { id, title, description, start_time, end_time, category } = await req.json()
        if (!id || !title || !start_time || !end_time) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: id, title, start_time, end_time' }),
            { headers: { 'Content-Type': 'application/json' }, status: 400 },
          )
        }
        const { data, error } = await supabaseClient
          .from('time_blocks')
          .update({ title, description, start_time, end_time, category })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      case 'DELETE': {
        const { id } = await req.json()
        if (!id) {
          return new Response(JSON.stringify({ error: 'Missing required field: id' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
          })
        }
        const { error } = await supabaseClient
          .from('time_blocks')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        return new Response(null, { status: 204 })
      }
      default:
        return new Response('Method Not Allowed', { status: 405 })
    }
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
