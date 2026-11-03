import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";
import Boardgames from "./pages/Boardgames";
import Communities from "./pages/Communities";
import CommunityDetails from "./pages/CommunityDetails";
// import Dashboard from "./pages/Dashboard";
import Friends from "./pages/Friends";
import Landing from "./pages/Landing";
import Wishlist from "./pages/Wishlist";
import PageLayout from "./components/layout/PageLayout";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route element={<PageLayout />}>
          <Route path="/collection" element={<Boardgames />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/friends" element={<Friends />} />
          <Route
            path="/communities"
            element={<Communities />}
          />

          <Route
            path="/communities/:groupId"
            element={<CommunityDetails />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
