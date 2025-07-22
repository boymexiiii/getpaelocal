import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple auto-categorization based on description keywords
const categoryKeywords: Record<string, string[]> = {
  food: ['restaurant', 'food', 'eat', 'dining', 'cafe', 'bar'],
  transport: ['uber', 'taxi', 'transport', 'bus', 'fuel', 'bolt', 'ride'],
  bills: ['electricity', 'water', 'bill', 'airtime', 'data', 'cable', 'gotv', 'dstv'],
  shopping: ['shop', 'mall', 'market', 'store', 'supermarket'],
  investment: ['investment', 'crypto', 'bitcoin', 'stock', 'shares'],
  transfer: ['send', 'receive', 'transfer', 'wallet'],
  salary: ['salary', 'payroll', 'wages'],
  health: ['hospital', 'pharmacy', 'health', 'clinic'],
  education: ['school', 'tuition', 'education', 'lesson'],
  entertainment: ['movie', 'cinema', 'entertainment', 'music', 'concert'],
  other: []
};

function autoCategorize(description: string): string {
  if (!description) return 'other';
  const desc = description.toLowerCase();
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(k => desc.includes(k))) return cat;
  }
  return 'other';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers: corsHeaders });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    // Fetch all user transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
    // Auto-categorize uncategorized transactions
    for (const tx of transactions) {
      if (!tx.category) {
        const category = autoCategorize(tx.description || '');
        await supabase.from('transactions').update({ category }).eq('id', tx.id);
        tx.category = category;
      }
    }
    // Aggregate totals per category
    const totalsByCategory: Record<string, number> = {};
    for (const tx of transactions) {
      const cat = tx.category || 'other';
      totalsByCategory[cat] = (totalsByCategory[cat] || 0) + Number(tx.amount);
    }
    // Aggregate totals per month
    const totalsByMonth: Record<string, number> = {};
    for (const tx of transactions) {
      const month = tx.created_at ? tx.created_at.slice(0, 7) : 'unknown';
      totalsByMonth[month] = (totalsByMonth[month] || 0) + Number(tx.amount);
    }
    return new Response(
      JSON.stringify({
        totalsByCategory,
        totalsByMonth,
        transactions
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}); 