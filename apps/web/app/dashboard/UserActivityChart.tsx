'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface ActivityRecord {
  created_at: string;
}

export function UserActivityChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/activity');
        const json = await res.json();
        const activity: ActivityRecord[] = json.activity || [];

        // Grouper l'activité par semaine (ou par jour)
        // Pour plus de simplicité et de visibilité, on groupe par jour sur les 7 ou 14 derniers jours travaillés,
        // ou par nom de jour de la semaine.
        
        // Regrouper par jour (Date)
        const activityByDate = activity.reduce((acc, record) => {
          const date = new Date(record.created_at).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        let chartData = Object.keys(activityByDate).map(date => ({
          date,
          sauvegardes: activityByDate[date]
        }));

        // Garder les 7 derniers jours d'activité
        chartData = chartData.slice(-7);

        setData(chartData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchActivity();
  }, []);

  if (loading) {
    return <div className="skeleton h-64 rounded-xl w-full"></div>;
  }

  if (data.length === 0) {
    return null; // Ne rien afficher si pas d'activité
  }

  return (
    <div className="mb-8 border border-zinc-800 bg-zinc-950/50 rounded-xl overflow-hidden flex flex-col h-[300px]">
      <div className="border-b border-zinc-800 p-4 bg-zinc-900/50 flex items-center gap-2">
        <Activity className="w-4 h-4 text-rush-500" />
        <h2 className="font-semibold text-white">Ma Progression (Derniers jours actifs)</h2>
      </div>
      <div className="p-4 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
              itemStyle={{ color: '#f59e0b' }} // Couleur Rush
              cursor={{ fill: '#27272a', opacity: 0.4 }}
            />
            <Bar dataKey="sauvegardes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
