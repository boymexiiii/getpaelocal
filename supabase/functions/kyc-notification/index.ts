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
    const { kyc_id, action, admin_notes } = await req.json();
    
    if (!kyc_id || !action) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: 'KYC ID and action are required' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get KYC application details
    const { data: kycData, error: kycError } = await supabase
      .from('kyc_applications')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', kyc_id)
      .single();

    if (kycError || !kycData) {
      return new Response(
        JSON.stringify({ 
          status: 'error', 
          message: 'KYC application not found' 
        }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create notification based on action
    let notificationTitle = '';
    let notificationMessage = '';
    let notificationType = '';

    switch (action) {
      case 'approved':
        notificationTitle = 'KYC Verification Approved';
        notificationMessage = `Congratulations! Your KYC verification has been approved. You now have access to all Pae features.`;
        notificationType = 'kyc_approved';
        break;
      case 'rejected':
        notificationTitle = 'KYC Verification Rejected';
        notificationMessage = `Your KYC verification was rejected. Reason: ${admin_notes || 'Please review your submitted documents and try again.'}`;
        notificationType = 'kyc_rejected';
        break;
      case 'under_review':
        notificationTitle = 'KYC Under Review';
        notificationMessage = 'Your KYC application is now under review. We will notify you once the review is complete.';
        notificationType = 'kyc_review';
        break;
      default:
        return new Response(
          JSON.stringify({ 
            status: 'error', 
            message: 'Invalid action' 
          }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    // Create notification record
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: kycData.user_id,
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        status: 'unread',
        data: {
          kyc_id: kyc_id,
          action: action,
          admin_notes: admin_notes
        }
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    // Send real-time notification
    const { error: realtimeError } = await supabase
      .from('notifications')
      .insert({
        user_id: kycData.user_id,
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        status: 'unread',
        channels: ['in_app', 'email'],
        data: {
          kyc_id: kyc_id,
          action: action,
          admin_notes: admin_notes
        }
      });

    if (realtimeError) {
      console.error('Error sending real-time notification:', realtimeError);
    }

    // Log admin action
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: kycData.user_id,
        action: `kyc_${action}`,
        table_name: 'kyc_applications',
        record_id: kyc_id,
        old_data: { status: kycData.status },
        new_data: { 
          status: action,
          admin_notes: admin_notes,
          reviewed_at: new Date().toISOString()
        }
      });

    if (auditError) {
      console.error('Error logging audit:', auditError);
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: `KYC ${action} notification sent successfully`,
        data: {
          kyc_id: kyc_id,
          action: action,
          user_id: kycData.user_id
        }
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('KYC notification error:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: error.message || 'Internal server error' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 