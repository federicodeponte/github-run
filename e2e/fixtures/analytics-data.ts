// ABOUTME: Mock analytics data fixtures for E2E testing
// ABOUTME: Provides various test scenarios (full, empty, success, failure, mixed)

import type { AnalyticsData } from '@/lib/analytics/types'

/**
 * Full realistic analytics dataset with mixed success/failure
 */
export const mockAnalyticsFullData: AnalyticsData = {
  overview: {
    totalDeployments: 45,
    successfulDeployments: 38,
    failedDeployments: 7,
    successRate: 84.44,
    uniqueFunctions: 12,
    uniqueRepositories: 5,
  },
  trends: {
    timeSeries: [
      {
        timestamp: '2025-01-06',
        date: 'Jan 6',
        successful: 5,
        failed: 1,
        total: 6,
      },
      {
        timestamp: '2025-01-07',
        date: 'Jan 7',
        successful: 8,
        failed: 2,
        total: 10,
      },
      {
        timestamp: '2025-01-08',
        date: 'Jan 8',
        successful: 6,
        failed: 0,
        total: 6,
      },
      {
        timestamp: '2025-01-09',
        date: 'Jan 9',
        successful: 7,
        failed: 1,
        total: 8,
      },
      {
        timestamp: '2025-01-10',
        date: 'Jan 10',
        successful: 4,
        failed: 2,
        total: 6,
      },
      {
        timestamp: '2025-01-11',
        date: 'Jan 11',
        successful: 5,
        failed: 0,
        total: 5,
      },
      {
        timestamp: '2025-01-12',
        date: 'Jan 12',
        successful: 3,
        failed: 1,
        total: 4,
      },
    ],
    totalInPeriod: 45,
    successRate: 84.44,
  },
  errors: {
    totalErrors: 7,
    errorsByType: [
      {
        errorMessage: 'Module not found: openai',
        count: 3,
        percentage: 42.86,
      },
      {
        errorMessage: 'Invalid GitHub URL format',
        count: 2,
        percentage: 28.57,
      },
      {
        errorMessage: 'Function not found in file',
        count: 2,
        percentage: 28.57,
      },
    ],
    recentErrors: [
      {
        timestamp: '2025-01-12T14:30:00Z',
        functionName: 'process_data',
        repository: 'https://github.com/user/data-processor',
        errorMessage: 'Module not found: openai',
      },
      {
        timestamp: '2025-01-10T09:15:00Z',
        functionName: 'analyze_sentiment',
        repository: 'https://github.com/user/ml-toolkit',
        errorMessage: 'Invalid GitHub URL format',
      },
      {
        timestamp: '2025-01-07T16:45:00Z',
        functionName: 'fetch_data',
        repository: 'https://github.com/user/api-helpers',
        errorMessage: 'Function not found in file',
      },
    ],
  },
  topFunctions: [
    {
      functionName: 'hello',
      repository: 'https://github.com/user/python-functions',
      deploymentCount: 12,
      successRate: 91.67,
      lastDeployed: '2025-01-12T10:00:00Z',
    },
    {
      functionName: 'process_data',
      repository: 'https://github.com/user/data-processor',
      deploymentCount: 8,
      successRate: 75.00,
      lastDeployed: '2025-01-11T14:30:00Z',
    },
    {
      functionName: 'send_email',
      repository: 'https://github.com/user/notifications',
      deploymentCount: 6,
      successRate: 100.00,
      lastDeployed: '2025-01-10T08:20:00Z',
    },
    {
      functionName: 'analyze_sentiment',
      repository: 'https://github.com/user/ml-toolkit',
      deploymentCount: 5,
      successRate: 60.00,
      lastDeployed: '2025-01-09T12:15:00Z',
    },
    {
      functionName: 'fetch_data',
      repository: 'https://github.com/user/api-helpers',
      deploymentCount: 4,
      successRate: 100.00,
      lastDeployed: '2025-01-08T15:45:00Z',
    },
  ],
  timeRange: '7d',
  generatedAt: '2025-01-12T18:00:00Z',
}

/**
 * Empty dataset - zero deployments
 */
export const mockAnalyticsEmptyData: AnalyticsData = {
  overview: {
    totalDeployments: 0,
    successfulDeployments: 0,
    failedDeployments: 0,
    successRate: 0,
    uniqueFunctions: 0,
    uniqueRepositories: 0,
  },
  trends: {
    timeSeries: [],
    totalInPeriod: 0,
    successRate: 0,
  },
  errors: {
    totalErrors: 0,
    errorsByType: [],
    recentErrors: [],
  },
  topFunctions: [],
  timeRange: '7d',
  generatedAt: '2025-01-12T18:00:00Z',
}

/**
 * All successful deployments - 100% success rate
 */
export const mockAnalyticsAllSuccessData: AnalyticsData = {
  overview: {
    totalDeployments: 20,
    successfulDeployments: 20,
    failedDeployments: 0,
    successRate: 100.00,
    uniqueFunctions: 8,
    uniqueRepositories: 3,
  },
  trends: {
    timeSeries: [
      {
        timestamp: '2025-01-06',
        date: 'Jan 6',
        successful: 3,
        failed: 0,
        total: 3,
      },
      {
        timestamp: '2025-01-07',
        date: 'Jan 7',
        successful: 4,
        failed: 0,
        total: 4,
      },
      {
        timestamp: '2025-01-08',
        date: 'Jan 8',
        successful: 2,
        failed: 0,
        total: 2,
      },
      {
        timestamp: '2025-01-09',
        date: 'Jan 9',
        successful: 3,
        failed: 0,
        total: 3,
      },
      {
        timestamp: '2025-01-10',
        date: 'Jan 10',
        successful: 4,
        failed: 0,
        total: 4,
      },
      {
        timestamp: '2025-01-11',
        date: 'Jan 11',
        successful: 2,
        failed: 0,
        total: 2,
      },
      {
        timestamp: '2025-01-12',
        date: 'Jan 12',
        successful: 2,
        failed: 0,
        total: 2,
      },
    ],
    totalInPeriod: 20,
    successRate: 100.00,
  },
  errors: {
    totalErrors: 0,
    errorsByType: [],
    recentErrors: [],
  },
  topFunctions: [
    {
      functionName: 'hello',
      repository: 'https://github.com/user/python-functions',
      deploymentCount: 8,
      successRate: 100.00,
      lastDeployed: '2025-01-12T10:00:00Z',
    },
    {
      functionName: 'send_email',
      repository: 'https://github.com/user/notifications',
      deploymentCount: 6,
      successRate: 100.00,
      lastDeployed: '2025-01-11T14:30:00Z',
    },
    {
      functionName: 'fetch_data',
      repository: 'https://github.com/user/api-helpers',
      deploymentCount: 6,
      successRate: 100.00,
      lastDeployed: '2025-01-10T08:20:00Z',
    },
  ],
  timeRange: '7d',
  generatedAt: '2025-01-12T18:00:00Z',
}

/**
 * All failed deployments - 0% success rate
 */
export const mockAnalyticsAllFailuresData: AnalyticsData = {
  overview: {
    totalDeployments: 15,
    successfulDeployments: 0,
    failedDeployments: 15,
    successRate: 0.00,
    uniqueFunctions: 5,
    uniqueRepositories: 3,
  },
  trends: {
    timeSeries: [
      {
        timestamp: '2025-01-06',
        date: 'Jan 6',
        successful: 0,
        failed: 2,
        total: 2,
      },
      {
        timestamp: '2025-01-07',
        date: 'Jan 7',
        successful: 0,
        failed: 3,
        total: 3,
      },
      {
        timestamp: '2025-01-08',
        date: 'Jan 8',
        successful: 0,
        failed: 2,
        total: 2,
      },
      {
        timestamp: '2025-01-09',
        date: 'Jan 9',
        successful: 0,
        failed: 2,
        total: 2,
      },
      {
        timestamp: '2025-01-10',
        date: 'Jan 10',
        successful: 0,
        failed: 3,
        total: 3,
      },
      {
        timestamp: '2025-01-11',
        date: 'Jan 11',
        successful: 0,
        failed: 2,
        total: 2,
      },
      {
        timestamp: '2025-01-12',
        date: 'Jan 12',
        successful: 0,
        failed: 1,
        total: 1,
      },
    ],
    totalInPeriod: 15,
    successRate: 0.00,
  },
  errors: {
    totalErrors: 15,
    errorsByType: [
      {
        errorMessage: 'Module not found: openai',
        count: 7,
        percentage: 46.67,
      },
      {
        errorMessage: 'Invalid GitHub URL format',
        count: 5,
        percentage: 33.33,
      },
      {
        errorMessage: 'Function not found in file',
        count: 3,
        percentage: 20.00,
      },
    ],
    recentErrors: [
      {
        timestamp: '2025-01-12T14:30:00Z',
        functionName: 'process_data',
        repository: 'https://github.com/user/data-processor',
        errorMessage: 'Module not found: openai',
      },
      {
        timestamp: '2025-01-11T16:20:00Z',
        functionName: 'analyze_sentiment',
        repository: 'https://github.com/user/ml-toolkit',
        errorMessage: 'Invalid GitHub URL format',
      },
      {
        timestamp: '2025-01-11T09:15:00Z',
        functionName: 'fetch_data',
        repository: 'https://github.com/user/api-helpers',
        errorMessage: 'Function not found in file',
      },
      {
        timestamp: '2025-01-10T14:45:00Z',
        functionName: 'process_data',
        repository: 'https://github.com/user/data-processor',
        errorMessage: 'Module not found: openai',
      },
      {
        timestamp: '2025-01-09T11:30:00Z',
        functionName: 'analyze_sentiment',
        repository: 'https://github.com/user/ml-toolkit',
        errorMessage: 'Invalid GitHub URL format',
      },
    ],
  },
  topFunctions: [
    {
      functionName: 'process_data',
      repository: 'https://github.com/user/data-processor',
      deploymentCount: 6,
      successRate: 0.00,
      lastDeployed: '2025-01-12T14:30:00Z',
    },
    {
      functionName: 'analyze_sentiment',
      repository: 'https://github.com/user/ml-toolkit',
      deploymentCount: 5,
      successRate: 0.00,
      lastDeployed: '2025-01-11T16:20:00Z',
    },
    {
      functionName: 'fetch_data',
      repository: 'https://github.com/user/api-helpers',
      deploymentCount: 4,
      successRate: 0.00,
      lastDeployed: '2025-01-11T09:15:00Z',
    },
  ],
  timeRange: '7d',
  generatedAt: '2025-01-12T18:00:00Z',
}

/**
 * Low success rate - Below 80% threshold
 */
export const mockAnalyticsLowSuccessData: AnalyticsData = {
  overview: {
    totalDeployments: 30,
    successfulDeployments: 18,
    failedDeployments: 12,
    successRate: 60.00,
    uniqueFunctions: 10,
    uniqueRepositories: 4,
  },
  trends: {
    timeSeries: [
      {
        timestamp: '2025-01-06',
        date: 'Jan 6',
        successful: 2,
        failed: 2,
        total: 4,
      },
      {
        timestamp: '2025-01-07',
        date: 'Jan 7',
        successful: 3,
        failed: 2,
        total: 5,
      },
      {
        timestamp: '2025-01-08',
        date: 'Jan 8',
        successful: 2,
        failed: 3,
        total: 5,
      },
      {
        timestamp: '2025-01-09',
        date: 'Jan 9',
        successful: 3,
        failed: 1,
        total: 4,
      },
      {
        timestamp: '2025-01-10',
        date: 'Jan 10',
        successful: 3,
        failed: 2,
        total: 5,
      },
      {
        timestamp: '2025-01-11',
        date: 'Jan 11',
        successful: 3,
        failed: 1,
        total: 4,
      },
      {
        timestamp: '2025-01-12',
        date: 'Jan 12',
        successful: 2,
        failed: 1,
        total: 3,
      },
    ],
    totalInPeriod: 30,
    successRate: 60.00,
  },
  errors: {
    totalErrors: 12,
    errorsByType: [
      {
        errorMessage: 'Module not found: openai',
        count: 6,
        percentage: 50.00,
      },
      {
        errorMessage: 'Invalid GitHub URL format',
        count: 4,
        percentage: 33.33,
      },
      {
        errorMessage: 'Function not found in file',
        count: 2,
        percentage: 16.67,
      },
    ],
    recentErrors: [
      {
        timestamp: '2025-01-12T14:30:00Z',
        functionName: 'process_data',
        repository: 'https://github.com/user/data-processor',
        errorMessage: 'Module not found: openai',
      },
      {
        timestamp: '2025-01-11T16:20:00Z',
        functionName: 'analyze_sentiment',
        repository: 'https://github.com/user/ml-toolkit',
        errorMessage: 'Invalid GitHub URL format',
      },
      {
        timestamp: '2025-01-10T09:15:00Z',
        functionName: 'fetch_data',
        repository: 'https://github.com/user/api-helpers',
        errorMessage: 'Function not found in file',
      },
    ],
  },
  topFunctions: [
    {
      functionName: 'hello',
      repository: 'https://github.com/user/python-functions',
      deploymentCount: 10,
      successRate: 70.00,
      lastDeployed: '2025-01-12T10:00:00Z',
    },
    {
      functionName: 'process_data',
      repository: 'https://github.com/user/data-processor',
      deploymentCount: 8,
      successRate: 50.00,
      lastDeployed: '2025-01-11T14:30:00Z',
    },
    {
      functionName: 'send_email',
      repository: 'https://github.com/user/notifications',
      deploymentCount: 6,
      successRate: 66.67,
      lastDeployed: '2025-01-10T08:20:00Z',
    },
  ],
  timeRange: '7d',
  generatedAt: '2025-01-12T18:00:00Z',
}
