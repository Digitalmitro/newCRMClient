import { Link, useNavigate, useLocation } from "react-router-dom";
import home from "../../../assets/desktop/home.svg";
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
  const totalChannelUnread = channels.reduce(
    (sum, channel) => sum + (channel?.unreadMessages || 0),
    0
  );

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
      channel();
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

  const handleChannelChat = (name, id) => {
    setChannels((prev) =>
      prev.map((channel) =>
        channel?._id?.toString() === id?.toString()
          ? { ...channel, unreadMessages: 0 }
          : channel
      )
    );
    navigate(`/channelchat/${id}`, {
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
      <div className="relative flex h-screen flex-col items-center justify-between border border-orange-400 bg-white/95 px-3 pt-2">
        <nav className="flex flex-col gap-1 items-center">
          <Link to="/home" className="flex items-center">
            <div className="">
              <img src={logo} alt="" className="h-[70px] w-[70px]" />
            </div>
          </Link>
          <Link to="/home" className="flex items-center gap-2 p-2">
            <div className="flex flex-col items-center">
              <img src={home} alt="" className="h-[24px] w-[24px]" />
              <p className="text-[12px] font-semibold">Home</p>
            </div>
          </Link>
        </nav>
        <div className="">
          <p className="mb-4 flex w-10 items-center justify-center rounded-2xl border border-orange-100 bg-orange-500 py-1 text-2xl font-medium text-white shadow-sm">
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
          isSidebarCollapsed ? "w-0 p-0 opacity-0 border-l-0 border-r-0 pointer-events-none" : "w-[260px] px-3 py-4 opacity-100"
        }`}
      >
        {!isSidebarCollapsed && (
          <>
        <div className="flex justify-between items-center pt-3 mb-3">
          <h2 className="text-[18px] font-medium flex gap-2">
            {userData?.name}
            <img src={arrow} alt="" className="w-[8px] pt-1" />
          </h2>
          <img src={edit} alt="" className="w-[10px] h-[10px]" />
        </div>

        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="pt-2 flex flex-col min-h-0 flex-[0.95]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-bold text-gray-600 flex gap-2">
                Channels <img src={arrow} alt="" className="w-[8px] pt-1" />
              </h3>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                totalChannelUnread > 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-white text-gray-500"
              }`}>
                {totalChannelUnread > 0 ? totalChannelUnread : channels?.length || 0}
              </span>
            </div>
            <ul className="mt-2 flex-1 min-h-0 overflow-y-auto hide-scrollbar">
              {channels?.map((channel) => (
                <li key={channel._id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[13px] font-medium text-gray-700 hover:bg-white/70"
                    onClick={() => handleChannelChat(channel.name, channel._id)}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center border text-[12px] font-medium text-white"
                        style={{
                          backgroundColor: getStableColor(channel?.name),
                        }}
                      >
                        {channel?.name?.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate flex-1 min-w-0">{channel.name}</span>
                      {channel?.unreadMessages > 0 && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-green-600">
                          {channel.unreadMessages}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col min-h-0 flex-[1.15]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-bold text-gray-600 flex gap-2">
                Messages <img src={arrow} alt="" className="w-[8px] pt-1" />
              </h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-gray-500">
                {employees?.filter((user) => user.lastMessageTime)?.length || 0}
              </span>
            </div>
            <ul className="hide-scrollbar mt-2 flex-1 min-h-0 overflow-y-auto pr-1">
              {employees
                ?.filter((user) => user.lastMessageTime)
                .map((user, i) => (
                  <li key={user.id || i}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[13px] font-medium text-gray-700 hover:bg-white/70"
                      onClick={() => handleChat(user.name, user.id)}
                    >
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center border text-[12px] font-medium text-white"
                        style={{
                          backgroundColor: getStableColor(user?.name),
                        }}
                      >
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex-1 truncate">{user?.name}</span>
                      {unreadMessages[user.id] > 0 && openChatId !== user.id && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-green-600">
                          {unreadMessages[user.id]}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
            </ul>
            <button
              type="button"
              className="mt-2 rounded-xl px-2 py-1.5 text-left text-[13px] text-gray-700 hover:bg-white/70"
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
