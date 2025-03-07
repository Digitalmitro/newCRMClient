import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Transfer() {
  const navigate=useNavigate()
  const [transfer,setTransfer]=useState(
    {
      name:"",
      email:"",
      phone:"",
      calldate:"",
      domainName:"",
      buget:"",
      country:"",
      address:"",
      comments:"",
    }
  )

  const handleChange=(e)=>{
    let name=e.target.name;
    let value=e.target.value;
    setTransfer({
      ...transfer,
     
      [name]:value,
    })
  } 

  const handleSubmit=async(e)=>{
    e.preventDefault();
   
    try {
      const response=await fetch(`${import.meta.env.VITE_BACKEND_API}/transfer/`,{
        method:"POST",
        headers:{
          "Content-Type": "application/json",
          "Authorization":`Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(transfer)
      })
      setTransfer({
        name: "",
        email: "",
        phone: "",
        calldate: "",
        domainName: "",
        buget: "",
        country: "",
        address: "",
        comments: "",
      });
      navigate("/transferlist")
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <div className="p-4">
      <div className="flex justify-between px-4 border-b-2 border-gray-300 p-4">
        <div>
          <p className="text-[18px] font-medium">Transfer</p>
        </div>
        <div className=" ">
          <button className=" mx-2 border border-orange-500 text-[12px] py-0.5 text-orange-500 px-6 rounded cursor-pointer">
            Edit
          </button>
          <button className="border  border-orange-500 text-[12px] py-0.5 text-orange-500 px-2 rounded cursor-pointer">
            Add Comment
          </button>
        </div>
      </div>


      <div className="pt-10 px-2 ">
        <form className="w-full" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 ">
            {/* <div className="space-x-8 mb-4">
              <label htmlFor="text" className="text-[14px] font-medium">
                Created Date
              </label>
              <input
                type="text"
                name="createDate"
                id="createDate"
                className="border border-[#A6A6A6] outline-none px-2 rounded "
              />
            </div> */}
            <div className="space-x-19 mb-4">
              <label htmlFor="text" className="text-[14px] font-medium">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                className="border border-[#A6A6A6] outline-none px-2 rounded "
                onChange={handleChange}
                value={transfer.name}
              />
            </div>
            <div className="space-x-20 mb-4">
              <label htmlFor="text" className="text-[14px] font-medium">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleChange}
                value={transfer.email}
                className="border border-[#A6A6A6] outline-none px-2 rounded "
              />
            </div>
            <div className="space-x-4 mb-4">
              <label htmlFor="text" className="text-[14px] font-medium">
              Phone Number
              </label>
              <input
                type="number"
                name="phone"
                id="phone"
                onChange={handleChange}
                value={transfer.phone}
                className="border border-[#A6A6A6] outline-none px-2 rounded "
              />
            </div>
            <div className="space-x-6 mb-4">
              <label htmlFor="text" className="text-[14px] font-medium">
                Domain Name
              </label>
              <input
                type="text"
                name="domainName"
                id="domainName"
                onChange={handleChange}
                value={transfer.domainName}
                className="border border-[#A6A6A6] outline-none px-2 rounded "
              />
            </div>
            <div className="space-x-16 mb-4">
              <label htmlFor="text" className="text-[14px] font-medium">
                Address
              </label>
              <input
                type="text"
                name="address"
                id="address"
                onChange={handleChange}
                value={transfer.address}
                className="border border-[#A6A6A6] outline-none px-2 rounded "
              />
            </div>
            <div className="space-x-16 mb-4">
              <label htmlFor="text" className="text-[14px] font-medium">
                Country
              </label>
              <input
                type="text"
                name="country"
                id="country"
                onChange={handleChange}
                value={transfer.country}
                className="border border-[#A6A6A6] outline-none px-2 rounded "
              />
            </div>
            <div className="space-x-14 mb-4">
              <label htmlFor="text" className="text-[14px] font-medium">
                Call Date
              </label>
              <input
                type="date"
                name="calldate"
                id="calldate"
                onChange={handleChange}
                value={transfer.calldate}
                className="border border-[#A6A6A6] outline-none px-2 rounded "
              />
            </div>
            <div className="space-x-18 mb-4">
              <label htmlFor="text" className="text-[14px] font-medium">
                Budget
              </label>
              <input
                type="text"
                name="buget"
                id="buget"
                value={transfer.buget}
                onChange={handleChange}
                className="border border-[#A6A6A6] outline-none px-2 rounded "
              />
            </div>
            {/* <div className="space-x-12 mb-4">
              <label htmlFor="text" className="text-[14px] font-medium">
                Created By
              </label>
              <input
                type="text"
                className="border border-[#A6A6A6] outline-none px-2 rounded "
              />
            </div> */}
            <div className="mb-4 flex space-x-13 ">
              <label htmlFor="comment" className="text-[14px] font-medium mb-1">
                Comment
              </label>
              <textarea
              name="comments"
                id="comment"
                onChange={handleChange}
                value={transfer.comments}
                rows={3}
                className="border border-[#A6A6A6] outline-none px-2 py-1 rounded w-[44%]"
              />
            </div>
          </div>
          <div className="flex justify-center pt-8">
        <button type="submit" className="border  border-orange-500 text-[12px] py-0.5 text-orange-500 px-4 rounded cursor-pointer">Submit</button>
        </div>
        </form>
        
        
      </div>
    </div>
  );
}

export default Transfer