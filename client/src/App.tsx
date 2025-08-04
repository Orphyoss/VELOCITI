import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import AnalystWorkbench from "@/pages/AnalystWorkbench";
import Agents from "@/pages/Agents";
import ActionAgents from "@/pages/ActionAgents";
import ActionAgentsNew from "@/pages/ActionAgentsNew";
import DatabricsGenie from "@/pages/DatabricsGenie";
import StrategicAnalysis from "@/pages/StrategicAnalysis";
import TelosIntelligence from "@/pages/TelosIntelligence";
import MorningBriefing from "@/pages/MorningBriefing";
import Admin from "@/pages/Admin";
import DataGeneration from "@/pages/DataGeneration";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/workbench" component={AnalystWorkbench} />
      <Route path="/agents" component={Agents} />
      <Route path="/action-agents" component={ActionAgents} />
      <Route path="/action-agents-new">{() => <ActionAgentsNew />}</Route>
      <Route path="/genie" component={DatabricsGenie} />
      <Route path="/strategic" component={StrategicAnalysis} />
      <Route path="/telos" component={TelosIntelligence} />
      <Route path="/briefing" component={MorningBriefing} />
      <Route path="/admin" component={Admin} />
      <Route path="/data-generation" component={DataGeneration} />
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
