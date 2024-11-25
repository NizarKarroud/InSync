from flask import Flask, jsonify, render_template, request , url_for , send_from_directory 
from flask_jwt_extended import create_access_token , JWTManager ,jwt_required , get_jwt_identity  , decode_token
from flask_swagger_ui import get_swaggerui_blueprint
from flask_pymongo import PyMongo
from flask_mail import Mail , Message
from flask_socketio import SocketIO, emit , disconnect , join_room, leave_room
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

import os
from werkzeug.security import generate_password_hash , check_password_hash
from dotenv import load_dotenv
from threading import Thread
import models
import datetime 


load_dotenv()

app = Flask(__name__)


socketio = SocketIO(app, cors_allowed_origins=["http://192.168.100.9:3000"])

app.config["MONGO_URI"] = os.getenv('MONGO_URI')

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("POSTGRES_URI")

app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'files' )

app.config['USERS_FOLDER'] = os.path.join(app.root_path, 'static', 'files' , "users" )

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

limiter = Limiter(get_remote_address, app=app)

def decode_jwt(token):
    try:
        payload = decode_token(token)
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    
def send_email(app, msg):
    with app.app_context():
        mail.send(msg)

@socketio.on('connect')
def handle_connect():
    token = request.args.get('token')
    print('Client connec')
    if not token:
        print("No token provided.")
        disconnect()  
        return


@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')


@socketio.on('joinRoom')
def join_room_event(data):
    token = request.args.get('token')
    if not token:
        emit('error', {'message': 'Token is missing!'})
        return

    user_payload = decode_jwt(token)
    if not user_payload:
        emit('error', {'message': 'Invalid or expired token!'})
        return

    user_id = user_payload["sub"]['user_id'] 
    room_id = data.get('room_id')
    print(data)
    if not room_id:
        emit('error', {'message': 'Room ID is required!'})
        return

    join_room(room_id)

    print("user joined : " , user_id)
    emit('user_joined', {'user_id': user_id, 'room_id': room_id}, room=room_id)

    emit('joined_room', {'message': f'Joined room {room_id}'})


@socketio.on('joinDirectRoom')
def join_direct_room(data):
    token = request.args.get('token')

    if not token:
        emit('error', {'message': 'Token is missing!'})
        return

    user_payload = decode_jwt(token)
    print( "user payload is " ,  user_payload)

    if not user_payload:
        emit('error', {'message': 'Invalid or expired token!'})
        return

    print("Data received in joinDirectRoom:", data)

    user_id = user_payload["sub"]['user_id']  
    recipient = data.get('room')["users"][0]
    recipient_id = recipient["user_id"]
    room_id = data["room"]['room_id']
    print(recipient_id)


    join_room(room_id)

    emit('directRoomJoined', {
        'message': f'You have joined the direct room {room_id} with user {recipient_id}',
        'room_id': room_id
    })

@socketio.on('sendDM')
def handle_send_message(data):
    token = request.args.get('token')
    if not token:
        emit('error', {'message': 'Token is missing!'})
        return

    user_payload = decode_jwt(token)
    if not user_payload:
        emit('error', {'message': 'Invalid or expired token!'})
        return

    user_id = user_payload["sub"]['user_id']
    room_id = data.get('room_id')
    message = data.get('message')

    if not room_id or not message:
        emit('error', {'message': 'Room ID and message are required!'})
        return

    # Broadcast the message to all users in the room
    emit('receiveMessage', {
        'room_id': room_id,
        'user_id': user_id,
        'message': message,
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }, room=room_id)  


@app.route('/room/create_direct_room', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")  # Limit to prevent spam
def create_direct_room():
    current_user = get_jwt_identity()
    user_id = current_user.get("user_id")
    data = request.get_json()

    recipient_user_id = data.get("recipient_id")

    if not recipient_user_id:
        return jsonify({"message": "Recipient user ID is required"}), 400

    # Check if the current user is the same as the recipient (cannot create direct room with themselves)
    if user_id == recipient_user_id:
        return jsonify({"message": "Cannot create a room with yourself"}), 400

    # Check if the direct room already exists between the two users
    existing_room = models.Room.query \
        .join(models.RoomUsers, models.Room.room_id == models.RoomUsers.room_id) \
        .filter(models.RoomUsers.user_id == user_id) \
        .join(models.RoomUsers, models.Room.room_id == models.RoomUsers.room_id) \
        .filter(models.RoomUsers.user_id == recipient_user_id) \
        .filter(models.Room.room_type == "direct") \
        .first()

    if existing_room:
        return jsonify({
            "message": "Direct room already exists",
            "room_id": existing_room.room_id
        }), 200

    # Create a new direct room
    new_room = models.Room(
        room_type="direct"
    )
    models.db.session.add(new_room)
    models.db.session.commit()

    # Add both users to the room
    room_user_1 = models.RoomUsers(user_id=user_id, room_id=new_room.room_id)
    room_user_2 = models.RoomUsers(user_id=recipient_user_id, room_id=new_room.room_id)
    models.db.session.add(room_user_1)
    models.db.session.add(room_user_2)
    models.db.session.commit()

    return jsonify({
        "message": "Direct room created successfully",
        "room_id": new_room.room_id
    }), 201







@app.route("/user/current", methods=["GET"])
@jwt_required()
@limiter.limit("20 per minute")  
def get_current_user():
    current_user = get_jwt_identity()
    
    user_id = current_user.get("user_id")
    user = models.User.query.filter_by(user_id=user_id).first()
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    user_data = {
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "account_status": user.account_status,
        "role": user.role,
        "profile_picture": user.profile_picture,
        "isLogged": user.isLogged,
        "created_at": user.created_at.isoformat()
    }
    
    return jsonify({"user": user_data}), 200

@app.route("/user/users", methods=["GET"])
@limiter.limit("15 per minute") 
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

@app.route("/user/groups", methods=["GET"])
@jwt_required()
@limiter.limit("15 per minute") 
def get_user_groups():
    # Get current user's ID from JWT token
    current_user = get_jwt_identity()
    user_id = current_user.get("user_id")

    # Fetch all group rooms the current user is part of
    group_room_users = models.RoomUsers.query \
        .join(models.Room, models.Room.room_id == models.RoomUsers.room_id) \
        .filter(models.RoomUsers.user_id == user_id, models.Room.room_type == "group") \
        .all()

    if not group_room_users:
        return jsonify({"message": "User is not a member of any group rooms"}), 404

    group_rooms = []
    for room_user in group_room_users:
        room = models.Room.query.get(room_user.room_id)

        users_in_room = models.User.query \
            .join(models.RoomUsers, models.User.user_id == models.RoomUsers.user_id) \
            .filter(models.RoomUsers.room_id == room.room_id, models.User.user_id != user_id) \
            .all()

        user_data = [
            {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_picture": user.profile_picture
            }
            for user in users_in_room
        ]

        group_rooms.append({
            "room_id": room.room_id,
            "room_name": room.room_name,
            "users": user_data
        })

    return jsonify({"group_rooms": group_rooms}), 200

@app.route("/user/dms", methods=["GET"])
@jwt_required()
@limiter.limit("10 per minute") 
def get_user_dms():
    # Get current user's ID from JWT token
    current_user = get_jwt_identity()
    user_id = current_user.get("user_id")

    # Fetch all direct rooms the current user is part of
    direct_room_users = models.RoomUsers.query \
        .join(models.Room, models.Room.room_id == models.RoomUsers.room_id) \
        .filter(models.RoomUsers.user_id == user_id, models.Room.room_type == "direct") \
        .all()

    if not direct_room_users:
        return jsonify({"message": "User is not a member of any direct message rooms"}), 404

    direct_rooms = []
    for room_user in direct_room_users:
        room = models.Room.query.get(room_user.room_id)

        users_in_room = models.User.query \
            .join(models.RoomUsers, models.User.user_id == models.RoomUsers.user_id) \
            .filter(models.RoomUsers.room_id == room.room_id, models.User.user_id != user_id) \
            .all()

        user_data = [
            {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_picture": user.profile_picture
            }
            for user in users_in_room
        ]

        direct_rooms.append({
            "room_id": room.room_id,
            "users": user_data
        })

    return jsonify({"direct_rooms": direct_rooms}), 200
      
@app.route('/user/login' , methods=['POST'])
@limiter.limit("5 per minute") 
def login():
    data = request.get_json() 
    user_ip = request.remote_addr

    username = data.get('username')
    password = data.get('password')

    user_availability = models.User.query.filter_by(username=username).first()
    if user_availability : 
        hashed_password = user_availability.password
        if check_password_hash(hashed_password , password):
            login_attempt = models.LoginAttempt(username , user_ip , True).json
            mongo.db.login_attempts.insert_one(login_attempt)


            access_token = create_access_token(
                identity={"user_id": user_availability.user_id, "username": username},
                expires_delta=datetime.timedelta(hours=24)
            )

            # Construct response
            response = jsonify({
                "status": "correct credentials"
            })

            response.headers['Authorization'] = f"Bearer {access_token}"
            user_availability.isLogged = True
            models.db.session.commit()
            return response, 200
                
    login_attempt = models.LoginAttempt(username , user_ip , False).json
    mongo.db.login_attempts.insert_one(login_attempt)
    return jsonify({"status" : "wrong credentials"}) , 401

@app.route('/user/register' , methods=['POST'])
@limiter.limit("2 per minute") 
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

@app.route('/user/update', methods=['PUT'])
@jwt_required()
@limiter.limit("2 per minute")  
def update_user():
    current_user = get_jwt_identity()
    user_id = current_user.get("user_id")
    
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")

    user = models.User.query.filter_by(user_id=user_id).first()

    if not user:
        return jsonify({"status": "User not found"}), 404

    if username and username != user.username:
        username_availability = models.User.query.filter_by(username=username).first()
        if username_availability:
            return jsonify({"status": "Username already in use"}), 400
        user.username = username

    if email and email != user.email:
        email_availability = models.User.query.filter_by(email=email).first()
        if email_availability:
            return jsonify({"status": "Email already in use"}), 400
        user.email = email

    models.db.session.commit()

    updated_user = {
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "account_status": user.account_status,
        "isLogged": user.isLogged,
        "created_at": user.created_at.isoformat()
    }
    access_token = create_access_token(identity={"username": user.username, "user_id": user_id} , expires_delta= datetime.timedelta(hours=24))
    response = jsonify({"status": "User updated successfully", "user": updated_user})
    response.headers['Authorization'] = f"Bearer {access_token}"

    return response , 200


@app.route("/users/<path:name>")
def download_file(name):
    try:
        return send_from_directory(app.config['USERS_FOLDER'], name)
    except FileNotFoundError:
        pass

@app.route('/user/forgotpwd' , methods=['POST'])
@limiter.limit("2 per minute") 
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

        reset_link  = "https://" +app.config["FRONTEND_URL"]+ "/reset_password/?token=" +access_token
    
        html_content = render_template('new-email.html', reset_link=reset_link)

        msg.html = html_content
 
        Thread(target=send_email, args=(app, msg)).start()
    
    return jsonify(
        message=f"If a user with the email '{user_email}' exists, a recovery email has been sent."
    ) , 200

@app.route('/user/reset_password' , methods=['POST'])
@jwt_required()
@limiter.limit("2 per minute") 
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
    socketio.run(app , host='192.168.100.9', port=16000 , debug=True )


