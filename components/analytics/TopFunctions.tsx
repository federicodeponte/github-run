// ABOUTME: Top functions component showing most deployed functions with success rates
// ABOUTME: Displays function usage statistics in a sortable table format

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { TopFunction } from '@/lib/analytics/types'

interface TopFunctionsProps {
  data: TopFunction[]
}

export function TopFunctions({ data }: TopFunctionsProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Functions</CardTitle>
          <CardDescription>No deployment data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No functions have been deployed yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Functions</CardTitle>
        <CardDescription>Most deployed functions by usage</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Function</TableHead>
              <TableHead>Repository</TableHead>
              <TableHead className="text-center">Deployments</TableHead>
              <TableHead className="text-center">Success Rate</TableHead>
              <TableHead>Last Deployed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((func, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{func.functionName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {func.repository}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{func.deploymentCount}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={func.successRate >= 80 ? 'default' : 'destructive'}
                    className={
                      func.successRate >= 80
                        ? 'bg-green-600 hover:bg-green-700'
                        : ''
                    }
                  >
                    {func.successRate.toFixed(0)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(func.lastDeployed).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
