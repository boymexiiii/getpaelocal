
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { bvn, user_id } = await req.json()

    if (!bvn || !user_id) {
      return new Response(
        JSON.stringify({ error: 'BVN and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate BVN format (11 digits)
    if (!/^\d{11}$/.test(bvn)) {
      return new Response(
        JSON.stringify({ error: 'Invalid BVN format. Must be 11 digits.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const monoSecretKey = Deno.env.get('MONO_SECRET_KEY')
    if (!monoSecretKey) {
      console.error('MONO_SECRET_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'BVN verification service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Mono BVN verification API
    const monoResponse = await fetch('https://api.withmono.com/v2/lookup/bvn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mono-secret-key': monoSecretKey,
      },
      body: JSON.stringify({ bvn })
    })

    const monoData = await monoResponse.json()
    console.log('Mono BVN verification response:', monoData)

    if (!monoResponse.ok) {
      console.error('Mono API error:', monoData)
      return new Response(
        JSON.stringify({ 
          error: 'BVN verification failed', 
          details: monoData.message || monoData.error || 'Unknown error' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if BVN verification was successful
    if (!monoData.data) {
      return new Response(
        JSON.stringify({ 
          error: 'BVN verification failed', 
          details: 'No verification data returned' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update KYC application with BVN verification data
    const { error: updateError } = await supabaseClient
      .from('kyc_applications')
      .update({
        bvn_verified: true,
        bvn_verification_data: monoData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)

    if (updateError) {
      console.error('Error updating KYC application:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update verification status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return success response with verification data
    const bvnData = monoData.data;
    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        data: {
          first_name: bvnData.first_name || bvnData.firstName,
          last_name: bvnData.last_name || bvnData.lastName,
          date_of_birth: bvnData.date_of_birth || bvnData.dob || bvnData.dateOfBirth,
          phone: bvnData.phone || bvnData.mobile,
          verification_status: 'verified',
          gender: bvnData.gender,
          middle_name: bvnData.middle_name || bvnData.middleName,
          enrollment_bank: bvnData.enrollment_bank,
          enrollment_branch: bvnData.enrollment_branch
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('BVN verification error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
