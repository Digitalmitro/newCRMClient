import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Send, Paperclip, CornerUpLeft, X } from "lucide-react";
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
  const messageRefs = useRef({});
  const highlightTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setloading] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
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
    setReplyTarget(null);
    setHighlightedId(null);
  }, [receiverId]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

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
      replyTo: replyTarget?.id || null,
      createdAt: new Date(),
    };

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_API}/message/send-message`, newMessage);
      sendMessage(senderId, receiverId, messageContent);
      setInput("");
      setReplyTarget(null);
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
  const getMessagePreview = (value) => {
    if (!value) return "";
    if (value.startsWith("http")) {
      if (isImage(value)) return "Photo";
      if (isDocument(value)) return `Document: ${getFileNameFromUrl(value)}`;
      return "Link";
    }
    return value.length > 80 ? `${value.slice(0, 80)}...` : value;
  };
  const getReplyContext = (msg) => {
    if (!msg?.replyTo && !msg?.replyPreview?.message) return null;
    if (msg?.replyPreview?.message) {
      const senderName =
        msg.replyPreview.senderName ||
        (String(msg.replyPreview.sender) === String(senderId) ? "You" : user?.name || "User");
      return { senderName, message: msg.replyPreview.message, id: msg.replyTo };
    }
    if (!msg?.replyTo) return null;
    const original = messages.find((item) => item._id === msg.replyTo);
    if (!original) {
      return { senderName: "Unknown", message: "Original message not available", id: msg.replyTo };
    }
    const senderName = String(original.sender) === String(senderId) ? "You" : user?.name || "User";
    return { senderName, message: getMessagePreview(original.message), id: msg.replyTo };
  };
  const formatFileSize = (size) => {
    if (!size) return "";
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };
  const isSending = loading || uploading;

  const formatDateLabel = (value) => {
    const day = moment(value);
    if (day.isSame(moment(), "day")) return "Today";
    if (day.isSame(moment().subtract(1, "day"), "day")) return "Yesterday";
    return day.format("DD MMM YYYY");
  };

  const handleReplySelect = (msg) => {
    if (!msg?._id) return;
    const senderName = String(msg.sender) === String(senderId) ? "You" : user?.name || "User";
    setReplyTarget({
      id: msg._id,
      senderName,
      message: getMessagePreview(msg.message),
    });
  };
  const scrollToMessage = (id) => {
    if (!id) return;
    const target = messageRefs.current[id];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(id);
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedId((current) => (current === id ? null : current));
    }, 1200);
  };

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
          {/* TODO: Re-enable Clear chat when we finalize this feature. */}
          {/* <button
            onClick={handleClearChat}
            className="text-xs px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-100"
          >
            Clear chat
          </button> */}
        </div>
      </div>

      <div className="flex-1 px-3 lg:px-4 overflow-y-auto scrollable pb-2">
        {messages.map((msg, index) => {
          const isSelf = String(msg.sender) === String(senderId);
          const senderLabel = isSelf ? "You" : user?.name || "Unknown";
          const replyContext = getReplyContext(msg);
          const currentDay = moment(msg.createdAt).format("YYYY-MM-DD");
          const previousDay =
            index > 0 ? moment(messages[index - 1]?.createdAt).format("YYYY-MM-DD") : null;
          const showDateDivider = index === 0 || currentDay !== previousDay;
          return (
            <div key={msg._id || index}>
              {showDateDivider && (
                <div className="flex justify-center my-2">
                  <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-[11px]">
                    {formatDateLabel(msg.createdAt)}
                  </span>
                </div>
              )}
              <div
                ref={(el) => {
                  if (msg?._id && el) {
                    messageRefs.current[msg._id] = el;
                  }
                }}
                className={`p-2 rounded-lg mb-2 flex justify-between gap-2 w-fit max-w-[75%] min-w-[140px]
                  ${isSelf
                    ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white ml-auto"
                    : "bg-gradient-to-l from-gray-500 to-gray-700 text-white"
                  } ${highlightedId === msg._id ? "ring-2 ring-orange-200" : ""}`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold opacity-80 truncate max-w-[220px]" title={senderLabel}>
                    {senderLabel}
                  </span>
                  {replyContext && (
                    <button
                      type="button"
                      onClick={() => scrollToMessage(replyContext.id)}
                      className={`mb-1 px-2 py-1 rounded border-l-4 text-left ${
                        isSelf ? "bg-white/20 border-white/60" : "bg-white/10 border-white/30"
                      } ${replyContext.id ? "cursor-pointer" : "cursor-default"}`}
                      disabled={!replyContext.id}
                    >
                      <p
                        className="text-[10px] font-semibold truncate max-w-[220px]"
                        title={replyContext.senderName}
                      >
                        {replyContext.senderName}
                      </p>
                      <p className="text-[10px] truncate" title={replyContext.message}>
                        {replyContext.message}
                      </p>
                    </button>
                  )}
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
                <div className="flex flex-col items-end justify-between">
                  <button
                    type="button"
                    onClick={() => handleReplySelect(msg)}
                    className="text-white/80 hover:text-white"
                  >
                    <CornerUpLeft className="w-3 h-3" />
                  </button>
                  <span
                    className="text-[9px] flex flex-col justify-end"
                    title={moment(msg.createdAt).format("DD MMM YYYY, HH:mm")}
                  >
                    {moment(msg.createdAt).format("HH:mm")}
                  </span>
                </div>
              </div>
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
        {replyTarget && (
          <div className="mb-2 flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-orange-700">
                Replying to {replyTarget.senderName}
              </p>
              <p className="text-[11px] text-gray-600 truncate">{replyTarget.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Cancel reply"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
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
