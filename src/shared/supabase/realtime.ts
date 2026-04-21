import { supabase } from '@/shared/supabase/client';

export function createCampaignChannel(campaignId: string) {
  return supabase.channel(`campaign:${campaignId}`);
}

export function removeChannel(channel: ReturnType<typeof createCampaignChannel>) {
  return supabase.removeChannel(channel);
}
