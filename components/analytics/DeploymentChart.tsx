// ABOUTME: Time-series chart component for deployment trends visualization
// ABOUTME: Displays successful and failed deployments over time using Recharts

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { TimeSeriesDataPoint } from '@/lib/analytics/types'

interface DeploymentChartProps {
  data: TimeSeriesDataPoint[]
  type?: 'line' | 'bar'
}

export function DeploymentChart({ data, type = 'line' }: DeploymentChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deployment Trends</CardTitle>
          <CardDescription>No data available for the selected time range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No deployments found
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment Trends</CardTitle>
        <CardDescription>Successful and failed deployments over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="successful"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                name="Successful"
              />
              <Line
                type="monotone"
                dataKey="failed"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={2}
                name="Failed"
              />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Bar dataKey="successful" fill="hsl(142, 76%, 36%)" name="Successful" />
              <Bar dataKey="failed" fill="hsl(0, 84%, 60%)" name="Failed" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
