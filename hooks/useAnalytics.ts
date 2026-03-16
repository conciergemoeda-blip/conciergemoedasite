import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAnalytics = () => {
  const trackPageView = async (path: string) => {
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'PAGE_VIEW',
        path,
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  const trackPropertyView = async (propertyId: string, path: string) => {
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'PROPERTY_VIEW',
        property_id: propertyId,
        path,
      });
    } catch (error) {
      console.error('Error tracking property view:', error);
    }
  };
  const trackWhatsAppClick = async (propertyId: string, path: string) => {
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'WHATSAPP_CLICK',
        property_id: propertyId,
        path,
      });
    } catch (error) {
      console.error('Error tracking WhatsApp click:', error);
    }
  };

  return { trackPageView, trackPropertyView, trackWhatsAppClick };
};
