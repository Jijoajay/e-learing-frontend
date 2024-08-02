import { createContext, useState, useEffect } from "react";
import fetch from '../api/fetch';
import {useNavigate, useLocation} from "react-router-dom"

export const DataContext = createContext({});

export const DataProvider = ({children})=>{
  const navigate = useNavigate();
  const title = "My Learning"
  const [user, setUser] = useState(null)
  const [search,setSearch] = useState("")
  const [courses, setCourses] = useState([])
  const [searchResult,setSearchResult] = useState([])
  const [authenticate, setAuthenticate] = useState(false)
  const location =  useLocation();
  const [favourite, setFavourite] = useState([])
  const [boughtCourses, setBoughtCourses] = useState([]);
  const [info, setInfo] = useState([]);
  const [favour, setFavour] = useState([])
  const [flashMessage, setFlashMessage] = useState({message:"", category:""})

  const showFlashMessage = (message, category)=>{
    setFlashMessage({message,category})
    setTimeout(() => {
      hideFlashMessage()
    }, 5000);
  }
  const hideFlashMessage = ()=>{
    setFlashMessage({message:null, category:null})
  }

  useEffect(
    ()=>{
      const fetchCourseData = async()=>{
        try{
          const response = await fetch.get("/courses");
          setCourses(response.data)
        }catch(err){
          showFlashMessage(err.response?.data?.message || "An error occurred", "error");
        }
      }
      fetchCourseData();
  },[setCourses])
  useEffect(()=>{
      const fetchUserData = async()=>{
        try{
          const token = localStorage.getItem("token")
          if(token){
            try{
              const response = await fetch.get(`/user-data/${token}`)
              setUser(response.data)
            }catch(err){
              showFlashMessage(err.response?.data?.message);
            }
            setAuthenticate(true)
          }else{
            setAuthenticate(false)
          }
        }catch(err){
          showFlashMessage(err.response.data.message);
        }
      }
      fetchUserData();
  },[])

    const handleSubmit = (e)=>{
      e.preventDefault();
      navigate('/courses')
    }
    const handleClick = async(course_id)=>{
      if(favour.includes(course_id)){
        const response = await fetch.post('/remove-from-favourite', {course_id:course_id, user_id:user['id']})
        showFlashMessage(response.data.message, "success")
        const removeFavourite = favour.filter((data) => data !== course_id);
        setFavour(removeFavourite);
      }
      else{
        try{
          const response = await fetch.post('/add-to-favorite', {course_id:course_id, user_id:user['id']})
          showFlashMessage(response.data.message,"success")
          setFavour([...favour, course_id])
        }catch(err){
          showFlashMessage(err.message, "error")
        }
      }
    }
   
  const handleRemoveCourse = async(course_id)=>{
    const response = await fetch.get(`/remove-course/${course_id}`)
    showFlashMessage("Course deleted successfully");
  }
  useEffect(() => {
    const fetchData = async () => {
      const searchedResult = courses.filter((course) => {
        return course.name.toLowerCase().includes(search.toLowerCase());
      });
      setSearchResult(searchedResult);
      if (search && user && location.pathname === "/courses") {
        const searchDetail = {
          user_id: user.id,
          searchResult: search,
        };
        if(user){
          try {
            const response = await fetch.post('/user-searchresult', searchDetail);
            if(response.status === 404){
              showFlashMessage(response?.data.message, "warning")
            }
          } catch (error) {
            showFlashMessage(error?.response?.data?.message || "Please Sign or register to get full experience", "error");
          }
        }
      }
      if (location.pathname !== "/" && location.pathname !== "/courses") {
        setSearch("");
      }
    };
    fetchData();
  }, [courses, user, location.pathname]);
  useEffect(() => {
    const fetchData = async () => {
        try {
            const response = await fetch.get(`/get_course/${user["id"]}`);
            setBoughtCourses(response.data.course ) 
        } catch (error) {
          showFlashMessage(error?.response?.data?.message || "Please Sign or register to get full experience", "error");

        }
    };
    fetchData();
    const fetchFavouriteData = async()=>{
      try {
        if(user){
          const response = await fetch.get(`/get-favourite/${user['id']}`);
          setFavourite(response.data.favourites);
          const favorCourseIds = response.data.favourites
          .flatMap((data) => data.course.id)
          .filter((id) => id); 
          setFavour(favorCourseIds);
        }
      } catch (error) {
        console.log("error", error)
        // showFlashMessage(error.response.data.message, "error");
      }
    }
    fetchFavouriteData();
  }, [user,setFavour,setFavourite]);

  useEffect(() => {
    const fetchUserInfoData = async()=>{
        try {
            const response = await fetch.get(`/get_user_info/${user["id"]}`)
            setInfo(Array(response.data))
        } catch (error) {
            showFlashMessage(error?.response?.data?.message || "Please Sign or register to get full experience", "error");
        }
    }
    fetchUserInfoData();
    },[user]); 

    return(
        <DataContext.Provider 
        value={{
            search, courses, setSearch, handleSubmit, authenticate,setAuthenticate,boughtCourses, favour,favourite,info,
            user, handleClick, handleRemoveCourse, searchResult, setCourses, title, showFlashMessage, flashMessage, hideFlashMessage
        }}
        >
            {children}
        </DataContext.Provider>
    )
}