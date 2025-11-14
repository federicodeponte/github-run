// ABOUTME: Error analysis component showing error statistics and recent failures
// ABOUTME: Displays error type distribution and recent error details

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'
import type { ErrorAnalysis as ErrorAnalysisType } from '@/lib/analytics/types'

interface ErrorAnalysisProps {
  data: ErrorAnalysisType
}

export function ErrorAnalysis({ data }: ErrorAnalysisProps) {
  if (data.totalErrors === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Analysis</CardTitle>
          <CardDescription>No errors in the selected time range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-green-600">
            <div className="text-center">
              <p className="text-lg font-semibold">All deployments successful!</p>
              <p className="text-sm text-muted-foreground">Keep up the great work</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Error Types</CardTitle>
          <CardDescription>
            {data.totalErrors} error{data.totalErrors !== 1 ? 's' : ''} in selected time range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.errorsByType.map((error, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{error.errorMessage}</p>
                  <p className="text-xs text-muted-foreground">
                    {error.count} occurrence{error.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant="outline" className="ml-2">
                  {error.percentage.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
          <CardDescription>Latest deployment failures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentErrors.map((error, index) => (
              <div key={index} className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{error.functionName}</p>
                  <p className="text-xs text-muted-foreground">{error.repository}</p>
                  <p className="text-xs text-red-600 mt-1">{error.errorMessage}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(error.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
