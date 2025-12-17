import { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";

const MobileConversations = () => {
  const { getAllUsers, getChannels } = useAuth();
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const u = await getAllUsers();
      const c = await getChannels();
      setUsers(u || []);
      setChannels(c?.channels || c || []);
    };
    load();
  }, []);

  return (
    <div className="space-y-6 py-2">
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Messages</h3>
        <div className="grid gap-2">
          {users?.map((u) => (
            <button
              key={u?.id}
              className="flex items-center justify-between p-3 bg-white rounded border shadow-sm"
              onClick={() =>
                navigate("/chat", {
                  state: { name: u?.name, id: u?.id },
                })
              }
            >
              <span className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold">
                  {u?.name?.[0]?.toUpperCase()}
                </span>
                <span className="text-sm">{u?.name}</span>
              </span>
              {u?.unreadMessages > 0 && (
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                  {u.unreadMessages}
                </span>
              )}
            </button>
          ))}
          {users?.length === 0 && <p className="text-xs text-gray-500">No recent conversations.</p>}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Channels</h3>
        <div className="grid gap-2">
          {channels?.map((ch) => (
            <button
              key={ch?._id}
              className="flex items-center justify-between p-3 bg-white rounded border shadow-sm"
              onClick={() =>
                navigate(`/channelchat`, {
                  state: { name: ch?.name, description: ch?.description, id: ch?._id },
                })
              }
            >
              <span className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                  {ch?.name?.[0]?.toUpperCase()}
                </span>
                <span className="text-sm">{ch?.name}</span>
              </span>
              <span className="text-xs text-gray-500">
                {Array.isArray(ch?.members) ? ch.members.length : 0} members
              </span>
            </button>
          ))}
          {channels?.length === 0 && <p className="text-xs text-gray-500">No channels found.</p>}
        </div>
      </section>
    </div>
  );
};

export default MobileConversations;
