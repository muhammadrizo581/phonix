import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreatePhone from "./pages/CreatePhone";
import EditPhone from "./pages/EditPhone";
import MyListings from "./pages/MyListings";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import PhoneDetail from "./pages/PhoneDetail";
import Requests from "./pages/Requests";
import NotFound from "./pages/NotFound";
import LikesPage from "./pages/Likes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/likes" element={<LikesPage />} />
          <Route path="/phones/new" element={<CreatePhone />} />
          <Route path="/phones/:id" element={<PhoneDetail />} />
          <Route path="/phones/:id/edit" element={<EditPhone />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/chat/:phoneId/:otherUserId" element={<Chat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
