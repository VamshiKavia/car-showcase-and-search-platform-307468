import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import CarDetailsPage from "./pages/CarDetailsPage";

// PUBLIC_INTERFACE
function App() {
  /** App root: defines client-side routes and wraps pages in the shared layout shell. */
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cars/:id" element={<CarDetailsPage />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
