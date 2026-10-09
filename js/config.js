// Supabase Public Configuration for Kanwal Shoes Store
// The anon key is public by design for browser clients.
// NEVER put any secret administrative key here or in client code.
const SUPABASE_CONFIG = {
  url: "https://xwelwgyudlpfukqwtwwo.supabase.co",
  anonKey: "sb_publishable_moplyXNxhuzaCN_YYzH01A_A5i3I-_1"
};

// Initialize the Supabase client when the library is loaded
let sbClient = null;
function getSupabase() {
  if (sbClient) return sbClient;
  if (typeof window !== "undefined" && window.supabase && typeof window.supabase.createClient === "function") {
    sbClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return sbClient;
  }
  return null;
}
