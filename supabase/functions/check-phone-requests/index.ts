import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PhoneRequest {
  id: string;
  user_id: string;
  keywords: string;
  min_price: number | null;
  max_price: number | null;
  city: string | null;
  storage: string | null;
  condition: string | null;
  brand_id: string | null;
  is_active: boolean;
}

interface Phone {
  id: string;
  name: string;
  price: number;
  city: string;
  storage: string;
  condition: string;
  brand_id: string | null;
  owner_id: string;
  description: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { phone } = await req.json() as { phone: Phone };

    if (!phone) {
      console.log("No phone data provided");
      return new Response(
        JSON.stringify({ error: "No phone data provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Processing phone:", phone.id, phone.name);

    // Get all active phone requests
    const { data: requests, error: requestsError } = await supabase
      .from("phone_requests")
      .select("*")
      .eq("is_active", true);

    if (requestsError) {
      console.error("Error fetching requests:", requestsError);
      throw requestsError;
    }

    console.log("Found", requests?.length || 0, "active requests");

    const matchingRequests: PhoneRequest[] = [];

    // Check each request for matches
    for (const request of (requests || []) as PhoneRequest[]) {
      // Skip if the request is from the phone owner
      if (request.user_id === phone.owner_id) {
        continue;
      }

      let matches = true;

      // Check keywords (case-insensitive partial match)
      const keywords = request.keywords.toLowerCase().split(/\s+/);
      const phoneName = phone.name.toLowerCase();
      const phoneDesc = (phone.description || "").toLowerCase();
      
      const keywordMatches = keywords.some(keyword => 
        phoneName.includes(keyword) || phoneDesc.includes(keyword) || keyword.includes(phoneName.split(' ')[0])
      );
      
      if (!keywordMatches) {
        matches = false;
      }

      // Check brand if specified
      if (matches && request.brand_id && phone.brand_id !== request.brand_id) {
        matches = false;
      }

      // Check city if specified
      if (matches && request.city && phone.city !== request.city) {
        matches = false;
      }

      // Check storage if specified
      if (matches && request.storage && phone.storage !== request.storage) {
        matches = false;
      }

      // Check condition if specified
      if (matches && request.condition && phone.condition !== request.condition) {
        matches = false;
      }

      // Check price range
      if (matches && request.min_price !== null && phone.price < request.min_price) {
        matches = false;
      }
      if (matches && request.max_price !== null && phone.price > request.max_price) {
        matches = false;
      }

      if (matches) {
        matchingRequests.push(request);
      }
    }

    console.log("Matching requests:", matchingRequests.length);

    // Create notifications for matching requests
    const notifications = matchingRequests.map(request => ({
      user_id: request.user_id,
      phone_id: phone.id,
      request_id: request.id,
      title: "Yangi telefon topildi!",
      message: `"${request.keywords}" so'rovingizga mos telefon e'lon qilindi: ${phone.name}`,
      is_read: false,
    }));

    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationError) {
        console.error("Error creating notifications:", notificationError);
        throw notificationError;
      }

      console.log("Created", notifications.length, "notifications");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        matchingRequests: matchingRequests.length,
        notificationsCreated: notifications.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in check-phone-requests:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
