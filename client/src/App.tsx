import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import AnalystWorkbench from "@/pages/AnalystWorkbench";
import Agents from "@/pages/Agents";
import ActionAgents from "@/pages/ActionAgents";

import DatabricsGenie from "@/pages/DatabricsGenie";
import StrategicAnalysis from "@/pages/StrategicAnalysis";
import TelosIntelligence from "@/pages/TelosIntelligence";
import MorningBriefing from "@/pages/MorningBriefing";
import Admin from "@/pages/Admin";
import DataGeneration from "@/pages/DataGeneration";
import SystemMonitoring from "@/pages/SystemMonitoring";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TelosIntelligence} />

      <Route path="/workbench" component={AnalystWorkbench} />
      <Route path="/agents" component={Agents} />
      <Route path="/action-agents" component={ActionAgents} />

      <Route path="/genie" component={DatabricsGenie} />
      <Route path="/strategic" component={StrategicAnalysis} />
      <Route path="/briefing" component={MorningBriefing} />
      <Route path="/admin" component={Admin} />
      <Route path="/data-generation" component={DataGeneration} />
      <Route path="/system-monitoring" component={SystemMonitoring} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
