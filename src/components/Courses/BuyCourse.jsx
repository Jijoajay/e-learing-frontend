import React, { useContext, useEffect, useRef } from 'react'
import { GiHamburgerMenu } from "react-icons/gi";
import "./BuyCourse.css"
import CourseVideopage from './CourseVideopage';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommentBox from './CommentBox';
import { FaStar } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import fetch from '../api/fetch';
import {motion, AnimatePresence} from  "framer-motion";
import { DataContext } from '../context/DataContext';

const BuyCourse = () => {
    const {courses, user, showFlashMessage} = useContext(DataContext)
    const navigate = useNavigate();
    const {id} = useParams();
    const course = courses?.find((course) => (course.id).toString() === id);
    const [sectionIndex, setSectionIndex] = useState(0)
    const[subtitleIndex,setSubtitleIndex] = useState(0)
    const [isSideActive, setIsSideActive] = useState(false)
    const videoContent = course?.videoContent || [];
    const [isActive, setIsActive] = useState(Array(videoContent.length).fill(false))
    const [activeRating, setActiveRating] = useState(false)
    const [videoCount, setVideoCount] = useState(0);
    const [videoWatched, setVideoWatched] = useState(0)
    const [hoverStar, setHoverStar] = useState(null);
    const [review, setReview] = useState("");
    const [hoverProgress, setProgress] = useState(false);
    const [courseCompleted, setCourseCompleted] = useState(false);
    const [videoIndex, setVideoIndex] = useState(0);
    const [userReview, setUserReview] = useState(false); 
    const [progressDetail, setProgressDetail] = useState([])
    const videoRef = useRef(null);
    const watchedFully = useRef(false);
    const count = progressDetail.map(progress => progress.video_index.length)
    const handleVideoEnded = ()=>{
        watchedFully.current = true;
    }

    useEffect(()=>{
        const fetchVideoCount = async()=>{
            if(user){
                const response = await fetch.get(`/get-completed-video/${user['id']}/${id}`)
                setProgressDetail(response.data)
            }
        }
        fetchVideoCount();
        if(count === videoCount){
            setCourseCompleted(true);
        }
    },[setProgressDetail,watchedFully]);

    const handleDropdownToggle = (index) => {
        const newIsActive = [...isActive];
        newIsActive[index] = !newIsActive[index];
        setIsActive(newIsActive);
    };
    
    useEffect(()=>{
        const updateVideoProgress = async()=>{
            try {
                const response = await fetch.post(`/add-completed-video/${videoIndex}/${user['id']}`,{course_id:course.id})
                showFlashMessage(response.data.message, "success")
            } catch (error) {
                showFlashMessage(error.response.data.response, "error")
            }
        }
        if(watchedFully && videoWatched > videoCount){
            setVideoWatched((prevCount)=> prevCount + 1)
            updateVideoProgress();
        }
    },[watchedFully,setVideoCount,setVideoWatched, subtitleIndex]);

    const handleStarHover = (index)=>{
        setHoverStar(index)
    }
    const handleStarLeave = () => {
        setHoverStar(null);
      };


  
    const handleClick = ()=>{
            setIsSideActive(!isSideActive)
    }
    const handleActiveRating = ()=>{
            setActiveRating(!activeRating)
        }

    
    useEffect(() => {
        const fetchVideoCount = () => {
          let count = 0;
            if (course?.videoContent && Array.isArray(course.videoContent)) {
            for (let subIndex = 0; subIndex < course.videoContent.length; subIndex++) {
                const videoContent = course?.videoContent[subIndex];
                if( videoContent.subtitle && Array.isArray(videoContent?.subtitle)){
                    for (let videoIndex = 0; videoIndex < videoContent?.subtitle.length; videoIndex++) {
                        const videoLink = course?.videoContent[subIndex]?.subtitle[videoIndex]?.videoLink;
                        if (videoLink) {
                            count++;
                        }
                    }
                }
            }
            }
            setVideoCount(count);
        };
      
        fetchVideoCount();
      }, [courses, subtitleIndex, sectionIndex]); 

      const handleReviewSubmit = async()=>{
        const review_detail = {
            user_id : user['id'],
            course_id :course.id,
            rating : hoverStar,
            review : review
        }
        try {
            const response = await fetch.post('/add-user-review',review_detail);
            showFlashMessage(response.data?.message, "success")
            setUserReview(true);
            setHoverStar(0);
            setReview('');
        } catch (error) {
            showFlashMessage("error found at posting user","error")
        }
      }
  return (
    <main>
        <div className="buycourse-container">
        <div  className={`sidebar-content ${isSideActive ? 'active' : ''}`}>
            {   isSideActive && course &&
                    <CourseVideopage
                    count = {progressDetail}
                    setVideoIndex={setVideoIndex}
                    course={course}
                    handleDropdownToggle={handleDropdownToggle}
                    isActive={isActive}
                    sectionIndex={sectionIndex}
                    setSubtitleIndex={setSubtitleIndex}
                    />
                }
        </div>
            <div className='buycourse-menu'>
                <nav className='buycourse-nav'>
                    <div className="hamburger-menu">
                        <div className="div">
                            <GiHamburgerMenu onClick={handleClick}/>
                        </div>
                        <div className="name">
                        {course?.name || 'Course Name Not Available'}
                        </div>
                    </div>
                    <div className='progress'>
                        <div className="review" onClick={()=>handleActiveRating()}>
                            <FaStar /> Leave a rating
                        </div>
                        <div className='progress-bar-container'><CircularProgressbar className='progress-bar' value={count} maxValue={videoCount} text={`${Math.ceil((count/videoCount) * 100)}%`} /></div>
                        <p onMouseEnter={()=>setProgress(true)} onMouseLeave={()=>setProgress(false)}>Your Progress</p>
                        {
                        course && hoverProgress &&
                            <div className='hoveredProgressContainer'>
                                {courseCompleted ?  
                                    <p>Click to get your certificate</p>
                                :
                                <>
                                    <p>{ count + " of " + videoCount + " complete" }</p>
                                    <p>Finish course to get your certificate</p>
                                </>
                                }
                            </div>                        
                        }
                     </div>
                </nav>
                {activeRating && course && (
                <AnimatePresence>
                    <motion.div
                    key="ratingContainer"
                    initial={{ opacity: 0, y:0}}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ duration: 1, delay:.4 }}
                    className={`ratingContainer ${activeRating ? "ratingContainer-active" : ""}`}
                    >
                    <p className='rating-cross' onClick={() => setActiveRating(false)}><RxCross2 /></p>
                    <motion.div
                        key="ratingContent"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, delay:.3 }}
                        className={`rating-content ${userReview ? "userReview" : ""}`}
                    >
                        {userReview ? (
                        <h3>Thanks for the review and the rating...</h3>
                        ) : (
                        <>
                            <h3>How would you rate this course?</h3>
                            <p>Select rating</p>
                            <p className='stars' onMouseLeave={() => handleStarLeave}>
                            {[...Array(5)].map((_, index) => (
                                <FaStar
                                key={index}
                                onMouseEnter={() => handleStarHover(index)}
                                className={hoverStar !== null && index <= hoverStar ? 'star-hovered' : ''}
                                />
                            ))}
                            </p>
                            {hoverStar > 0 && (
                            <>
                                <label>Review</label>
                                <textarea
                                type="text"
                                value={review}
                                placeholder='add a review'
                                onChange={(e) => setReview(e.target.value)}
                                />
                            </>
                            )}
                            <button role='submit' onClick={() => handleReviewSubmit()}>submit</button>
                        </>
                        )}
                    </motion.div>
                    </motion.div>
                </AnimatePresence>
                )}
                <div className={`video-display ${isSideActive ? 'video-display-active':"video-display"}`}>
                    <div className='video'>
                        <video src={course?.videoContent[sectionIndex]?.subtitle[subtitleIndex]?.videoLink} 
                        title={course?.name}
                        ref={videoRef}
                        onEnded={handleVideoEnded}
                        controls
                        >
                        </video>
                    </div>
                </div>
                <CommentBox 
                course={course}
                videoContent={videoContent}
                sectionIndex={sectionIndex}
                subtitleIndex={subtitleIndex}
                user={user}
                />
            </div>
            
        </div>
        <div className="black"></div>
        
           
    </main>
  )
}

export default BuyCourse