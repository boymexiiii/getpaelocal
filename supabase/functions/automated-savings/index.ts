import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getNextRun(current: Date, frequency: string): Date {
  const next = new Date(current)
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
    default:
      next.setDate(next.getDate() + 1)
  }
  return next
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Find all active savings plans due for execution
  const { data: plans, error: plansError } = await supabase
    .from('savings_plans')
    .select('*')
    .eq('active', true)
    .lte('next_run', new Date().toISOString())

  if (plansError) {
    return new Response(JSON.stringify({ error: plansError.message }), { status: 500, headers: corsHeaders })
  }

  let processed = 0
  for (const plan of plans || []) {
    // Create a savings transaction
    const { error: txError } = await supabase.from('savings_transactions').insert({
      user_id: plan.user_id,
      plan_id: plan.id,
      amount: plan.amount,
      status: 'pending',
      run_at: new Date().toISOString(),
    })
    if (txError) continue
    // Update next_run
    const nextRun = getNextRun(new Date(plan.next_run || new Date()), plan.frequency)
    await supabase.from('savings_plans').update({ next_run: nextRun.toISOString() }).eq('id', plan.id)
    processed++
  }

  return new Response(JSON.stringify({ success: true, processed }), { status: 200, headers: corsHeaders })
}) 