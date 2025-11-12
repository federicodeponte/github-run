// ABOUTME: Visual progress indicator for deployment steps
// ABOUTME: Shows user current status: Fetching → Deploying → Testing → Success

import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'

type DeployStatus = 'idle' | 'fetching' | 'deploying' | 'testing' | 'success' | 'error'

interface Step {
  id: string
  label: string
  status: 'pending' | 'active' | 'complete' | 'error'
}

export function DeploymentProgress({ status }: { status: DeployStatus }) {
  const steps: Step[] = [
    {
      id: 'fetch',
      label: 'Fetching Code',
      status:
        status === 'idle'
          ? 'pending'
          : status === 'fetching'
          ? 'active'
          : status === 'error'
          ? 'error'
          : 'complete',
    },
    {
      id: 'deploy',
      label: 'Deploying to Modal',
      status:
        status === 'idle' || status === 'fetching'
          ? 'pending'
          : status === 'deploying'
          ? 'active'
          : status === 'error'
          ? 'error'
          : 'complete',
    },
    {
      id: 'test',
      label: 'Testing Endpoint',
      status:
        status === 'idle' || status === 'fetching' || status === 'deploying'
          ? 'pending'
          : status === 'testing'
          ? 'active'
          : status === 'error'
          ? 'error'
          : 'complete',
    },
    {
      id: 'success',
      label: 'Ready to Use',
      status: status === 'success' ? 'complete' : status === 'error' ? 'error' : 'pending',
    },
  ]

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{
            width: `${
              (steps.filter((s) => s.status === 'complete').length / (steps.length - 1)) * 100
            }%`,
          }}
        />

        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center gap-2 z-10 relative">
            {/* Step icon */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                step.status === 'complete'
                  ? 'bg-primary border-primary text-primary-foreground'
                  : step.status === 'active'
                  ? 'bg-background border-primary'
                  : step.status === 'error'
                  ? 'bg-destructive border-destructive text-destructive-foreground'
                  : 'bg-background border-muted-foreground/30'
              }`}
            >
              {step.status === 'complete' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : step.status === 'active' ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : step.status === 'error' ? (
                <XCircle className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/30" />
              )}
            </div>

            {/* Step label */}
            <p
              className={`text-xs font-medium text-center max-w-[80px] ${
                step.status === 'active'
                  ? 'text-foreground'
                  : step.status === 'complete'
                  ? 'text-muted-foreground'
                  : step.status === 'error'
                  ? 'text-destructive'
                  : 'text-muted-foreground/50'
              }`}
            >
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
