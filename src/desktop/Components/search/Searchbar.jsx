import { useEffect, useState } from "react";
import search from "../../../assets/desktop/search.svg";
import notificationIcon from "../../../assets/desktop/bell.png"; // Notification icon
import { IoIosClose } from "react-icons/io";
import logo from "../../../assets/desktop/logo.svg"
import { onNotificationReceived } from "../../../utils/socket";
import { MdLogout } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/authContext";
function Searchbar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notification, setNotification] = useState([]);
  const { setToken } = useAuth();
  const token = localStorage.getItem("token");
  const navigate=useNavigate();
  
  useEffect(() => {
    onNotificationReceived((notification) => {
      setNotification((prev) => [notification, ...prev]); // Add new notification
      setUnreadCount((prev) => prev + 1); // Increase unread count
    });
  }, []);
 
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
    setUnreadCount(0)
  };

  const handleLogout=()=>{
    localStorage.removeItem("token");
    setToken(null); // Update AuthContext state
  navigate("/login", { replace: true }); 
  }


  const removeNotification=(index)=>{
    setNotification(notification.filter((_, i) => i !== index));
  }

  useEffect(() => {
    const notification = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API}/notification/get-notifications`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setNotification(data?.notifications);
        }
      } catch (error) {
        console.log(error);
      }
    };
    notification();
  }, []);

  return (
    <div className="w-full border-b-2 border-orange-400 pt-6 px-6 flex justify-between relative">
      {/* Search Bar */}
      <div className="mb-6 bg-[#E3E3E3] w-[700px] rounded flex gap-2 px-4">
        <img src={search} alt="Search Icon" />
        <input
          type="text"
          placeholder="Search"
          className="p-1 text-[13px] w-full border-none outline-none bg-transparent"
        />
      </div>

      {/* Notification Icon */}
      <div className="flex gap-4">
      <div className="relative cursor-pointer" onClick={toggleSidebar}>
        <img src={notificationIcon} alt="Notifications" className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </div>
      {/* logout */}
      <div className="cursor-pointer" onClick={handleLogout}>
      <MdLogout size={25}/>
      </div>
      </div>

      {/* Notification Sidebar */}
      <div
        className={`fixed top-0 right-0 w-80 h-full bg-white shadow-lg transition-transform transform ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        } p-4 z-50`}
      >
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <button className="text-gray-600" onClick={toggleSidebar}>
          <IoIosClose size={32}/>
          </button>
        </div>
        <div className="mt-4 space-y-3">
      {notification.length > 0 ? (
        notification.map((notify, i) => (
          <div key={i} className="p-3 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition flex justify-between items-center">
            <img src={logo} alt="" className="w-[40px]"/>
            <div >
            
              <h3 className="text-sm font-semibold text-gray-700">{notify.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{notify.description}</p>
            </div>

            <button
              className="text-red-500 text-xs font-bold px-2 py-1 hover:text-red-700"
              onClick={() => removeNotification(i)}
            >
              <IoIosClose size={26}/>
            </button>

          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500 text-center">No new notifications</p>
      )}
    </div>
      </div>

      

      {/* Overlay to close sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-30 z-40"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
}

export default Searchbar;
