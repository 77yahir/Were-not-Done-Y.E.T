import Boardgames from "./pages/Boardgames";
import Communities from "./pages/Communities";
import CommunityDetails from "./pages/CommunityDetails";
import Dashboard from "./pages/Dashboard";
import Friends from "./pages/Friends";

import { Routes, Route } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<h1>Welcome to Board Buddies</h1>}
      />
      <Route path="/communities" element={<Communities />} />
      <Route
        path="/communities/:groupId"
        element={<CommunityDetails />}
      />
      <Route path="/friends" element={<Friends />} />
      <Route path="/boardgames" element={<Boardgames />} />
    </Routes>
  );
}

export default App;
