import { useState, useRef, useEffect } from "react";
import { IoPeopleSharp } from "react-icons/io5";
import { Send,Paperclip } from "lucide-react";
import moment from "moment";
import { useLocation } from "react-router";
import { BsEmojiSmile } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import { IoMdShareAlt } from "react-icons/io";
import { useAuth } from "../../context/authContext";
import {
  onChannelMessageReceived,
  sendChannelMessage,
  joinChannel,
} from "../../utils/socket"; // Socket functions
import axios from "axios";
import { BsThreeDotsVertical } from "react-icons/bs";
const ChannelChat = () => {
  const { userData } = useAuth();
  const location = useLocation();
  const groupUsers = location.state;
  const senderId = userData?.userId;
  const [messages, setMessages] = useState([]);
  const [channelInfo, setChannelsInfo] = useState();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null); const [modal, setModal] = useState(false);
  const [input, setInput] = useState("");
  const [inputSend, setInputSend] = useState("");
  const messagesEndRef = useRef(null);
  const handleShare = () => {
    setModal(true);
  };
  // console.log(channelInfo);

  const fetchChannelsInfo = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_API}/api/${groupUsers.id}`
      );
      setChannelsInfo(res.data);
    } catch (error) {
      console.error("❌ Error fetching channel:", error);
    }
  };

  // ✅ Fetch channel messages when component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_API}/channels/${groupUsers.id}`
        );
        setMessages(res.data.messages);
      } catch (error) {
        console.error("❌ Error fetching channel messages:", error);
      }
    };

    fetchMessages();
    joinChannel(groupUsers.id);
    fetchChannelsInfo();
  }, [groupUsers.id]);

  // ✅ Listen for new messages via Socket.io
  useEffect(() => {
    onChannelMessageReceived((newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = {
      sender: senderId, // Replace with actual user ID
      channelId: groupUsers.id,
      message: input,
      createdAt: new Date(),
    };

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_API}/channels/send`, newMessage);
      sendChannelMessage(newMessage.channelId, newMessage.sender, newMessage.message);
      setMessages([...messages, newMessage]); // Optimistic UI update
      setInput("");
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  };

  const handleSend = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_API}/api/invite`,
      {
        method: "POST",
        headers:{
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: channelInfo?._id,
          email: inputSend,
          invitedBy: userData?.userId,
        }),
      }
    );
    if (response.ok) {
      alert("Invite sent successfully");
    }
  };

  const handleText = (value) => {
    setInputSend(value)
  };

  const getSenderName = (senderId) => {
    return (
      channelInfo?.members?.find((member) => member._id === senderId)?.name ||
      "Unknown"
    );
  };

  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);

    setTimeout(() => {
      document.getElementById("chatInput").focus();
    }, 0);
  };
console.log(channelInfo)
  return (
    <div className="p-4 w-full flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex  justify-between mb-6 border-b pt-2 px-8 pb-2 w-full">
        <div className="flex gap-4">
          <div className="flex items-center gap-4">
            <p className="rounded-full border items-center text-[12px] flex justify-center w-10 h-10 font-medium text-white bg-orange-500">
              Group
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">
              {groupUsers?.name?.charAt(0).toUpperCase() +
                groupUsers?.name?.slice(1)}
            </h2>
            <p className="text-[10px] text-green-500 font-semibold">Active</p>
          </div>
          <div className="flex items-center space-x-2">
            <IoPeopleSharp />
            <p className="text[10px]">({channelInfo?.members.length})</p>
          </div>
        </div>
        <div className="relative flex">
          <IoMdShareAlt onClick={handleShare} className="cursor-pointer" />

          {modal && (
            <div className="absolute top-12 right-0 mt-2 space-y-4 bg-white px-2 pb-4 rounded shadow-lg  w-64">
              <button
                className="absolute top-1 right-0 text-xl px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setModal(false);
                }}
              >
                &times;
              </button>
              <input
                name="email"
                type="email"
                id="email"
                value={inputSend}
                onChange={(e) => handleText(e.target.value)}
                className="w-full p-1 mt-8  border border-gray-400 rounded outline-none text-[15px]"
              />
              <div className="flex justify-between">
                <p className="p-1 bg-gray-200 rounded text-[12px]">
                  {channelInfo.inviteLink}
                </p>
                <button
                  className="ml-2 px-2 text-[12px]  pb-0.5 pt-0.5 bg-orange-400 text-white rounded cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(channelInfo.inviteLink);
                    alert("Copied to clipboard!");
                  }}
                >
                  copy
                </button>
              </div>
              <div className="flex justify-center items-center">
                <button
                  className="ml-2 px-2 text-[12px]  pb-0.5 pt-0.5 bg-orange-400 text-white rounded"
                  onClick={handleSend}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto scrollable mb-10">
        {messages.map((msg) => (
          <div key={msg.id}>
            <div
              className={`pt-2 pb-2 px-2 max-w-xs rounded-lg mb-2 flex flex-col 
            ${msg.sender === senderId
                  ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white ml-auto"
                  : "bg-gradient-to-l from-gray-500 to-gray-700 text-white"
                }`}
              style={{
                width: `${msg.message.length <= 5
                    ? 120
                    : Math.min((msg.message?.length ?? 0) * 15, 300)
                  }px`,
              }}
            >
              <div className="flex gap-2 mb-2 justify-between">
                <p className="text-[10px]">{getSenderName(msg.sender)}</p>
                <BsThreeDotsVertical size={15}/>
              </div>

              <div className="flex gap-2">
                <span>{msg.message}</span>
              </div>

              <span className="text-[9px] flex justify-end">
                {moment(msg.createdAt).format("HH:mm")}
              </span>
           

            </div>
           
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white flex items-center border-t fixed bottom-0 w-[65%] space-x-2">
        <div className="relative">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <BsEmojiSmile size={22} className="cursor-pointer text-gray-500" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-10 left-0 z-50">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="hidden"
          id="fileInput"
        />
        <label htmlFor="fileInput" className="cursor-pointer">
          <Paperclip size={22} className="text-gray-500" />
        </label>

        <input
          type="text"
          className="flex-1 p-2 border rounded-lg outline-none text-[15px] w-full"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button
          onClick={handleSendMessage}
          className="ml-2 p-2 bg-orange-400 text-white rounded-lg"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChannelChat;
