import { Link, useNavigate, useLocation } from "react-router-dom";
import arrow from "../../../assets/desktop/arrow.svg";
import edit from "../../../assets/desktop/edit.svg";
import logo from "../../../assets/desktop/logo.svg";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useAuth } from "../../../context/authContext";
import { useEffect, useState } from "react";
import socket from "../../../utils/socket";
import axios from "axios";

const getStableColor = (text = "DM") => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 40%)`;
};

function Sidebarpart() {
  const SIDEBAR_PREF_KEY = "dm_client_desktop_sidebar_collapsed";
  const { getChannels } = useAuth();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [channels, setChannels] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});
  const { getAllUsers,userData } = useAuth();
  const [openChatId, setOpenChatId] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_PREF_KEY) === "1";
    } catch (error) {
      return false;
    }
  });
  const navigate = useNavigate();

  const channel = async () => {
    const data = await getChannels();
    setChannels(data);
  };
  const fetchUsers = async () => {
    const users = await getAllUsers();
    const unreadCounts = {};
    users.forEach((user) => {
      unreadCounts[user.id] = user.unreadMessages || 0;
    });
    setEmployees(users);
    setUnreadMessages(unreadCounts);
  };

  useEffect(() => {
    channel();
    fetchUsers();
    socket.on("updateUnread", async () => {
      fetchUsers();
    });

    return () => {
      socket.off("updateUnread");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const chatState = location.state;
    if (chatState && chatState.id) {
      setOpenChatId(chatState.id);
    } else {
      setOpenChatId(null);
    }
  }, [location]);

  const handleCowrokers = () => {
    navigate("/addCoworker");
  };

  const handleChat = async (name, id) => {
    setOpenChatId(id);
    setUnreadMessages((prev) => ({
      ...prev,
      [id]: 0,
    }));
    navigate("/chat", { state: { name, id } });
    await axios.post(
      `${import.meta.env.VITE_BACKEND_API}/message/messages/mark-as-read`,
      { senderId: id },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
  };

  const handleChannel = () => {
    navigate("/create-channel");
  };
  const handleChannelChat = (name, id) => {
    navigate("/channelchat", {
      state: {
        name,
        id,
      },
    });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_PREF_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="relative h-screen px-3 pt-2 border border-orange-400 flex flex-col justify-between items-center">
        <nav className="flex flex-col gap-1 items-center">
          <Link to="/" className="flex items-center">
            <div className="">
              <img src={logo} alt="" className="h-[70px] w-[70px]" />
            </div>
          </Link>
        </nav>
        <div className="">
          <p className="rounded border flex items-center mb-4 justify-center w-10 text-2xl font-medium text-white bg-orange-600">
            {userData?.name?.charAt(0)}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className="absolute -right-3 top-24 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-orange-300 bg-white text-gray-700 shadow-sm hover:bg-orange-50"
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
        </button>
      </div>

      <div
        className={`bg-gray-200 border border-orange-400 h-screen flex flex-col overflow-hidden transition-all duration-300 ${
          isSidebarCollapsed ? "w-0 p-0 opacity-0 border-l-0 border-r-0 pointer-events-none" : "w-[250px] p-4 opacity-100"
        }`}
      >
        {!isSidebarCollapsed && (
          <>
        <div className="flex justify-between items-center pt-4 mb-4">
          <h2 className="text-[18px] font-medium   flex gap-2">
            {userData?.name}
            <img src={arrow} alt="" className="w-[8px] pt-1" />
          </h2>
          <img src={edit} alt="" className="w-[10px] h-[10px]" />
        </div>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Channels Section */}
          <div className="pt-4 flex-none">
            <h3 className="text-[15px] font-bold text-gray-600 flex gap-2">
              Channels <img src={arrow} alt="" className="w-[8px] pt-1" />
            </h3>
            <ul className="mt-2 max-h-[160px] overflow-y-auto hide-scrollbar">
              {channels?.map((channel) => (
                <li key={channel._id}>
                  <p
                    className="block p-2 text-gray-700 font-medium text-[14px] cursor-pointer"
                    onClick={() => handleChannelChat(channel.name, channel._id)}
                  >
                    <p className="flex space-x-2">
                      <span
                        className="border items-center  flex justify-center w-5 h-5 text-[12px] font-medium text-white"
                        style={{
                          backgroundColor: getStableColor(channel?.name),
                        }}
                      >
                        {channel?.name?.charAt(0).toUpperCase()}
                      </span>
                      <span>{channel.name}</span>
                    </p>
                  </p>
                </li>
              ))}
              {/* <li>
                <p
                  className="block p-2 text-gray-700 text-[13px] cursor-pointer"
                  onClick={handleChannel}
                >
                  + Add Channels
                </p>
              </li> */}
            </ul>
          </div>

          {/* Messages Section */}
          <div className="flex flex-col flex-1 min-h-0">
            <h3 className="text-[15px] font-bold text-gray-600 flex gap-2">
              Messages <img src={arrow} alt="" className="w-[8px] pt-1" />
            </h3>
            <ul className="mt-2 flex-1 min-h-0 overflow-y-auto pr-1 hide-scrollbar">
              {employees
                ?.filter((user) => user.lastMessageTime)
                .map((user, i) => (
                  <li
                    key={i}
                    className="block p-2 text-gray-700 text-[14px] font-medium cursor-pointer"
                    onClick={() => handleChat(user.name, user.id)}
                  >
                    <p className="flex space-x-2">
                      <span
                        className="border items-center  flex justify-center w-5 h-5 text-[12px] font-medium text-white"
                        style={{
                          backgroundColor: getStableColor(user?.name),
                        }}
                      >
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                      <span>{user?.name}</span>
                      {unreadMessages[user.id] > 0 && openChatId !== user.id && (
                        <span className="text-green-500 font-bold">
                          ({unreadMessages[user.id]})
                        </span>
                      )}
                    </p>
                  </li>
                ))}
            </ul>
            <button
              type="button"
              className="block p-2 text-gray-700 text-[15px] cursor-pointer"
              onClick={handleCowrokers}
            >
              + Add Coworker
            </button>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Sidebarpart;
