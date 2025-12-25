import { useState, useRef, useEffect } from "react";
import { IoPeopleSharp } from "react-icons/io5";
import { Send, Paperclip } from "lucide-react";
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
import { downloadFile, downloadImage, getFileNameFromUrl } from "../../utils/helper";
const ChannelChat = () => {
  const { userData } = useAuth();
  const location = useLocation();
  const groupUsers = location.state;
  const senderId = userData?.userId;
  const [messages, setMessages] = useState([]);
  const [channelInfo, setChannelsInfo] = useState();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [modal, setModal] = useState(false);
  const [input, setInput] = useState("");
  const [inputSend, setInputSend] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setloading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
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
    const unsubscribe = onChannelMessageReceived((msg) => {
      if (String(msg?.channelId) !== String(groupUsers?.id)) return;
      setMessages((prevMessages) => {
        if (msg?._id && prevMessages.some((item) => item._id === msg._id)) {
          return prevMessages;
        }
        return [...prevMessages, msg];
      });
    });

    return unsubscribe;
  }, [groupUsers?.id]);

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

  // ✅ Handle sending a message
  const uploadFile = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/files/upload`,
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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
  // ✅ Handle sending a message
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
      sender: senderId, // Replace with actual user ID
      channelId: groupUsers.id,
      message: messageContent,
      createdAt: new Date(),
    };

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_API}/channels/send`, newMessage);
      sendChannelMessage(newMessage.channelId, newMessage.sender, newMessage.message);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };




  const handleSend = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_API}/api/invite`,
      {
        method: "POST",
        headers: {
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
  console.log(channelInfo)
  return (
    <div className="p-0 lg:p-4 w-full flex flex-col h-[calc(100vh-110px)] lg:h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 lg:mb-6 border-b pt-2 px-3 lg:px-8 pb-2 w-full">
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
      <div className="flex-1 px-3 lg:px-4 overflow-y-auto scrollable pb-2">
        {messages.map((msg, index) => {
          const isSelf = String(msg.sender) === String(senderId);
          const senderLabel = isSelf ? "You" : getSenderName(String(msg.sender));

          //(`${msg.message}?fl_attachment`)
          return (
            <div
              key={index}
              className={`p-2 max-w-xs rounded-lg mb-2 flex justify-between gap-2 
                      ${isSelf
                  ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white ml-auto"
                  : "bg-gradient-to-l from-gray-500 to-gray-700 text-white"
                }`}
              style={{
                width: `${msg.message.length <= 5
                  ? 90
                  : Math.min((msg.message?.length ?? 0) * 15, 300)
                  }px`,
              }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold opacity-80">{senderLabel}</span>
                {isImage(msg.message) ? (
                  <>
                    <img
                      src={msg.message}
                      alt="Sent Image"
                      className="w-45 h-auto rounded-lg"
                    />
                    <button
                      onClick={() => downloadImage(msg.message)}
                      className="px-2 py-1 bg-blue-000 text-white text-xs rounded-full text-center mt-1 self-start shadow-md"
                    >
                      Download
                    </button>
                  </>
                ) : isLikelyAttachment(msg.message) ? (
                  <div className="flex items-center gap-2 bg-gray-200 text-black p-2 rounded-lg">
                    <span className="truncate w-32">
                      {getFileNameFromUrl(msg.message)}
                    </span>
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
                <span className="whitespace-pre-wrap break-words overflow-auto">
                  {msg.message}
                </span>
              )}
              </div>
              <span className="text-[9px] flex flex-col justify-end">
                {moment(msg.createdAt).format("HH:mm")}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {
        loading && (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 mb-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )
      }
      {/* Message Input */}
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

export default ChannelChat;
