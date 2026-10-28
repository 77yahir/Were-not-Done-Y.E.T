import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Boardgames from "./pages/Boardgames";
import "./App.css";
import Communities from "./pages/Communities";
import Friends from "./pages/Friends";
import Landing from "./pages/Landing";
import Wishlist from "./pages/Wishlist";
import PageLayout from "./components/layout/PageLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Pages below require a logged-in user */}
        <Route element={<PageLayout />}>
          <Route path="/collection" element={<Boardgames />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/communities" element={<Communities />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
