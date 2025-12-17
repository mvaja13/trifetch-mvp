'use client';

import { useEffect, useState } from 'react';
import { DepartmentStats } from '@/types/analysis';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardData {
  departments: DepartmentStats[];
  trend_data: Array<{
    date: string;
    avg_stress: number;
    avg_fatigue: number;
    meetings_count: number;
  }>;
  summary: {
    total_employees_monitored: number;
    avg_company_stress: number;
    high_burnout_risk_count: number;
    total_meetings_analyzed: number;
  };
}

export default function HRDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/dashboard')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="text-center py-8">Loading dashboard data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="text-center py-8 text-red-600">Failed to load dashboard data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Company Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Employees Monitored</div>
            <div className="text-3xl font-bold text-blue-700">{data.summary.total_employees_monitored}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">Avg Company Stress</div>
            <div className="text-3xl font-bold text-yellow-700">{data.summary.avg_company_stress}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">High Burnout Risk</div>
            <div className="text-3xl font-bold text-red-700">{data.summary.high_burnout_risk_count}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Meetings Analyzed</div>
            <div className="text-3xl font-bold text-green-700">{data.summary.total_meetings_analyzed}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Department Comparison</h2>
        <p className="text-gray-600 mb-4">Average stress and fatigue levels across departments</p>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.departments}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="avg_stress" fill="#ef4444" name="Avg Stress" />
            <Bar dataKey="avg_fatigue" fill="#f59e0b" name="Avg Fatigue" />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Stress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Fatigue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Burnout Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meetings</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.departments.map((dept) => (
                <tr key={dept.department}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`font-medium ${
                      dept.avg_stress >= 70 ? 'text-red-600' :
                      dept.avg_stress >= 50 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {dept.avg_stress}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`font-medium ${
                      dept.avg_fatigue >= 70 ? 'text-red-600' :
                      dept.avg_fatigue >= 50 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {dept.avg_fatigue}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      dept.burnout_count >= 3 ? 'bg-red-100 text-red-800' :
                      dept.burnout_count >= 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {dept.burnout_count} at risk
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.total_meetings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">30-Day Stress Trend</h2>
        <p className="text-gray-600 mb-4">Company-wide stress and fatigue trends over the last month</p>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.trend_data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <Legend />
            <Line type="monotone" dataKey="avg_stress" stroke="#ef4444" strokeWidth={2} name="Avg Stress" />
            <Line type="monotone" dataKey="avg_fatigue" stroke="#f59e0b" strokeWidth={2} name="Avg Fatigue" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Privacy & Ethics</h3>
        <p className="text-sm text-yellow-700">
          All wellbeing monitoring is opt-in and anonymous. Individual employees cannot be identified.
          Data is aggregated to protect privacy while providing actionable insights for leadership.
        </p>
      </div>
    </div>
  );
}
