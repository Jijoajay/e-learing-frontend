import "./User.css"
import React, { useContext } from 'react'
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import IsFavourite from "./IsFavourite";
import { MdEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import fetch from "../api/fetch";
import { SocialIcons } from "./SocialIcons";
import MyLearning from "../MyLearning";
import { DataContext} from "../context/DataContext";

export const ViewProfile = ({ viewProfile}) => {
    const {user, handleClick, favour, setViewProfile, favourite,courses, info, handleRemoveCourse, showFlashMessage} = useContext(DataContext)
    const navigate = useNavigate();
    const saveMyLearning = JSON.parse(localStorage.getItem("myLearning")) || false ;
    const [myLearning, setMyLearning] = useState(saveMyLearning)
    const [fav, setFav] = useState(false);
    const [profile, setProfile] = useState([]);
    const {id} = useParams();
    useEffect(()=>{
        const fetchStorageData = async()=>{
            localStorage.setItem("mylearning",JSON.stringify(myLearning))
        }
        fetchStorageData();

      },[myLearning])
      
      const editProfile = async () => {
          try {
            setViewProfile(!viewProfile);
          } catch (error) {
            console.log(error);
          }
      };
    useEffect(()=>{
      if(id){
          try {
              const fetchUserInfo = async()=>{
                  const response = await fetch.get(`/get_user_info/${id}`)
                  setProfile([response.data])
              }
              fetchUserInfo();
          } catch (error) {
              showFlashMessage(error.message, "error")
          }
      }
  },[id])
  return (
        <main className="view-profile">
          {(profile.length > 0 ? profile : info).map((item, index) => (
            <div key={index}>
              <div className="profile-title">
                <h2>My Profile</h2>
              </div>
              <div className="prof">
                <h2>{item.first_name + " " + item.last_name}</h2>
                <p>{item.Headline}</p>
              </div>
              <div className="prof-img">
                <div>
                  { viewProfile && 
                  <div className="edit-icon" onClick={editProfile}>
                    <MdEdit />
                  </div>
                  }
                  <img src={item.profile_img} alt="" />
                </div>
                <div className="social-icons">
                  <SocialIcons  item={item}/>
                </div>
              </div>
            </div>
          ))}
          <div className="tablist-courses">
            <MyLearning 
              user={user}
              courses={courses}
              favour={favour}
              favourite={favourite}
              favs={false}
              coursee={true}
              title={false}
              handleClick={handleClick}
              handleRemoveCourse={handleClick}
            />
          </div>
        </main>
      );
    };
