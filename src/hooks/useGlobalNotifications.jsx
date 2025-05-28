// hooks/useGlobalNotification.js
import { useEffect } from "react";
import { onNotificationReceived } from "../utils/socket";

export const useGlobalNotification = () => {
  useEffect(() => {
    const unsubscribe = onNotificationReceived((notification) => {
      //("🔔 Notification received globally:", notification);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);
};
