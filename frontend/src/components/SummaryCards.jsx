import { AlertCircle, TrendingUp, Users, Clock } from 'lucide-react';

export default function SummaryCards({ summary = {} }) {
  const stats = [
    {
      id: 'accounts',
      title: 'Accounts Analyzed',
      value: summary.total_accounts_analyzed || 0,
      icon: Users,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'suspicious',
      title: 'Suspicious Flagged',
      value: summary.suspicious_accounts_flagged || 0,
      icon: AlertCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      id: 'fraud-rings',
      title: 'Fraud Rings Detected',
      value: summary.fraud_rings_detected || 0,
      icon: TrendingUp,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'processing',
      title: 'Processing Time',
      value: summary.processing_time_seconds
        ? `${summary.processing_time_seconds}s`
        : '—',
      icon: Clock,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-md`}>
                <Icon className={`${stat.iconColor} w-6 h-6`} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}