import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/header";
import Footer from "@/components/footer";
import FloatingSocial from "@/components/floating-social";
import Home from "@/pages/home";
import SpareParts from "@/pages/spare-parts";
import ProductDetail from "@/pages/product-detail";
import Contact from "@/pages/contact";
import About from "@/pages/about";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import AdminLogin from "@/pages/admin-login";
import Admin from "@/pages/admin";

function Router() {
  return (
    <Switch>
      <Route path="/agoraadminpanel" component={AdminLogin} />
      <Route>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/spare-parts" component={SpareParts} />
              <Route path="/contact" component={Contact} />
              <Route path="/about" component={About} />
              <Route path="/privacy" component={Privacy} />
              <Route path="/terms" component={Terms} />
              <Route path="/admin" component={Admin} />
              <Route path="/urun/:slug" component={ProductDetail} />
              <Route path="/product/:id" component={ProductDetail} />
              <Route path="/brand/:brand/:code" component={ProductDetail} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
          <FloatingSocial />
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
