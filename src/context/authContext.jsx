import { createContext, useContext, useState,useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const initialToken =localStorage.getItem("token") 
    const [userData, setUserData] = useState([]);
    const [token, setToken] = useState(initialToken);
 
    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserData(decoded);
            } catch (error) {
                console.error("Invalid token:", error);
                setUserData(null);
            }
        } else {
            setUserData(null);
        }      
    }, []);


    const allConcerns = async (arg) => { 
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/concern/user`, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            }
          });
      
          if (response.ok) {
            const data = await response.json();
            const filteredConcerns = data?.concerns?.filter(concern => concern.concernType === arg);
            console.log(filteredConcerns);
            return filteredConcerns;
          } else {
            console.error("Failed to fetch concerns");
            return null;
          }
        } catch (error) {
          console.error("Error fetching data:", error.message);
          return null;
        }
      };
      

    const getAllUsers=async()=>{
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/message/recentChats`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
    
            if (response.ok) {
                const data = await response.json();
                return data?.users;
            }
        } catch (error) {
            console.error("Error fetching data:", error.message);
            return null;
        }
    } 

    const fetchAttendance = async (range) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/attendance/user?range=${range}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                console.error("Failed to fetch attendance data");
                return null;
            }
        } catch (error) {
            console.error("Error fetching attendance data:", error);
            return null;
        }
    };

    const getChannels=async()=>{
        const response=await fetch(`${import.meta.env.VITE_BACKEND_API}/api/all`,{
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
        if(response.ok){
          const data=await response.json();
          return data
        }
      }

    return (
        <AuthContext.Provider value={{ token, allConcerns, setToken,userData, getChannels, fetchAttendance,getAllUsers }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
