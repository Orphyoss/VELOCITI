import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface DiagnosticStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

export default function ProductionTroubleshoot() {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<DiagnosticStep[]>([
    { name: 'Environment Variables', status: 'pending' },
    { name: 'Database Connection', status: 'pending' },
    { name: 'Alert Count Check', status: 'pending' },
    { name: 'Database Population', status: 'pending' },
    { name: 'API Verification', status: 'pending' }
  ]);

  const updateStep = (index: number, updates: Partial<DiagnosticStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ));
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    
    try {
      // Step 1: Environment Check
      updateStep(0, { status: 'running' });
      const envResponse = await fetch('/debug-env');
      const envData = await envResponse.json();
      
      if (envData.DATABASE_URL && envData.OPENAI_API_KEY) {
        updateStep(0, { 
          status: 'success', 
          message: 'All required environment variables present',
          data: envData
        });
      } else {
        updateStep(0, { 
          status: 'error', 
          message: 'Missing environment variables',
          data: envData
        });
        setIsRunning(false);
        return;
      }

      // Step 2: Database Connection
      updateStep(1, { status: 'running' });
      const dbResponse = await fetch('/debug-db');
      const dbData = await dbResponse.json();
      
      if (dbData.connectionTest === 'SUCCESS') {
        updateStep(1, { 
          status: 'success', 
          message: `Connected: ${dbData.alerts.count} alerts, ${dbData.agents.count} agents`,
          data: dbData
        });
      } else {
        updateStep(1, { 
          status: 'error', 
          message: 'Database connection failed',
          data: dbData
        });
        setIsRunning(false);
        return;
      }

      // Step 3: Alert Count Check
      updateStep(2, { status: 'running' });
      const alertCount = dbData.alerts.count;
      
      if (alertCount > 0) {
        updateStep(2, { 
          status: 'success', 
          message: `Database has ${alertCount} alerts - no population needed`
        });
        // Skip population step
        updateStep(3, { 
          status: 'success', 
          message: 'Population skipped - database already populated'
        });
      } else {
        updateStep(2, { 
          status: 'error', 
          message: 'Database is empty - needs population'
        });
        
        // Step 4: Database Population
        updateStep(3, { status: 'running' });
        const populateResponse = await fetch('/debug-populate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const populateData = await populateResponse.json();
        
        if (populateResponse.ok) {
          updateStep(3, { 
            status: 'success', 
            message: `Created ${populateData.alertsCreated || 0} alerts`,
            data: populateData
          });
        } else {
          updateStep(3, { 
            status: 'error', 
            message: 'Failed to populate database',
            data: populateData
          });
          setIsRunning(false);
          return;
        }
      }

      // Step 5: API Verification
      updateStep(4, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for DB propagation
      
      const apiResponse = await fetch('/api/metrics/alerts');
      const apiData = await apiResponse.json();
      
      if (apiData.success && apiData.data.activeAlerts > 0) {
        updateStep(4, { 
          status: 'success', 
          message: `API returns ${apiData.data.activeAlerts} alerts`,
          data: apiData.data
        });
      } else {
        updateStep(4, { 
          status: 'error', 
          message: 'API not returning alerts',
          data: apiData
        });
      }

    } catch (error) {
      console.error('Diagnostics failed:', error);
      // Update current running step with error
      const currentStepIndex = steps.findIndex(step => step.status === 'running');
      if (currentStepIndex >= 0) {
        updateStep(currentStepIndex, { 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }
    
    setIsRunning(false);
  };

  const getStepIcon = (status: DiagnosticStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepBadge = (status: DiagnosticStep['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      running: 'secondary',
      pending: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const allSuccess = steps.every(step => step.status === 'success');
  const hasErrors = steps.some(step => step.status === 'error');

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Production Database Troubleshoot</h1>
        <p className="text-muted-foreground">
          Diagnose and fix the "No Alerts in Database" production issue
        </p>
      </div>

      {allSuccess && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            ✅ All diagnostics passed! Production database is now working correctly.
          </AlertDescription>
        </Alert>
      )}

      {hasErrors && !isRunning && (
        <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            ❌ Issues detected. Review the failed steps below.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Diagnostic Steps</CardTitle>
          <CardDescription>
            Systematic troubleshooting of production database issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="mb-6"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              'Run Full Diagnostics'
            )}
          </Button>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                <div className="mt-0.5">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium">{step.name}</h3>
                    {getStepBadge(step.status)}
                  </div>
                  {step.message && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {step.message}
                    </p>
                  )}
                  {step.data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          {allSuccess ? (
            <div className="text-green-700 dark:text-green-300">
              <p className="mb-2">✅ Production database is now working!</p>
              <p>Visit the Analyst Workbench to verify alerts are displaying correctly.</p>
            </div>
          ) : hasErrors ? (
            <div className="text-red-700 dark:text-red-300">
              <p className="mb-2">❌ Issues detected in production:</p>
              <ul className="list-disc list-inside space-y-1">
                {steps.filter(step => step.status === 'error').map((step, index) => (
                  <li key={index}>{step.name}: {step.message}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Click "Run Full Diagnostics" to start troubleshooting the production database.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}