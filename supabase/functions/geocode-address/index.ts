import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, zipcode } = await req.json();

    // Prioritize CEP (zipcode) for geocoding
    const searchQuery = zipcode ? `${zipcode}, Brasil` : address;

    if (!searchQuery) {
      return new Response(
        JSON.stringify({ error: "Address or zipcode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MAPBOX_TOKEN = Deno.env.get("MAPBOX_PUBLIC_TOKEN");

    if (!MAPBOX_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Mapbox token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Geocoding query:", searchQuery);

    // Call Mapbox Geocoding API - prioritize postal code type if using zipcode
    const types = zipcode ? "postcode,place" : "address,place";
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=br&limit=1&types=${types}`
    );

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      console.log("Geocoding result:", { lng, lat, placeName: data.features[0].place_name });
      return new Response(
        JSON.stringify({ 
          success: true, 
          coordinates: { lng, lat },
          placeName: data.features[0].place_name 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: if zipcode search failed, try with full address
    if (zipcode && address) {
      console.log("Zipcode search failed, trying full address:", address);
      const fallbackResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=br&limit=1`
      );

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.features && fallbackData.features.length > 0) {
          const [lng, lat] = fallbackData.features[0].center;
          console.log("Fallback result:", { lng, lat, placeName: fallbackData.features[0].place_name });
          return new Response(
            JSON.stringify({ 
              success: true, 
              coordinates: { lng, lat },
              placeName: fallbackData.features[0].place_name 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: "Location not found" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Geocoding error:", error);
    const errorMessage = error instanceof Error ? error.message : "Geocoding failed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
