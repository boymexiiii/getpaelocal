// supabase/functions/bvn-verify/index.ts
// Supabase Edge Function (Deno runtime)

const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');

Deno.serve(async (req) => {
  try {
    const { bvn } = await req.json();
    if (!bvn) {
      return new Response(JSON.stringify({ status: 'error', message: 'BVN is required' }), { status: 400 });
    }
    if (!flutterwaveSecretKey) {
      return new Response(JSON.stringify({ status: 'error', message: 'Flutterwave secret key not configured' }), { status: 500 });
    }
    const response = await fetch(`https://api.flutterwave.com/v3/kyc/bvns/${bvn}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' }, status: response.status });
  } catch (error) {
    return new Response(JSON.stringify({ status: 'error', message: error.message || 'Unexpected error' }), { status: 500 });
  }
}); 