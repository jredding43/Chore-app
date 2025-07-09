import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Home from "./pages/Home";
import ChoreList from "./pages/Manager";
import ProfilePage from './pages/ProfilePage';
import ReviewChores from "./pages/ReviewChores";
import ReviewWorkbook from "./pages/ReviewWorkbook";
import Calendar from "./pages/Calendar";
import ReviewExtraChores from "./pages/ReviewExtraChores";
import { PointsStore } from "./components/PointStore";
import Rewards from "./pages/Rewards";

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chorelist" element={<ChoreList />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/review" element={<ReviewChores />} />
          <Route path="/workbook" element={<ReviewWorkbook />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/extrachores" element={<ReviewExtraChores />} />
          <Route path="/store/:id" element={<PointsStore />} /> 
          <Route path="/rewards" element={<Rewards />} />

        </Routes>
      </Router>
    </HelmetProvider>
  );
};

export default App;
