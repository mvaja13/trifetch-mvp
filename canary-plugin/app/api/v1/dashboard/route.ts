import { NextResponse } from 'next/server';
import { DepartmentStats } from '@/types/analysis';

export async function GET() {
  const departments: DepartmentStats[] = [
    {
      department: 'Engineering',
      avg_stress: 68,
      avg_fatigue: 62,
      burnout_count: 3,
      total_meetings: 145
    },
    {
      department: 'Product',
      avg_stress: 54,
      avg_fatigue: 48,
      burnout_count: 1,
      total_meetings: 98
    },
    {
      department: 'Sales',
      avg_stress: 72,
      avg_fatigue: 58,
      burnout_count: 4,
      total_meetings: 203
    },
    {
      department: 'Marketing',
      avg_stress: 51,
      avg_fatigue: 45,
      burnout_count: 0,
      total_meetings: 76
    },
    {
      department: 'Customer Success',
      avg_stress: 63,
      avg_fatigue: 55,
      burnout_count: 2,
      total_meetings: 187
    }
  ];

  const trendData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    avg_stress: Math.floor(Math.random() * 30) + 50,
    avg_fatigue: Math.floor(Math.random() * 25) + 45,
    meetings_count: Math.floor(Math.random() * 30) + 20
  }));

  return NextResponse.json({
    departments,
    trend_data: trendData,
    summary: {
      total_employees_monitored: 234,
      avg_company_stress: 62,
      high_burnout_risk_count: 10,
      total_meetings_analyzed: 709
    }
  });
}
