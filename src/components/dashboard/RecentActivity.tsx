'use client';

interface Activity {
  id: string;
  type: 'phone' | 'email' | 'chat';
  status: 'basic' | 'silver' | 'gold';
  timestamp: string;
  description: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'silver':
        return 'bg-gray-100 text-gray-800';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: Activity['type']) => {
    switch (type) {
      case 'phone':
        return '📞';
      case 'email':
        return '📧';
      case 'chat':
        return '💬';
      default:
        return '📝';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-gray-800 font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              {getTypeIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.description}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">{activity.timestamp}</span>
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusColor(activity.status)}`}>
                  {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
