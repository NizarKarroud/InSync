from flask import Flask, jsonify, render_template, request , url_for , send_from_directory
from flask_jwt_extended import create_access_token , JWTManager ,jwt_required , get_jwt_identity
from flask_swagger_ui import get_swaggerui_blueprint
from flask_pymongo import PyMongo
from flask_mail import Mail , Message
from flask_socketio import SocketIO, emit

import os
from werkzeug.security import generate_password_hash , check_password_hash
from dotenv import load_dotenv
from threading import Thread
import models
import datetime 



load_dotenv()

app = Flask(__name__)

app.config["MONGO_URI"] = os.getenv('MONGO_URI')

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("POSTGRES_URI")

app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'chatapp', 'api', 'uploads')

models.db.init_app(app)  

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = os.getenv('EMAIL_ADDRESS')
app.config['MAIL_PASSWORD'] = os.getenv('EMAIL_PWD')

app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")  

app.config["FRONTEND_URL"] = os.getenv("FRONTEND_URL")

jwt = JWTManager(app)
mail = Mail(app)
mongo = PyMongo(app)

SWAGGER_URL = '/api/docs'  
API_URL = '/static/openapi.json'

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL, 
    API_URL,
    config={  
        'app_name': "Test application"
    }
)

app.register_blueprint(swaggerui_blueprint)


def send_email(app, msg):
    with app.app_context():
        mail.send(msg)

@app.route("/user/users", methods=["GET"])
def get_users():
    query = models.User.query

    username = request.args.get("username")
    email = request.args.get("email")
    role = request.args.get("role")
    account_status = request.args.get("account_status")
    is_logged = request.args.get("isLogged")
    first_name = request.args.get("first_name")
    last_name = request.args.get("last_name")
    
    if username:
        query = query.filter(models.User.username.ilike(f"%{username}%")) 
    if email:
        query = query.filter(models.User.email.ilike(f"%{email}%"))
    if role:
        query = query.filter(models.User.role == role)
    if account_status:
        query = query.filter(models.User.account_status == account_status)
    if is_logged :
        query = query.filter(models.User.isLogged == (is_logged.lower() == 'true'))
    if first_name:
        query = query.filter(models.User.first_name.ilike(f"%{first_name}%"))
    if last_name:
        query = query.filter(models.User.last_name.ilike(f"%{last_name}%"))

    users = query.all()

    user_list = [
        {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "created_at": user.created_at,
            "account_status": user.account_status,
            "isLogged": user.isLogged,
            "role": user.role,
            "profile_picture": user.profile_picture
        }
        for user in users
    ]

    return jsonify(user_list), 200

@app.route("/user/groups" , methods=["GET"])
@jwt_required()
def get_user_groups():
    current_user = get_jwt_identity()
    user_id = current_user.get("user_id")
    user_rooms = models.RoomUsers.query.filter_by(user_id=user_id).all()

    if not user_rooms:
        return jsonify({"message": "User is not a member of any rooms"}), 404

    rooms_data = []

    for room_user in user_rooms:
        room = models.Room.query.get(room_user.room_id)
        users_in_room = models.User.query \
                    .join(models.RoomUsers, models.User.user_id == models.RoomUsers.user_id) \
                    .filter(models.RoomUsers.room_id == room.room_id, models.User.user_id != user_id).all()

        user_data = []
        for user in users_in_room:
            user_data.append({
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_picture": user.profile_picture
            })

        rooms_data.append({
            "room_id": room.room_id,
            "room_type": room.room_type,
            "users": user_data
        })

    return jsonify({"rooms": rooms_data}), 200

    
@app.route('/user/login' , methods=['POST'])
def login():
    data = request.get_json() 
    user_ip = request.remote_addr

    username = data.get('username')
    password = data.get('password')

    user_availability = models.User.query.filter_by(username=username).first()
    if user_availability : 
        hashed_password = user_availability.password
        if check_password_hash(hashed_password , password):
            if user_availability.isLogged:
                login_attempt = models.LoginAttempt(username , user_ip , False).json
                mongo.db.login_attempts.insert_one(login_attempt)
                return jsonify({"status": "User is already logged in"}), 403
                
            login_attempt = models.LoginAttempt(username , user_ip , True).json
            mongo.db.login_attempts.insert_one(login_attempt)


            access_token = create_access_token(
                identity={"user_id": user_availability.user_id, "username": username},
                expires_delta=datetime.timedelta(hours=24)
            )

            response = jsonify({"status": "correct credentials"})
            response.headers['Authorization'] = f"Bearer {access_token}"
            user_availability.isLogged = True
            models.db.session.commit()
            return response, 200
                
    login_attempt = models.LoginAttempt(username , user_ip , False).json
    mongo.db.login_attempts.insert_one(login_attempt)
    return jsonify({"status" : "wrong credentials"}) , 401

@app.route('/user/register' , methods=['POST'])
def register():
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = generate_password_hash(data.get("password"))
    last_name = data.get("last_name")
    role = data.get("role")
    first_name = data.get('first_name')

    user_availability =models.User.query.filter_by(username=username).first()
    email_availability =models.User.query.filter_by(email=email).first()

    if email_availability : 
            return jsonify({"status" : "Email already used"}) , 400
    if user_availability :
            return jsonify({"status" : "Username already used"}) , 400
    
    registration_form = models.Registration(username , email , password , first_name , last_name , role).json
    mongo.db.registration.insert_one(registration_form)
   
    new_user = models.User(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role=role ,
        account_status="active"
    )

    models.db.session.add(new_user)
    models.db.session.commit()

    return jsonify({"status" : "Registration Form sent to the Administrator , please wait for the approval"}), 200

@app.route("/uploads/<path:name>")
def download_file(name):
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], name, as_attachment=True)
    except FileNotFoundError:
        pass

@app.route('/user/forgotpwd' , methods=['POST'])
def forgot_password():
    data = request.get_json()
    user_email = data.get("email")

    msg = Message()
    msg.subject = "Password Reset Request"
    msg.recipients = [user_email]
    msg.sender = str(os.getenv('EMAIL_ADDRESS'))

    email_availability = models.User.query.filter_by(email=user_email).first()

    if email_availability :
        username = email_availability.username 
        user_id = email_availability.user_id
        access_token = create_access_token(identity={"username": username, "user_id": user_id} , expires_delta= datetime.timedelta(minutes=20))

        reset_link  = "http://" +app.config["FRONTEND_URL"]+ "/reset_password/?token=" +access_token
    
        html_content = render_template('new-email.html', reset_link=reset_link)

        msg.html = html_content
 
        Thread(target=send_email, args=(app, msg)).start()
    
    return jsonify(
        message=f"If a user with the email '{user_email}' exists, a recovery email has been sent."
    ) , 200

@app.route('/user/reset_password' , methods=['POST'])
@jwt_required()
def reset_password():
    current_user = get_jwt_identity()
    user_id = current_user.get("user_id")
    
    data = request.get_json()

    user_availability = models.User.query.filter_by(user_id=user_id).first()

    if user_availability:
        pwd = data.get("password")
        new_password = generate_password_hash(pwd)
        user_availability.password = new_password

        models.db.session.commit()

        return jsonify({"message": "Password has been changed successfully"}), 200
    else:
        return jsonify({"message": "User not found"}), 404
        
if __name__ == '__main__':
    app.run('0.0.0.0', 16000 , debug=True)


