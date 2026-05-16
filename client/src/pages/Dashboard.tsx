import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LayoutDashboard, CheckSquare, Clock, AlertTriangle, Users } from 'lucide-react';

interface DashboardStats {
  totalTasks: number;
  tasksByStatus: {
    TODO: number;
    IN_PROGRESS: number;
    DONE: number;
  };
  tasksPerUser: { name: string; count: number }[];
  overdueTasks: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!stats) return <div className="text-center mt-20 text-gray-500">Failed to load dashboard.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center space-x-3 mb-8">
        <LayoutDashboard className="text-indigo-600" size={32} />
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Tasks</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.totalTasks}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><CheckSquare size={24} /></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">In Progress</p>
              <h3 className="text-3xl font-bold text-blue-600">{stats.tasksByStatus.IN_PROGRESS}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Clock size={24} /></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Completed</p>
              <h3 className="text-3xl font-bold text-green-600">{stats.tasksByStatus.DONE}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CheckSquare size={24} /></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Overdue Tasks</p>
              <h3 className="text-3xl font-bold text-red-600">{stats.overdueTasks}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={24} /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Users className="mr-2 text-indigo-600" size={20}/> Tasks by Assignee</h3>
          {stats.tasksPerUser.length > 0 ? (
            <div className="space-y-4">
              {stats.tasksPerUser.map((user, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                  <span className="text-gray-700 font-medium">{user.name}</span>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">{user.count} tasks</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic text-sm">No tasks assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
