'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export function AdminCharts({ visits, projects }: { visits: any[], projects: any[] }) {
  // Grouper les visites par jour
  const visitsByDate = visits.reduce((acc, visit) => {
    const date = new Date(visit.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const visitsData = Object.keys(visitsByDate).map(date => ({
    date,
    visiteurs: visitsByDate[date]
  })).reverse(); // Pour avoir l'ordre chronologique

  // Si on n'a pas de données, on met des fausses données pour l'aperçu
  const finalVisitsData = visitsData.length > 0 ? visitsData : [
    { date: '15 Jul', visiteurs: 4 },
    { date: '16 Jul', visiteurs: 12 },
    { date: '17 Jul', visiteurs: 8 },
    { date: '18 Jul', visiteurs: 25 },
    { date: '19 Jul', visiteurs: 18 },
    { date: '20 Jul', visiteurs: 40 },
    { date: '21 Jul', visiteurs: 30 },
  ];

  // Grouper les projets par date de création
  const projectsByDate = projects.reduce((acc, project) => {
    const date = new Date(project.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const projectsData = Object.keys(projectsByDate).map(date => ({
    date,
    projets: projectsByDate[date]
  })).reverse();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Graphique des Visites */}
      <div className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden flex flex-col h-[400px]">
        <div className="border-b border-zinc-800 p-4 bg-zinc-900/50">
          <h2 className="font-semibold text-white">Évolution des Visites</h2>
        </div>
        <div className="p-4 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={finalVisitsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#ec4899' }}
              />
              <Line type="monotone" dataKey="visiteurs" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique des Projets */}
      <div className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden flex flex-col h-[400px]">
        <div className="border-b border-zinc-800 p-4 bg-zinc-900/50">
          <h2 className="font-semibold text-white">Création de Projets</h2>
        </div>
        <div className="p-4 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectsData.length > 0 ? projectsData : [{date: 'Aujourd\'hui', projets: 0}]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#22c55e' }}
                cursor={{ fill: '#27272a', opacity: 0.4 }}
              />
              <Bar dataKey="projets" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
