import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import AnalystWorkbench from "@/pages/AnalystWorkbench";
import Agents from "@/pages/Agents";
import DatabricsGenie from "@/pages/DatabricsGenie";
import StrategicAnalysis from "@/pages/StrategicAnalysis";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/workbench" component={AnalystWorkbench} />
      <Route path="/agents" component={Agents} />
      <Route path="/genie" component={DatabricsGenie} />
      <Route path="/strategic" component={StrategicAnalysis} />
      <Route path="/admin" component={Admin} />
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
