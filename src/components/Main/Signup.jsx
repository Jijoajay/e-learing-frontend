import React, { useState ,useEffect, useContext} from 'react'
// import api from "../api/fetch2"
import { useNavigate } from 'react-router-dom'
import flashapi from '../api/flashapi'
import { DataContext } from '../context/DataContext'
const Signup = () => {
  const {user,setAuthenticate,showFlashMessage} = useContext(DataContext)
  const [userName,setUserName] = useState("")
  const [userEmail,setUserEmail] = useState("")
  const [userPassword,setUserPassword] = useState("")
  const [role, setRole] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async(e)=>{
    e.preventDefault();
    const newUser = {
      name:userName,
      email:userEmail,
      password:userPassword
    }
    if(role === "student"){
      try{
        const response = await flashapi.post('/register',newUser);
        if(response.status === 201){
          localStorage.setItem("token",response.data.tokens)
          setAuthenticate(true)
          navigate('/')
          setUserName("")
          setUserEmail("")
          setUserPassword("")
          setRole("")
          showFlashMessage(response.data.message,"success")
        }
      }catch(err){
        showFlashMessage(err.message, "error")
      }
    }else if(role === "admin"){
      try {
        const response = await flashapi.post('/admin-register',newUser);
        if(response.status === 201){
          showFlashMessage(response.data.message, "success");
          localStorage.setItem("token",response.data.tokens)
          setAuthenticate(true)
          navigate('/')
          setUserName("")
          setUserEmail("")
          setUserPassword("")
          setRole("")
          showFlashMessage(response.data.message,"success")
        }
      }catch (error) {
        showFlashMessage(error.message, "error")
    }
  }
}
  
  useEffect(() => {
    setUserName("");
    setUserEmail("");
    setUserPassword("");
  }, [user,navigate]);

  return (
    <main className='signup-page'>
      <div className="signup-container">
          <h2>Sign Up</h2>
          <div className='signupform'>
            <form onSubmit={(e)=>handleSubmit(e)} >
              <label htmlFor="name">Name:</label><br />
              <input 
              type='text' 
              placeholder='Enter your name...' 
              value={userName}
              onChange={e=>setUserName(e.target.value)}
              /><br />
              <label htmlFor="email">Email:</label><br />
              <input 
              type="email" 
              placeholder='Enter your email...' 
              value={userEmail}
              onChange={(e)=>setUserEmail(e.target.value)}
              /><br />
              <label htmlFor="password">Password:</label><br />
              <input 
              type="password" 
              placeholder='Enter your password...' 
              value={userPassword}
              onChange={(e)=>setUserPassword(e.target.value)}
              /><br />
              <label htmlFor="password">Role:</label><br />
              <input type="text" 
               placeholder='Type your role...?'
               value={role}
               onChange={(e)=>setRole(e.target.value)}
              /><br />
              <button type="submit">Submit</button>
            </form>
          </div>
      </div>
    </main>
  )
}

export default Signup