import { useState } from "react";

// Stable color so the same name always produces the same hue. Matches the
// previous getStableColor used inline in Sidebar so the visual feel is preserved
// for users who don't have a profile image set.
const getStableColor = (text = "DM") => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 40%)`;
};

/**
 * Generic avatar that shows a profile image when available, otherwise a
 * colored circle with the user's first initial.
 *
 * Props:
 *  - name: string (used for the initial + stable color)
 *  - src: image URL (Cloudinary). If empty/undefined, falls back to letter avatar.
 *  - size: pixel size (default 32)
 *  - className: extra classes for the wrapper
 *  - fontSize: optional override for letter size
 *  - rounded: tailwind rounded class, default "rounded-full"
 *  - fit: "cover" (default, correct for profile photos — fills the circle)
 *         or "contain" (for channel logos — shows the whole logo with no
 *         cropping, since logos are rarely square and "cover" was zooming
 *         into their centre and cutting off the rest)
 */
export default function Avatar({
  name = "",
  src = "",
  size = 32,
  className = "",
  fontSize,
  rounded = "rounded-full",
  fit = "cover",
  title,
}) {
  const [imgError, setImgError] = useState(false);
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const dimension = `${size}px`;
  const useImage = src && !imgError;

  const computedFontSize =
    fontSize ||
    (size <= 24 ? "10px" : size <= 32 ? "12px" : size <= 48 ? "16px" : "18px");

  // White backdrop whenever there's an image: irrelevant for "cover" (the
  // photo fills the box edge-to-edge so the background never shows), but
  // needed for "contain" so a logo's transparent corners don't show
  // through to whatever's behind the avatar (a dark sidebar, etc).
  // box-sizing: border-box keeps the border INSIDE the given size instead
  // of growing the element past it.
  const wrapperStyle = {
    width: dimension,
    height: dimension,
    backgroundColor: useImage ? "#ffffff" : getStableColor(name || initial),
    fontSize: computedFontSize,
    border: "1.5px solid rgba(148, 163, 184, 0.55)",
    boxSizing: "border-box",
  };

  return (
    <span
      className={`shrink-0 inline-flex items-center justify-center text-white font-medium overflow-hidden ${rounded} ${className}`}
      style={wrapperStyle}
      title={title || name}
    >
      {useImage ? (
        <img
          src={src}
          alt={name || "avatar"}
          className={`w-full h-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
          onError={() => setImgError(true)}
        />
      ) : (
        initial
      )}
    </span>
  );
}
