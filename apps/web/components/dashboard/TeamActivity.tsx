"use client";

interface TeamActivityItem {
  id: string;
  userName: string;
  action: string;
  timeAgo: string;
  avatar?: string;
}

interface TeamActivityProps {
  activities?: TeamActivityItem[];
}

const defaultActivities: TeamActivityItem[] = [
  {
    id: "1",
    userName: "Dra. Elena R.",
    action: "revisó el contrato de Inmobiliaria Sol.",
    timeAgo: "Hace 15 min",
  },
  {
    id: "2",
    userName: "Marcos P.",
    action: "subió 3 nuevos anexos al Caso #482.",
    timeAgo: "Hace 1 hora",
  },
];

export function TeamActivity({ activities = defaultActivities }: TeamActivityProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="font-bold mb-4">Actividad del Equipo</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-600 dark:text-slate-400 font-semibold text-xs">
              {activity.avatar ? (
                <img
                  src={activity.avatar}
                  alt={activity.userName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{activity.userName.charAt(0)}</span>
              )}
            </div>
            <div className="text-xs">
              <p>
                <span className="font-bold">{activity.userName}</span> {activity.action}
              </p>
              <p className="text-slate-400 dark:text-slate-500 mt-0.5">{activity.timeAgo}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

