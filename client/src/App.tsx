import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import AnalystWorkbench from "@/pages/AnalystWorkbench";
import Agents from "@/pages/Agents";
import ActionAgents from "@/pages/ActionAgents";
// import ActionAgentsNew from "@/pages/ActionAgentsNew";
import DatabricsGenie from "@/pages/DatabricsGenie";
import StrategicAnalysis from "@/pages/StrategicAnalysis";
import TelosIntelligence from "@/pages/TelosIntelligence";
import MorningBriefing from "@/pages/MorningBriefing";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function TestComponent() {
  return (
    <div className="min-h-screen bg-red-500 text white p-8">
      <h1 className="text-4xl font-bold text-white">Test Component Loading</h1>
      <p className="text-white mt-4">If you see this, React is working!</p>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={TestComponent} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/workbench" component={AnalystWorkbench} />
      <Route path="/agents" component={Agents} />
      <Route path="/action-agents" component={ActionAgents} />
      {/* <Route path="/action-agents-new" component={ActionAgentsNew} /> */}
      <Route path="/genie" component={DatabricsGenie} />
      <Route path="/strategic" component={StrategicAnalysis} />
      <Route path="/telos" component={TelosIntelligence} />
      <Route path="/briefing" component={MorningBriefing} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark min-h-screen bg-background text-foreground">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
