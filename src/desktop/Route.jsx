import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Sidebarpart from "./Components/Sidebar/Sidebarpart";
import Attendance from "./pages/Attendance";
import Searchbar from "./Components/search/Searchbar";
import Chat from "./pages/Chat";
import CreateChannel from "./pages/CreateChannel";
import Login from "./pages/Login";
import Signup from "./pages/Signp";
import NotesPage from "./pages/Notes";
import ProtectedRoute from "./ProtectedRoute";
import NotificationPage from "./pages/Notification";
import AddCoworkers from "./pages/AddCoworkers";
import ChannelChat from "./pages/ChannelChat";
import { useAuth } from "../context/authContext";

function DesktopRouting() {
  const { token } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      {!token ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </>
      ) : (
        <Route element={<ProtectedRoute />}>
          <Route
            path="*"
            element={
              <div className="flex">
                <Sidebarpart />
                <div className="flex-1 border border-orange-400 min-h-screen">
                  <Searchbar />
                  <Routes>
                    <Route path="/home" element={<Home />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/addCoworker" element={<AddCoworkers />} />
                    <Route path="/createChannel" element={<CreateChannel />} />
                    <Route path="/channelchat" element={<ChannelChat />} />
                    <Route path="/notifications" element={<NotificationPage />} />
                    <Route path="/notes" element={<NotesPage />} />
                  </Routes>
                </div>
              </div>
            }
          />
        </Route>
      )}
    </Routes>
  );
}

export default DesktopRouting;
