import { useState, useRef, useEffect } from "react";
import { IoPeopleSharp } from "react-icons/io5";
import { Send, Paperclip, CornerUpLeft, X } from "lucide-react";
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
  const [replyTarget, setReplyTarget] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const highlightTimerRef = useRef(null);
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

  useEffect(() => {
    setReplyTarget(null);
    setHighlightedId(null);
  }, [groupUsers?.id]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

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
  const buildFileMessageUrl = (url, fileName) => {
    if (!url || !fileName) return url;
    if (url.includes("filename=")) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}filename=${encodeURIComponent(fileName)}`;
  };
  const handleSendMessage = async () => {
    if (loading || uploading) return;
    if (!input.trim() && !file) return;
    const draftInput = input.trim();
    setInput("");
    let messageContent = draftInput;
    if (file) {
      setloading(true);
      const fileUrl = await uploadFile(file);

      if (!fileUrl) {
        setloading(false);
        return;
      }
      messageContent = buildFileMessageUrl(fileUrl.fileUrl, file.name);
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
      replyTo: replyTarget?.id || null,
      createdAt: new Date(),
    };

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_API}/channels/send`, newMessage);
      sendChannelMessage(newMessage.channelId, newMessage.sender, newMessage.message);
      setInput("");
      setReplyTarget(null);
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
  const isVideo = (url) => /\.(mp4|webm|ogg|mov|mkv)$/i.test(url);
  const isAudio = (url) => /\.(mp3|wav|ogg|m4a|aac)$/i.test(url);
  const isPdf = (url) => /\.pdf$/i.test(url);
  const isDocument = (url) => /\.(pdf|docx|doc|xlsx|xls|pptx|ppt|csv|txt|zip|rar)$/i.test(url);
  const isLikelyAttachment = (url) =>
    url?.startsWith("http") &&
    (isImage(url) || isDocument(url) || isVideo(url) || isAudio(url) || url.includes("cloudinary"));
  const getFileExtension = (url) => {
    const fileName = getFileNameFromUrl(url);
    const parts = fileName.split(".");
    if (parts.length < 2) return "";
    return parts.pop().toLowerCase();
  };
  const getMessagePreview = (value) => {
    if (!value) return "";
    if (value.startsWith("http")) {
      if (isImage(value)) return "Photo";
      if (isVideo(value)) return `Video: ${getFileNameFromUrl(value)}`;
      if (isAudio(value)) return `Audio: ${getFileNameFromUrl(value)}`;
      if (isPdf(value)) return `PDF: ${getFileNameFromUrl(value)}`;
      if (isDocument(value)) return `Document: ${getFileNameFromUrl(value)}`;
      return "Link";
    }
    return value.length > 80 ? `${value.slice(0, 80)}...` : value;
  };
  const renderAttachment = (url) => {
    const fileName = getFileNameFromUrl(url);
    const extension = getFileExtension(url);
    const badge = extension ? extension.toUpperCase() : "FILE";
    const metaRow = (
      <div className="flex items-center gap-2 bg-white/90 text-gray-800 p-2 rounded-lg">
        <span className="text-[10px] font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
          {badge}
        </span>
        <span className="truncate w-32 text-[11px]" title={fileName}>
          {fileName}
        </span>
        <button
          onClick={() => downloadFile(url)}
          className="px-2 py-1 bg-slate-900 text-white text-xs rounded-full text-center shrink-0 shadow-md hover:bg-slate-800"
        >
          Download
        </button>
      </div>
    );

    if (isVideo(url)) {
      return (
        <div className="flex flex-col gap-2">
          <video src={url} controls preload="metadata" className="w-[220px] max-w-full rounded-md" />
          {metaRow}
        </div>
      );
    }
    if (isAudio(url)) {
      return (
        <div className="flex flex-col gap-2">
          <audio src={url} controls preload="metadata" className="w-[220px] max-w-full" />
          {metaRow}
        </div>
      );
    }
    if (isPdf(url)) {
      return (
        <div className="flex flex-col gap-2">
          <iframe
            src={url}
            title={fileName}
            className="w-[220px] h-[160px] max-w-full rounded-md border border-gray-200 bg-white"
          />
          {metaRow}
        </div>
      );
    }
    return metaRow;
  };
  const getReplyContext = (msg) => {
    if (!msg?.replyTo && !msg?.replyPreview?.message) return null;
    if (msg?.replyPreview?.message) {
      const senderName =
        msg.replyPreview.senderName ||
        (String(msg.replyPreview.sender) === String(senderId)
          ? "You"
          : getSenderName(String(msg.replyPreview.sender)));
      return { senderName, message: msg.replyPreview.message, id: msg.replyTo };
    }
    if (!msg?.replyTo) return null;
    const original = messages.find((item) => item._id === msg.replyTo);
    if (!original) {
      return { senderName: "Unknown", message: "Original message not available", id: msg.replyTo };
    }
    const senderName =
      String(original.sender) === String(senderId) ? "You" : getSenderName(String(original.sender));
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
    const senderName =
      String(msg.sender) === String(senderId) ? "You" : getSenderName(String(msg.sender));
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
                className={`p-2 rounded-lg mb-2 flex justify-between gap-2 w-fit max-w-[75%] min-w-[140px] shadow-sm
                        ${isSelf
                    ? "bg-orange-500 text-white ml-auto"
                    : "bg-slate-100 text-slate-900 border border-slate-200"
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
                        isSelf
                          ? "bg-white/20 border-white/60"
                          : "bg-slate-200/70 border-slate-300 text-slate-700"
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
                      <img
                        src={msg.message}
                        alt="Sent Image"
                        className="w-45 h-auto rounded-lg"
                      />
                      <button
                        onClick={() => downloadImage(msg.message)}
                        className="px-2 py-1 bg-slate-900 text-white text-xs rounded-full text-center mt-1 self-start shadow-md hover:bg-slate-800"
                      >
                        Download
                      </button>
                    </>
                ) : isLikelyAttachment(msg.message) ? (
                  renderAttachment(msg.message)
                ) : msg.message.startsWith("http") ? (
                <a
                  href={msg.message}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`underline break-words break-all ${
                    isSelf ? "text-white/90" : "text-blue-600"
                  }`}
                >
                  {msg.message}
                </a>
              ) : (
                <span className="whitespace-pre-wrap break-words overflow-auto">
                  {msg.message}
                </span>
              )}
                </div>
                <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      onClick={() => handleReplySelect(msg)}
                      className={isSelf ? "text-white/80 hover:text-white" : "text-slate-500 hover:text-slate-700"}
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
      {
        loading && (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 mb-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )
      }
      {/* Message Input */}
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

