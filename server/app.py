from flask import Flask,jsonify,request,session,make_response,abort
from model import Carousel, Message, SearchInfo, db,User, Course, Subtitle, VideoContent, WhatYouLearn, UserCourse, UserInfo,FavouriteInfo, Admin
from flask_cors import CORS,cross_origin
from flask_jwt_extended import JWTManager, create_access_token,get_jwt_identity,jwt_required
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from sqlalchemy.exc import InvalidRequestError
import stripe
import uuid
from datetime import timedelta
import firebase_admin
from firebase_admin import credentials
from firebase_admin import storage


stripe.api_key = "sk_test_51No0dvSJ3G54P1mW5EShkwMsialXkmB0TpxKyuh6y2c9bSHI0996lFjDsUUY0tmCtz0BhpimCZs8RAu8Of7SZz0w00BYPOiUFB"
app = Flask(__name__)
jwt = JWTManager(app)
app.config['SESSION_TYPE'] = 'memcached'
app.config['SECRET_KEY'] = 'super secret key'
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///flask.db"
db.init_app(app)


# session.init_app(app)
CORS(app, origins="http://localhost:3000", supports_credentials=True)
expires = timedelta(days=1)

@app.route('/users')
def users():
    try:
        user_email = session.get("user_email")
        if not user_email:
            return jsonify({
                'error': 'not login',
                "message": user_email
            })

        user = User.query.filter_by(email=user_email).first()
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "ennada kadachah...?"
        })

@app.route('/register', methods=['POST'])
def signup():
    try:
        name = request.json['name']
        email = request.json['email']
        password = request.json['password']
        
        user = User.query.filter_by(email = email).first() is not None
        admin = Admin. query.filter_by(email = email).first() is not None
        if user or admin:
            return jsonify({"message":"User already exists"}), 409
        else:
            expires = timedelta(days=1)
            token = create_access_token(identity=email,expires_delta=expires)
            new_user = User(
                id=str(uuid.uuid4()),
                name=name,
                email=email,
                password=password,
                tokens=str(token),
                
            )
            # new_token = Token(token=token, user=new_user)
            # db.session.add(new_token)
            db.session.add(new_user)
            db.session.commit();            
            return jsonify({
                "id":new_user.id,
                "name":new_user.name,
                "email":new_user.email,
                "tokens":token,
                "message":"user created successfully"
            }),201
    except Exception as e:
        print(str(e))
        return jsonify({
            "message":"Intenal server Error",
            "error":str(e)
        }),500
@app.route('/login',methods=["POST"])
def login():
    try:
        email = request.json['email']
        password = request.json['password']
        user = User.query.filter_by(email = email).first()
        if not user:
            try:
                email = request.json.get('email')
                password = request.json.get('password')
                admin = Admin.query.filter_by(email = email).first()
                if not admin:
                    return jsonify({
                        "message":"Please create an account First"
                    }),409 
                elif admin.password != password:
                    return jsonify({
                        "message":"Please provide correct password"
                    })   
                else: 
                    token = create_access_token(identity=email, expires_delta=expires)
                    admin.tokens = str(token)
                    db.session.commit()     
                    return jsonify({
                        'tokens':str(token),
                        "role":"admin"
                    }),201 
            except Exception as e:
                print(str(e))
                return jsonify({
                    "error":str(e)
                }),500
        elif user.password != password:
            return jsonify({
                "message":"Please provide correct password"
            })   
        else: 
            token = create_access_token(identity=email, expires_delta=expires)
            user.tokens = str(token)
            db.session.commit()     
            return jsonify({
                'tokens':str(token),
                "role": "student"
            }),201
    except Exception as e: 
        return jsonify({
            "message":"Internal error occured..",
            "error":str(e)
        }),500

@app.route('/user-data/<token_id>')
def user_data(token_id):
    user = User.query.filter_by(tokens = token_id ).first()
    if user:
        return jsonify(user.json()),201
    else:
        admin = Admin.query.filter_by(tokens = token_id ).first()
    if admin:
        return jsonify(admin.json())
    else:
        abort(404, description="User not found")

@app.route('/logout', methods=["POST"])
@jwt_required()
def logout_user():
    try:
        current_user = get_jwt_identity()  # Get the identity from the token
        user = User.query.filter_by(email=current_user).first()
        if user:
            user.tokens = ""
            db.session.commit()
            return jsonify({
                "message":"Logout successfully"
            }),201
        else:
            admin = Admin.query.filter_by(email=current_user).first()
        if admin:
            admin.tokens = ""
            db.session.commit()
            return jsonify({
                "message":"Logout successfully"
            }),201
    except ExpiredSignatureError as err:
        print(f"JWTError: {str(err)}")
        return jsonify({
            "error": str(err),
            "message": "Invalid or expired token"
        }), 401
    except InvalidTokenError as e:
        # Print the details of the InvalidTokenError (401 Unauthorized)
        print(f"InvalidTokenError: {str(e)}")
        return jsonify({
            "error": str(e),
            "message": "Invalid token"
        }), 401   
    except Exception as e:
        print(str(e))
        return jsonify({
            "error":str(e)
        })
    
    # end try
    


@app.route('/add-courses', methods=['POST'])
def add_courses():
    try:
        # Extract data from the JSON request
        name = request.json['name']
        author = request.json['author']
        img = request.json['img']
        oldPrice = request.json['oldPrice']
        newPrice = request.json['newPrice']
        courseOffers = request.json['courseOffers']
        whatYouLearn_data = request.json['whatYouLearn']
        videoContent_data = request.json['videoContent']
        admin_id = request.json['admin_id']
        category = request.json['category']

        # Create instances of WhatYouLearn and VideoContent
        whatYouLearn_objects = [WhatYouLearn(title=item['title']) for item in whatYouLearn_data]
        
        videoContent_objects = []
        for item in videoContent_data:
            # Create instances of subtitles for each subtitle item
            video_content = VideoContent(title=item['title'])
            subtitle_data = item.get('subtitle', [])
            subtitle = [Subtitle(content=sub_item['content'], videoLink=sub_item['videoLink'], videoDescription=sub_item['videoDescription']) for sub_item in subtitle_data]
            video_content.subtitle = subtitle
            # Correct way to associate subtitles
            videoContent_objects.append(video_content)
        


        # Create an instance of Course with the extracted data
        new_course = Course(
            id=str(uuid.uuid4()),
            name=name,
            img=img,
            category=category,
            admin_id = admin_id,
            author=author,
            oldPrice=oldPrice,
            newPrice=newPrice,
            courseOffers=courseOffers,
            whatYouLearn=whatYouLearn_objects,
            videoContent=videoContent_objects
        )

        # Add the new_course to the session and commit the changes
        db.session.add(new_course)
        db.session.commit()

        return jsonify({
            "message": "Product added successfully"
        })

    except InvalidRequestError as e:
        # Log the error for debugging purposes
        print("error on add-course",str(e))
        return jsonify({
            "InvalidRequestError":str(e)
        }),400
    except Exception as e:
        print(str(e))
        return jsonify({
            "message": "Internal server error",
            "error": str(e)
        }), 500

@app.route('/course/<category>', methods=['GET'])
def course_by_category(category):
    try:
        coursesByCategory = Course.query.filter_by(category=category).all()
        coursesByTags = Course.query.filter_by(tags=category).all()
        if coursesByCategory :
            return jsonify([course.json() for course in coursesByCategory]),200
        elif coursesByTags:
            return jsonify([course.json() for course in coursesByTags]),200
        else:
            return jsonify({
                "message":"category not found.."
            })
    except Exception as e:
        print(str(e))
        return jsonify({
            "message":str(e)
        })
    # end try
@app.route('/courses',methods=['GET'])
def courses():
    try:
        courses = Course.query.all()
        return jsonify([course.json() for course in courses]),200, {'Content-Type': 'application/json', 'indent': 2}
    except Exception as e:
        return jsonify({
            "error found":str(e)
        }),500      
@app.route('/edit-courses/<id>', methods=['POST'])
def edit_courses(id):
    try:
        whatYouLearn_data = request.json['whatYouLearn']
        videoContent_data = request.json['videoContent']
        
        whatYouLearn_objects = [WhatYouLearn(title=item['title'],course_id=id) for item in whatYouLearn_data]
        videoContent_objects = []
        for item in videoContent_data:
            video_content = VideoContent(title=item['title'])
            subtitle_data = item.get('subtitle', [])
            subtitle = [Subtitle(content=sub_item['content'], videoLink=sub_item['videoLink'], videoDescription=sub_item['videoDescription']) for sub_item in subtitle_data]
            video_content.subtitle = subtitle
            # Correct way to associate subtitles
            videoContent_objects.append(video_content)
            
        course = db.get_or_404(Course,id)
        # course.id = request.json['id']
        course.name = request.json['name']
        course.author = request.json['author']
        course.img = request.json['img']
        course.oldPrice = request.json['oldPrice']
        course.newPrice = request.json['newPrice']
        course.courseOffers = request.json['courseOffers']
        course.whatYouLearn = whatYouLearn_objects
        course.videoContent = videoContent_objects
        
        db.session.commit()
        
        return jsonify({
            "message":"course edited sucessfully"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error":str(e)
        })
    finally:
        db.session.close()

@app.route('/remove-course/<int:id>')
def remove_course(id):
    try:
        course = Course.query.filter_by(id=id).first()
        if course:
            db.session.delete(course)
            db.session.commit()
            return jsonify({
                "message": "course removed successfully"
            })
        else:
            return jsonify({
                "message": "course not found"
            })
    except Exception as e:
        print("=====>" + str(e))
        return jsonify({
            "message": f"An error occurred: {str(e)}"
        })

        
@app.route('/checkout-session')
def checkout():
    try:
        amount = request.json['amount']
        
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="INR"
        ) 
        return jsonify({
            'clientSecret': intent.client_secret
        })
    except Exception as e:
        jsonify({
            "error":str(e)
        })
    
    @app.route('/get_id')
    def payment_id():
        try:
            payment_id = request.json['razorpay_payment_id']
            new_payment_made = User(
                payment_id = payment_id
            )
            db.session.create(new_payment_made)
            db.session.commit()
            return jsonify({
                "payment_id":new_payment_made.payment_id
            })
        except Exception as e:
            return jsonify({
                "error":str(e)
            })
       
@app.route('/purchase_course',methods=['POST'])
def purchase():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        course_id = data.get('course_id')

        # Assuming user and course exist in the database
        user = User.query.filter_by(id=user_id).first()
        course = Course.query.filter_by(id=course_id).first()
        if user and course:
            # Create a new UserCourses record
            user_course = UserCourse(
                id = str(uuid.uuid4()),
                user_id = user.id,
                course_id = course.id,
                # user=user,
                # course=course
                )
            db.session.add(user_course)
            db.session.commit()

            # Get the course name
            course_name = course.name

            return jsonify({"message": "Course purchased successfully", "course_name": course_name}), 200

        return jsonify({"message": "User or course not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        

@app.route('/get_course/<user_id>')
def get_user_course(user_id):
    try:
        user_course = UserCourse.query.filter_by(user_id=user_id).all()
        if user_course:
            return jsonify({
                  "course": [course.json() for course in user_course]
            }), 200
        else:
            admin_course = Course.query.filter_by(admin_id = user_id).all()
            if admin_course:
                return jsonify({
                    "course": [course.json() for course in admin_course]
                })
            else:
                return jsonify({"message": "No courses found"}), 404
    except Exception as e:
        print(str(e))
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/add-user-detail/<id>', methods=['POST'])
def add_user_info(id):
    user = User.query.filter_by(id=id).first()
    admin = Admin.query.filter_by(id=id).first()
    if user or admin:
        try:
            
            fname = request.json['firstName']
            lname = request.json['lastName']
            headline = request.json['headline']
            phone_number = request.json['phoneNumber']
            website_link = request.json['websiteLink']
            youtube_link = request.json['youtubeLink']
            instagram_link = request.json['instagramLink']
            linkedIn_link = request.json['LinkedInLink']
            profile_img = request.json['profileImg']
            user_detail = UserInfo(
                id = str(uuid.uuid4()),
                first_name = fname,
                last_name = lname,
                Headline = headline,
                phone_number = phone_number,
                website_link = website_link,
                youtube_link = youtube_link,
                instagram_link = instagram_link,
                linkedin_link = linkedIn_link,
                profile_img = profile_img,
                user_id = id
            )
            db.session.add(user_detail)
            db.session.commit()
            return jsonify({
                "message":"user details added successfully"
            }),201
        except Exception as e:
            print("error occur in add-info-->",str(e))
            return jsonify({
                "error":str(e)
            }),500
    else:
        return jsonify({
        "error": "User not found"
        }), 404
    
    # end try
@app.route('/get_user_info')
def get_user_info():
    user = UserInfo.query.all()
    if user:
        return jsonify([user.json() for user in user])
    else:
        abort(404)
        
@app.route('/get_user_info/<user_id>',methods=['GET'])
def get_users(user_id):
    user_details = UserInfo.query.filter_by(user_id=user_id).first()
    if (user_details):
        try:
            if user_details:
                return jsonify(user_details.json())
        except Exception as e:
            print("error-->",str(e))
            return jsonify({
                "error":str(e)
            }),500
    else:
        abort(404)
        
@app.route('/add-to-favorite', methods=['POST'])
def add_favourite():
    course_id = request.json['course_id']
    user_id = request.json['user_id']
    print('--->id',course_id)
    try:
        new_favourite = FavouriteInfo(
            id = str(uuid.uuid4()),
            course_id = course_id,
            user_id = user_id
        )
        db.session.add(new_favourite)
        db.session.commit() 
        return jsonify({
            "message":"added to favourites"
        }),201
    except Exception as e:
        print("---->",str(e))
        return jsonify({
            "error":str(e)
        })
    
@app.route('/get-favourite/<user_id>')
def get_favourite(user_id):
    favs = FavouriteInfo.query.filter_by( user_id = user_id ).all()
    print(favs)
    if(favs):
        return jsonify({"favourites":[fav.json() for fav in favs]})
    else:
        return jsonify({
            "message":"no favourites found"
        })

@app.route('/remove-from-favourite',methods=['POST'])
def remove_favourite():
    course_id = request.json['course_id']
    if(course_id):
        FavouriteInfo.query.filter_by(course_id=course_id).delete()
        db.session.commit()
        return jsonify({
            "message":"favourite removed"
        })
    else:
        abort(404)
    
@app.route('/admin-register', methods=['POST'])
def admin_register():
    try:
        name = request.json['name']
        email = request.json['email']
        password = request.json['password']
        
        user = User.query.filter_by(email = email).first() is not None
        admin = Admin. query.filter_by(email = email).first() is not None
        if user or admin:
            return jsonify({"message":"User already exists"}), 409
        else:
            token = create_access_token(identity=email, expires_delta=expires)
            new_admin = Admin(
                id=str(uuid.uuid4()),
                name=name,
                email=email,
                password=password,
                tokens=str(token),
            )
            print(str(token))
            db.session.add(new_admin)
            db.session.commit();            
            return jsonify(new_admin.json()),201
    except Exception as e:
        return jsonify({
            "error":str(e)
        })
        print(str(e))
    # end try

@app.route('/user-searchresult', methods=['POST'])
def search_result():
    
    user_id = request.json['user_id']
    search_result = request.json['searchResult']
    
    try:
        if user_id and search_result:
            new_search = SearchInfo(
                id = str(uuid.uuid4()),
                user_id = user_id,
                search_result = search_result
            )
            db.session.add(new_search)
            db.session.commit()
            return jsonify({
                "message":"search result added"
            })
        else:
            return jsonify({"message":"no user_id or search_result found"})
    except Exception as e:
        print(str(e))
        
    # end try
@app.route('/get-searchHistory', methods=['POST'])   
def get_history():
    user_id = request.args.get('user_id')
    try:
        if user_id:
            histories= SearchInfo.query.filter_by(user_id=user_id).all()
            return jsonify([history.json() for history in histories])
    except Exception as e:
        print(str(e))
    # end try
@app.route('/add-message', methods=['POST'])
def add_message():
    message = request.json['message']
    user_id = request.json['user_id']
    img = request.json['img']
    
    try:
        if message and user_id:
            new_message = Message(
                id = str(uuid.uuid4()),
                message = message,
                user_id = user_id,
                img = img
            )
            db.session.add(new_message)
            db.session.commit()
            return jsonify({
                'message': 'Message has been saved'
            })
    except Exception as e:
        print(str(e))
        return jsonify({
            "message": str(e)
        })

@app.route('/get-messages')
def get_message():
    messages = Message.query.all()
    try:
        if(messages):
            return jsonify([message.json() for message in messages])
    except Exception as e:
        print(str(e))
        return jsonify({
            "message":str(e)
        })
    # end try
@app.route('/add-carousel',methods=["POST"])
def add_carousel(): 
    img = request.json['img']
    alt = request.json['alt']  
    try:
       if img and alt:
           new_image = Carousel(
               id = str(uuid.uuid4()),
               img = img,
               alt = alt
           )
           db.session.add(new_image)
           db.session.commit()
           return jsonify({
               "message" : "carousel saved successfully"
           })
    except Exception as e:
        print("error found at carousel adding", str(e))
        return jsonify ({
            "message" : str(e)
        })

@app.route('/get-carousel')
def get_carousel():
    images = Carousel.query.all()
    return jsonify([image.json() for image in images])

with app.app_context():
    db.create_all()
if __name__  == "__main__":
    app.run(debug=True,port=4500)