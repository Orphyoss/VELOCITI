import React from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";


import AnalystWorkbench from "@/pages/AnalystWorkbench";
import Agents from "@/pages/Agents";

import DatabricsGenie from "@/pages/DatabricsGenie";
import StrategicAnalysis from "@/pages/StrategicAnalysis";
import TelosIntelligence from "@/pages/TelosIntelligence";
import MorningBriefing from "@/pages/MorningBriefing";
import Admin from "@/pages/Admin";
import DataGeneration from "@/pages/DataGeneration";
import SystemMonitoring from "@/pages/SystemMonitoring";
import ProductionTroubleshoot from "@/pages/ProductionTroubleshoot";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TelosIntelligence} />
      <Route path="/telos" component={TelosIntelligence} />
      <Route path="/intelligence" component={TelosIntelligence} />

      <Route path="/workbench" component={AnalystWorkbench} />
      <Route path="/agents" component={Agents} />
      <Route path="/genie" component={DatabricsGenie} />
      <Route path="/strategic" component={StrategicAnalysis} />
      <Route path="/briefing" component={MorningBriefing} />
      <Route path="/admin" component={Admin} />
      <Route path="/data-generation" component={DataGeneration} />
      <Route path="/system-monitoring" component={SystemMonitoring} />
      <Route path="/production-troubleshoot" component={ProductionTroubleshoot} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Global error handlers
  React.useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[App] Unhandled promise rejection caught and handled:', event.reason);
      
      // Log additional context
      if (event.reason?.stack) {
        console.error('[App] Stack trace:', event.reason.stack);
      }
      
      // Prevent the default browser behavior (red error in console)
      event.preventDefault();
    };

    // Handle general errors
    const handleError = (event: ErrorEvent) => {
      console.error('[App] Global error:', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="dark">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
