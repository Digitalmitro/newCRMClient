import attendence from "../../assets/desktop/attendence.svg";
import calls from "../../assets/desktop/calls.svg";
import sales from "../../assets/desktop/saleshome.svg";
import project from "../../assets/desktop/projectshome.svg";
import transferImg from "../../assets/desktop/transferhome.svg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { useEffect, useState } from "react";
import moment from "moment";
function Home() {
  const [dates, setDates] = useState([]);
  const [trans, setTrans] = useState([]);
  const [call, setCall] = useState([]);
  const [sale, setSale] = useState([]);
  const { fetchAttendance } = useAuth();
  const token = localStorage.getItem("token");
  const Sales = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/sale/user`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSale(data?.data || []);
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };
  const transfer = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/transfer/user`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      setTrans(result.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const callback = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/callback/user`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      console.log(result.data.length)
      setCall(result.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const navigate = useNavigate();
  const handleAttendaneList = () => {
    navigate("/attendance-list");
  };
  const handleCallback = () => {
    navigate("/callbacklist");
  };
  const handleSales = () => {
    navigate("/salelist");
  };
  const handleTransfer = () => {
    navigate("/transferlist");
  };
  const attendanceDates = dates.filter((items) => items.createdAt).length;
  const months = dates.map((items) => moment(items?.currentDate).format("MMM"));
  useEffect(() => {
    const getData = async () => {
      const data = await fetchAttendance("this_month");
      if (data) {
        setDates(data?.data);
      }
    };
    getData();
    transfer();
    callback();
    Sales();
  }, []);
  return (
    <div className="w-full">
      {/* Card Grid */}
      <div className="grid grid-cols-3 gap-8 w-full p-6">
        <div
          className="p-4 border rounded-md text-center h-[150px] w-full flex flex-col justify-center items-center cursor-pointer"
          onClick={handleAttendaneList}
        >
          <img src={attendence} alt="" className="w-[50px] h-[50px]" />
          <p className="flex flex-col p-2 text-[12px]">
            Attendee List: {months[0]} - {attendanceDates} days
          </p>
        </div>
        <div
          className="p-4 border rounded-md text-center h-[150px] w-full flex flex-col justify-center items-center cursor-pointer"
          onClick={handleCallback}
        >
          <img src={calls} alt="" className="w-[50px] h-[50px]" />
          <p className="flex flex-col p-2 text-[12px]">All Callback: {call.length}</p>
        </div>
        <div
          className="p-4 border rounded-md text-center h-[150px] w-full flex flex-col justify-center items-center cursor-pointer"
          onClick={handleSales}
        >
          <img src={sales} alt="" className="w-[50px] h-[50px]" />
          <p className="flex flex-col p-2 text-[12px]">All Sales: {sale.length}</p>
        </div>
        <div
          className="p-4 border rounded-md text-center h-[150px] w-full flex flex-col justify-center items-center cursor-pointer"
          onClick={handleTransfer}
        >
          <img src={transferImg} alt="" className="w-[50px] h-[50px]" />
          <p className="flex flex-col p-2 text-[12px]">
            {" "}
            All Transfer: {trans.length}
          </p>
        </div>
        <div className="p-4 border rounded-md text-center h-[150px] w-full flex flex-col justify-center items-center cursor-pointer">
          <img src={project} alt="" className="w-[50px] h-[50px]" />
          <p className="flex flex-col p-2 text-[12px]"> Projects: 0</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
