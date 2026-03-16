import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Property } from '../types';
import { useProperties } from './useProperties';

export type TimeFilter = 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'ALL_TIME';

export const useAnalyticsData = (filter: TimeFilter, selectedPropertyId?: string | null) => {
  const [totalPageViews, setTotalPageViews] = useState(0);
  const [totalPropertyViews, setTotalPropertyViews] = useState(0);
  const [totalWhatsAppClicks, setTotalWhatsAppClicks] = useState(0);
  const [topProperties, setTopProperties] = useState<{ property: Property, views: number, whatsappClicks: number }[]>([]);
  const [chartData, setChartData] = useState<{ date: string; pageViews: number; propertyViews: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const { properties } = useProperties();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (properties.length === 0) return;
      
      setLoading(true);
      try {
        let query = supabase.from('analytics_events').select('*');

        if (filter !== 'ALL_TIME') {
          const now = new Date();
          let startDate = new Date();

          if (filter === 'TODAY') {
            startDate.setHours(0, 0, 0, 0);
          } else if (filter === 'LAST_7_DAYS') {
            startDate.setDate(now.getDate() - 7);
          } else if (filter === 'THIS_MONTH') {
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
          }

          query = query.gte('created_at', startDate.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;

        let pageViews = 0;
        let propViews = 0;
        let whatsClicks = 0;
        const propCounts: Record<string, number> = {};
        const whatsappCounts: Record<string, number> = {};
        const timeSeries: Record<string, { pageViews: number; propertyViews: number }> = {};

        if (data) {
          data.forEach((event) => {
            const dateStr = new Date(event.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            
            if (!timeSeries[dateStr]) {
                timeSeries[dateStr] = { pageViews: 0, propertyViews: 0 };
            }

            // Always calculate propCounts and whatsappCounts for the Ranking
            if (event.event_type === 'PROPERTY_VIEW' && event.property_id) {
                propCounts[event.property_id] = (propCounts[event.property_id] || 0) + 1;
            }
            if (event.event_type === 'WHATSAPP_CLICK' && event.property_id) {
                whatsappCounts[event.property_id] = (whatsappCounts[event.property_id] || 0) + 1;
            }

            // Filter data tracking based on selection
            if (selectedPropertyId) {
                if (event.property_id === selectedPropertyId) {
                    if (event.event_type === 'PROPERTY_VIEW') {
                        propViews++;
                        timeSeries[dateStr].propertyViews++;
                    } else if (event.event_type === 'WHATSAPP_CLICK') {
                        whatsClicks++;
                    }
                }
            } else {
                if (event.event_type === 'PAGE_VIEW') {
                  pageViews++;
                  timeSeries[dateStr].pageViews++;
                } else if (event.event_type === 'PROPERTY_VIEW' && event.property_id) {
                  propViews++;
                  timeSeries[dateStr].propertyViews++;
                } else if (event.event_type === 'WHATSAPP_CLICK') {
                  whatsClicks++;
                }
            }
          });
        }

        setTotalPageViews(pageViews);
        setTotalPropertyViews(propViews);
        setTotalWhatsAppClicks(whatsClicks);
        
        const chartArray = Object.entries(timeSeries).map(([date, counts]) => ({
            date,
            ...counts
        }));
        setChartData(chartArray);

        const ranked = properties
          .map((prop) => ({
            property: prop,
            views: propCounts[prop.id] || 0,
            whatsappClicks: whatsappCounts[prop.id] || 0,
          }))
          .sort((a, b) => b.views - a.views);

        setTopProperties(ranked);

      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [filter, properties, selectedPropertyId]);

  return { totalPageViews, totalPropertyViews, totalWhatsAppClicks, topProperties, chartData, loading };
};
