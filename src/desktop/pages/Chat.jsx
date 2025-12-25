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
import { downloadFile, downloadImage, getFileNameFromUrl } from "../../utils/helper";

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
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setloading] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
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
        setMessages((prevMessages) => {
          if (newMessage?._id && prevMessages.some((msg) => msg._id === newMessage._id)) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });
      }
    };
    const unsubscribeMessage = onMessageReceived(messageListener);

    const statusListener = ({ userId, status }) => {
      if (userId === receiverId) {
        setIsOnline(status === "online");
      }
    };

    onUserStatusUpdate(statusListener);

    return () => {
      unsubscribeMessage?.();
      onUserStatusUpdate(() => {});
    };
  }, [senderId, receiverId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl(null);
      return;
    }
    if (!file.type?.startsWith("image/")) {
      setFilePreviewUrl(null);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setFilePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [file]);

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
    if (loading || uploading) return;
    if (!input.trim() && !file) return;

    let messageContent = input.trim();

    if (file) {
      setloading(true);
      const fileUrl = await uploadFile(file);

      if (!fileUrl) {
        setloading(false);
        return;
      }
      messageContent = fileUrl.fileUrl;
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
      sendMessage(senderId, receiverId, messageContent);
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

  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
  const isDocument = (url) => /\.(pdf|docx|doc|xlsx|xls|pptx|ppt|csv|txt|zip|rar)$/i.test(url);
  const isLikelyAttachment = (url) =>
    url?.startsWith("http") && (isImage(url) || isDocument(url) || url.includes("cloudinary"));
  const formatFileSize = (size) => {
    if (!size) return "";
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };
  const isSending = loading || uploading;

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
        {messages.map((msg, index) => {
          const isSelf = String(msg.sender) === String(senderId);
          const senderLabel = isSelf ? "You" : user?.name || "Unknown";
          return (
            <div
              key={index}
              className={`p-2 max-w-xs rounded-lg mb-2 flex justify-between gap-2 
                ${isSelf
                  ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white ml-auto"
                  : "bg-gradient-to-l from-gray-500 to-gray-700 text-white"
                }`}
              style={{
                width: `${msg.message.length <= 5 ? 90 : Math.min((msg.message?.length ?? 0) * 15, 300)}px`,
              }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold opacity-80">{senderLabel}</span>
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
                ) : isLikelyAttachment(msg.message) ? (
                  <div className="flex items-center gap-2 bg-gray-200 text-black p-2 rounded-lg">
                    <span className="truncate w-32">{getFileNameFromUrl(msg.message)}</span>
                    <button
                      onClick={() => downloadFile(msg.message)}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full text-center mt-1 self-start shadow-md"
                    >
                      Download
                    </button>
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
              </div>
              <span className="text-[9px] flex flex-col justify-end">{moment(msg.createdAt).format("HH:mm")}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {loading && (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 mb-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="p-3 lg:p-4 bg-white border-t w-full sticky bottom-0 left-0 right-0 z-10">
        {file && (
          <div className="mb-2 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            {filePreviewUrl ? (
              <img src={filePreviewUrl} alt="Selected file" className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded bg-gray-200 text-[10px] font-semibold text-gray-600 flex items-center justify-center">
                FILE
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{file.name}</p>
              <p className="text-[10px] text-gray-500">{formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="text-xs text-red-500"
            >
              Remove
            </button>
          </div>
        )}
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
            ref={fileInputRef}
            type="file"
            onChange={(e) => setFile(e.target.files[0] || null)}
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
            disabled={isSending}
          />

          <button
            onClick={handleSendMessage}
            className={`p-2 bg-orange-400 text-white rounded-lg shrink-0 ${isSending ? "opacity-60 cursor-not-allowed" : ""}`}
            disabled={isSending}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
