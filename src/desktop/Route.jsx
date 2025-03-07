import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Sidebarpart from "./Components/Sidebar/Sidebarpart";
import Attendance from "./pages/Attendance";
import Searchbar from "./Components/search/Searchbar";
import Chat from "./pages/Chat";
import CreateChannel from "./pages/CreateChannel";
import AddChannelPeople from "./pages/AddChannelPeople";
import AttendanceList from "./pages/AttendanceList";
import BookLeave from "./pages/BookLeave";
import Callback from "./pages/Callback";
import Transfer from "./pages/Transfer";
import Sales from "./pages/Sales";
import CallbackList from "./pages/CallbackList";
import TransferList from "./pages/TransferList";
import SalesList from "./pages/SalesList";
import Concern from "./pages/Concern";
import Login from "./pages/Login";
import NotesPage from "./pages/Notes";
import ProtectedRoute from "./ProtectedRoute";
import NotificationPage from "./pages/Notification";
import ForgotClock from "./pages/ForgotClock";
import AddCoworkers from "./pages/AddCoworkers";
import ChannelChat from "./pages/ChannelChat";
import CallbackView from "./pages/CallBackView";
import SalesView from "./pages/SalesView";
import TransferView from "./pages/TransferView";


function DesktopRouting() {
  return (
    
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="*"
            element={
              <div className="flex">
                <Sidebarpart />
                <div className="flex-1 border border-orange-400 min-h-screen">
                  <Searchbar />
                  <Routes>
                    {/* <Route path="/" element={<Home />} /> */}
                    {/* <Route path="/attendance" element={<Attendance />} /> */}
                    <Route path="/chat" element={<Chat />} />
                  



                    <Route path="/addCoworker" element={<AddCoworkers/>}/>
                    <Route path="/addCoworker" element={<CreateChannel/>}/>
                    <Route path="/channelchat" element={<ChannelChat/>}/>
                  

                  </Routes>
                </div>
              </div>
            }
          />
        </Route>

        {/* Redirect all unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    
  );
}

export default DesktopRouting;
