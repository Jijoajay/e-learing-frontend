import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import fetch from '../api/fetch'
import { useContext } from 'react'
import { DataContext} from '../context/DataContext'
const Signin = () => {
  const {setAuthenticate,showFlashMessage} = useContext(DataContext)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const navigate = useNavigate();

  const handleSubmit = async(e)=>{
    e.preventDefault();
    try {
      const response =  await fetch.post('/login',{
        email:loginEmail,password:loginPassword
      })
      if(response.status === 201){
        localStorage.setItem("token",response.data.tokens);
        showFlashMessage(response.data.message, "success");
        setAuthenticate(true)
        navigate('/')
        setLoginEmail("")
        setLoginPassword("")
      }else{
        showFlashMessage("Invalid Email or Password", "error")
      }
    }catch(error){
      showFlashMessage(error.message, "error");
    }
    }
  return (
    <main className='signup-page'>
      <div className="signup-container">
          <h2 className='signupH2'>Sign In</h2>
          <div className="signupform">
          <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email:</label><br />
              <input 
              type="email" 
              placeholder='Enter your email...' 
              value={loginEmail}
              onChange={(e)=>setLoginEmail(e.target.value)}
              /><br />
              <label htmlFor="password">Password:</label><br />
              <input 
              type="password" 
              placeholder='Enter your password...' 
              value={loginPassword}
              onChange={(e)=>setLoginPassword(e.target.value)}
              /><br />
              <button type="submit">Submit</button>
          </form>
          </div>
      </div>
    </main>
  )
}

export default Signin