import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  try {
    // JWT Authentication
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let authedUser = null;
    let authedRole = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = authHeader.replace('Bearer ', '');
      const { data: userData, error: jwtError } = await supabase.auth.getUser(jwt);
      if (!jwtError && userData?.user) {
        authedUser = userData.user;
        authedRole = userData.user.user_metadata?.role || userData.user.role || null;
      }
    }
    if (!authedUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const { document_id } = await req.json();
    if (!document_id) {
      return new Response(JSON.stringify({ error: 'Missing document_id' }), { status: 400 });
    }

    // Fetch document metadata
    const { data: doc, error: docError } = await supabase
      .from('kyc_documents')
      .select('user_id, storage_path')
      .eq('id', document_id)
      .single();
    if (docError || !doc) {
      return new Response(JSON.stringify({ error: 'Document not found' }), { status: 404 });
    }

    // Only the document owner or an admin can access
    if (doc.user_id !== authedUser.id && authedRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Generate signed URL (5 minutes)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(doc.storage_path, 60 * 5); // 5 minutes
    if (signedUrlError || !signedUrlData) {
      return new Response(JSON.stringify({ error: 'Failed to generate signed URL' }), { status: 500 });
    }

    return new Response(JSON.stringify({ url: signedUrlData.signedUrl }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}); 