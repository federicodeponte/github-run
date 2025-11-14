// ABOUTME: Reusable metric card component for displaying analytics statistics
// ABOUTME: Shows a metric value with label, trend indicator, and optional icon

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
  }
  variant?: 'default' | 'success' | 'error' | 'warning'
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}: MetricCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-500/50 bg-green-500/5',
    error: 'border-red-500/50 bg-red-500/5',
    warning: 'border-yellow-500/50 bg-yellow-500/5',
  }

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>{' '}
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
