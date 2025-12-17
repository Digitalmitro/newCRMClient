import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Send, Paperclip } from "lucide-react";
import { useLocation } from "react-router-dom";
import {
  sendMessage,
  onMessageReceived,
  connectSocket,
  onUserStatusUpdate,
  fetchOnlineUsers,
} from "../../utils/socket";
import { useAuth } from "../../context/authContext";
import moment from "moment";
import { BsEmojiSmile } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import { downloadImage } from "../../utils/helper";

const Chat = () => {
  const location = useLocation();
  const user = location.state;
  const receiverId = user?.id;
  const selectedUser = location?.state?.selectedUsers;
  const { userData } = useAuth();
  const senderId = userData?.userId;
  const [isOnline, setIsOnline] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setloading] = useState(false);
  const authHeader = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const markMessagesAsRead = async (senderId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/message/messages/mark-as-read`,
        { senderId },
        { headers: authHeader }
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  useEffect(() => {
    if (receiverId) {
      markMessagesAsRead(receiverId);
    }
  }, [receiverId]);

  useEffect(() => {
    connectSocket();

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_API}/message/messages/${senderId}/${receiverId}`
        );
        setMessages(res.data?.messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    fetchOnlineUsers((onlineUsers) => {
      setIsOnline(onlineUsers.includes(receiverId));
    });

    const messageListener = (newMessage) => {
      if (
        (newMessage.sender === senderId && newMessage.receiver === receiverId) ||
        (newMessage.sender === receiverId && newMessage.receiver === senderId)
      ) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    };
    onMessageReceived(messageListener);

    const statusListener = ({ userId, status }) => {
      if (userId === receiverId) {
        setIsOnline(status === "online");
      }
    };

    onUserStatusUpdate(statusListener);

    return () => {
      onMessageReceived(() => {});
      onUserStatusUpdate(() => {});
    };
  }, [senderId, receiverId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadFile = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/files/upload`,
        formData,
        {
          headers: authHeader,
        }
      );
      setUploading(false);
      return response.data;
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploading(false);
      return null;
    }
  };

  const handleClearChat = async () => {
    if (!receiverId) return;
    const confirmed = window.confirm("Clear all messages in this chat? This can't be undone.");
    if (!confirmed) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/message/clear`,
        { otherUserId: receiverId },
        { headers: authHeader }
      );
      setMessages([]);
      alert("Chat cleared");
    } catch (error) {
      console.error("Error clearing chat:", error);
      alert("Unable to clear chat. Please try again.");
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !file) return;

    let messageContent = input.trim();

    if (file) {
      setloading(true);
      const fileUrl = await uploadFile(file);

      if (!fileUrl) return;
      messageContent = fileUrl.fileUrl;
      setFile(null);
      setloading(false);
    }

    const newMessage = {
      sender: senderId,
      receiver: receiverId,
      message: messageContent,
      createdAt: new Date(),
    };

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_API}/message/send-message`, newMessage);
      sendMessage(senderId, receiverId, input);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);

    setTimeout(() => {
      document.getElementById("chatInput").focus();
    }, 0);
  };

  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isDocument = (url) => /\.(pdf|docx|xlsx|pptx)$/i.test(url);

  return (
    <div className="p-0 lg:p-4 w-full flex flex-col h-[calc(100vh-110px)] lg:h-[calc(100vh-60px)]">
      <div className="flex gap-3 lg:gap-4 mb-4 lg:mb-6 border-b pt-2 px-3 lg:px-8 pb-2 items-center">
        <p className=" rounded-full border items-center  flex justify-center w-10 h-10 text-xl  text-white bg-orange-500">
          {user?.name?.charAt(0) || selectedUser?.[0]?.name?.charAt(0)}
        </p>
        <div>
          <h2 className="text-sm font-semibold">{user?.name}</h2>
          <p className="text-[10px] text-green-500 font-semibold">{isOnline ? "Online" : "Offline"}</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={handleClearChat}
            className="text-xs px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-100"
          >
            Clear chat
          </button>
        </div>
      </div>

      <div className="flex-1 px-3 lg:px-4 overflow-y-auto scrollable pb-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 max-w-xs rounded-lg mb-2 flex justify-between 
              ${msg.sender === senderId
                ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white ml-auto"
                : "bg-gradient-to-l from-gray-500 to-gray-700 text-white"
              }`}
            style={{
              width: `${msg.message.length <= 5 ? 90 : Math.min((msg.message?.length ?? 0) * 15, 300)}px`,
            }}
          >
            {isImage(msg.message) ? (
              <>
                <img src={msg.message} alt="Sent" className="w-45 h-auto rounded-lg" />
                <button
                  onClick={() => downloadImage(msg.message)}
                  className="px-2 py-1 bg-blue-000 text-white text-xs rounded-full text-center mt-1 self-start shadow-md"
                >
                  Download
                </button>
              </>
            ) : isDocument(msg.message) ? (
              <div className="flex items-center gap-2 bg-gray-200 text-black p-2 rounded-lg">
                <span className="truncate w-20">{msg.message.split("/").pop()}</span>
                <a
                  href={msg.message}
                  download
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full text-center mt-1 self-start shadow-md"
                >
                  Download
                </a>
              </div>
            ) : msg.message.startsWith("http") ? (
              <a
                href={msg.message}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-words text-blue-300 break-all"
              >
                {msg.message}
              </a>
            ) : (
              <span className="whitespace-pre-wrap break-words overflow-auto">{msg.message}</span>
            )}
            <span className="text-[9px] flex flex-col justify-end">{moment(msg.createdAt).format("HH:mm")}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {loading && (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 mb-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="p-3 lg:p-4 bg-white border-t w-full sticky bottom-0 left-0 right-0 z-10">
        <div className="flex items-center w-full gap-2">
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
            id="chatInput"
            type="text"
            className="flex-1 p-2 border rounded-lg outline-none text-[15px]"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />

          <button onClick={handleSendMessage} className="p-2 bg-orange-400 text-white rounded-lg shrink-0">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
