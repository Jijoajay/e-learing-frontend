import axios from "axios"

export default axios.create({
    baseURL: "https://elearning-backend-jk11.onrender.com",
    withCredentials:true,
    headers:{
        'Content-Type': 'application/json',  // set header so server knows we are sending json data
    }
})