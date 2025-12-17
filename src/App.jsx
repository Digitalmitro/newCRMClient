import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import DesktopRouting from "./desktop/Route";
import MobileRouting from "./mobile/Route";
import { AuthProvider } from "./context/authContext";

function App() {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);


  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth); 
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); 

 
  return (
    <AuthProvider>
    <BrowserRouter>
      {screenWidth >= 900 ? <DesktopRouting /> : <MobileRouting />}
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
