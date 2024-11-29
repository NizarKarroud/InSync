from flask import Flask, jsonify, render_template, request  , send_from_directory 
from flask_jwt_extended import create_access_token , JWTManager ,jwt_required , get_jwt_identity  , decode_token
from flask_swagger_ui import get_swaggerui_blueprint
from flask_pymongo import PyMongo 
from flask_mail import Mail , Message
from flask_socketio import SocketIO, emit , disconnect , join_room, leave_room
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename

import os ,json , shutil
from werkzeug.security import generate_password_hash , check_password_hash
from dotenv import load_dotenv
from threading import Thread
import models
import datetime 

from cryptography.fernet import Fernet


load_dotenv()

app = Flask(__name__)


socketio = SocketIO(app, cors_allowed_origins=["http://192.168.100.9:3000"])

app.config["MONGO_URI"] = os.getenv('MONGO_URI')

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("POSTGRES_URI")

app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'files' )

app.config['USERS_FOLDER'] = os.path.join(app.root_path, 'static', 'files' , "users" )
app.config['ROOMS_FOLDER'] = os.path.join(app.root_path, 'static', 'files' , "rooms" )

app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'} 

models.db.init_app(app)  

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = os.getenv('EMAIL_ADDRESS')
app.config['MAIL_PASSWORD'] = os.getenv('EMAIL_PWD')

app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")  

app.config["FRONTEND_URL"] = os.getenv("FRONTEND_URL")

app.config["ROOM_KEY"] = os.getenv("ROOM_KEY")

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

cipher_suite = Fernet(app.config["ROOM_KEY"])

def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

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

def create_encrypted_room_code(room_id, room_name, cipher_suite):
    room_info = {
        "room_id": room_id,
        "room_name": room_name
    }
    
    room_info_json = json.dumps(room_info)
    
    encrypted_room_code = cipher_suite.encrypt(room_info_json.encode())
    
    return encrypted_room_code

@socketio.on('connect')
def handle_connect():
    token = request.args.get('token')
    if not token:
        disconnect()  
        return
    user_payload = decode_jwt(token)
    if not user_payload:
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
    if not room_id:
        emit('error', {'message': 'Room ID is required!'})
        return

    join_room(room_id)

    emit('user_joined', {'user_id': user_id, 'room_id': room_id}, room=room_id)

    emit('joined_room', {'message': f'Joined room {room_id}'})


@socketio.on('joinDirectRoom')
def join_direct_room(data):
    token = request.args.get('token')

    if not token:
        emit('error', {'message': 'Token is missing!'})
        return

    user_payload = decode_jwt(token)

    if not user_payload:
        emit('error', {'message': 'Invalid or expired token!'})
        return


    user_id = user_payload["sub"]['user_id']  
    recipient = data.get('room')["users"][0]
    recipient_id = recipient["user_id"]
    room_id = data["room"]['room_id']


    join_room(room_id)

    emit('directRoomJoined', {
        'message': f'You have joined the direct room {room_id} with user {recipient_id}',
        'room_id': room_id
    })

@socketio.on('leaveRoom')
def leave_room_event(data):
    token = request.args.get('token')
    if not token:
        emit('error', {'message': 'Token is missing!'})
        return

    user_payload = decode_jwt(token)
    if not user_payload:
        emit('error', {'message': 'Invalid or expired token!'})
        return

    user_id = user_payload["sub"]['user_id']
    room_id = data

    if not room_id:
        emit('error', {'message': 'Room ID is required!'})
        return

    leave_room(room_id)

    emit('user_left', {'user_id': user_id, 'room_id': room_id}, room=room_id)

    emit('left_room', {'message': f'You have left the room {room_id}'})

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
    user = models.User.query.filter_by(user_id=user_id).first()    
    room_id = data.get('room_id')
    message = data.get('message')

    if not room_id or not message:
        emit('error', {'message': 'Room ID and message are required!'})
        return

    user_message = models.UserMessage(user_id , room_id , message , "text" ).json
    mongo.db.UserMessages.insert_one(user_message)
    emit('receiveMessage', {
        'room_id': room_id,
        'username' : user.username,
        'user_id': user_id,
        'message': message,
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }, room=room_id)  

@app.route('/room/create', methods=['POST'])
@jwt_required()
def create_room():
    current_user = get_jwt_identity()
    user_id = current_user.get("user_id")

    room_name = request.form.get('room_name')
    room_type = request.form.get('room_type')
    picture = request.files.get('picture')  

    if not room_name or not room_type or not user_id:
        return jsonify({"error": "Missing required fields"}), 400

    room = models.Room(room_name=room_name, room_type=room_type)
    models.db.session.add(room)
    models.db.session.commit()

    room_id = room.room_id

    room_folder_path = os.path.join(app.config['ROOMS_FOLDER'], str(room_id))
    if not os.path.exists(room_folder_path):
        os.makedirs(room_folder_path)

    if picture and allowed_file(picture.filename):
        filename = secure_filename(picture.filename)
        picture_path = os.path.join(room_folder_path, filename)

        picture.save(picture_path)

        room.room_picture = f'/{room_id}/{filename}'
        models.db.session.commit()

    room_user = models.RoomUsers(room_id=room_id, user_id=user_id)
    models.db.session.add(room_user)
    models.db.session.commit()
    return jsonify({"message": "Room created successfully", "room_id": room_id, "room_picture": room.room_picture}), 201

@app.route('/room/create_direct_room', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")  
def create_direct_room():
    current_user = get_jwt_identity()
    user_id = current_user.get("user_id")
    data = request.get_json()

    recipient_user_id = data.get("recipient_id")

    if not recipient_user_id:
        return jsonify({"message": "Recipient user ID is required"}), 400

    if user_id == recipient_user_id:
        return jsonify({"message": "Cannot create a room with yourself"}), 400

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

    new_room = models.Room(
        room_type="direct"
    )
    models.db.session.add(new_room)
    models.db.session.commit()

    room_user_1 = models.RoomUsers(user_id=user_id, room_id=new_room.room_id)
    room_user_2 = models.RoomUsers(user_id=recipient_user_id, room_id=new_room.room_id)
    models.db.session.add(room_user_1)
    models.db.session.add(room_user_2)
    models.db.session.commit()

    return jsonify({
        "message": "Direct room created successfully",
        "room_id": new_room.room_id
    }), 201


@app.route('/room/messages/<int:room_id>', methods=['GET'])
@jwt_required()
def get_room_messages(room_id):
    current_user = get_jwt_identity()
    user_id = current_user.get("user_id")

    offset = int(request.args.get('offset', 0))

    # Calculate the number of messages to skip (20 messages per offset)
    skip = offset * 20

    # Retrieve the 20 latest messages from the UserMessages collection for the given room
    messages = mongo.db.UserMessages.find(
        {'room_id': room_id}
    ).sort('timestamp', -1).skip(skip).limit(20)

    message_list = [
        {
            'user_id': message['sender_id'],
            'room_id': message['room_id'],
            'message': message['message'],
            'message_type': message['message_type'],
            'timestamp': message['timestamp']
        }
        for message in messages
    ]
    
    return jsonify({
        'messages': message_list
    }), 200

@app.route('/room/leave', methods=['POST'])
@jwt_required()
def leave_group():
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get("user_id")

        data = request.get_json()
        room_id = data.get("room_id")
        if not room_id:
            return jsonify({"error": "room_id is required"}), 400
        room_user_entry = models.RoomUsers.query.filter_by(user_id=user_id, room_id=room_id).first()
        if not room_user_entry:
            return jsonify({"error": "User is not a member of this room"}), 403

        # Remove the user from the RoomUsers table
        models.db.session.delete(room_user_entry)
        models.db.session.commit()

        # Check if any users remain in the room
        remaining_users = models.RoomUsers.query.filter_by(room_id=room_id).count()
        if remaining_users == 0:
            # If no users are left, delete the room
            room = models.Room.query.get(room_id)
            if room:
                models.db.session.delete(room)

                # Check if the room folder exists in the ROOMS_FOLDER
                room_folder = os.path.join(app.config['ROOMS_FOLDER'], str(room_id))
                if os.path.exists(room_folder):
                    # Remove the folder and its contents
                    shutil.rmtree(room_folder)

            models.db.session.commit()

        return jsonify({"message": "Successfully left the group"}), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        models.db.session.rollback()
        return jsonify({"error": "An error occurred while leaving the group"}), 500



@app.route("/room/join" , methods=['POST'])
@jwt_required()
def join_group() :
    # decrypted room code '{"room_id" : 1 , "room_name" : "test"}'

    current_user = get_jwt_identity()
    user_id = current_user.get("user_id")

    data = request.get_json()
    room_code = data.get("room_code")
    if not room_code:
        return jsonify({"message": "Room code is required."}), 400
    
    try :
        decrypted_room_code = cipher_suite.decrypt(room_code).decode()
        decrypted_room_info = json.loads(decrypted_room_code)
        room_id = decrypted_room_info["room_id"]
        room_name = decrypted_room_info["room_name"]
    except Exception :
        return jsonify({"message": "Invalid room code."}), 400
    
    room_user = models.RoomUsers.query.filter_by(user_id=user_id, room_id=room_id).first()
    if room_user:
        return jsonify({"message": "You are already in this room."}), 400

    try:
        new_room_user = models.RoomUsers(user_id=user_id, room_id=room_id)
        models.db.session.add(new_room_user)
        models.db.session.commit()

        return jsonify({
            "message": f"You have successfully joined the room: {room_name}"}), 200
    except Exception as e:
        models.db.session.rollback()
        return jsonify({"message": "An error occurred while joining the room."}), 500

    return jsonify({"decrypted" : decrypted_room_info})

@app.route("/user/current", methods=["GET"])
@jwt_required()
@limiter.limit("100 per minute")  
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
@limiter.limit("100 per minute") 
def get_user_groups():
    current_user = get_jwt_identity()
    user_id = current_user.get("user_id")

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
            .filter(models.RoomUsers.room_id == room.room_id) \
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
        room_code = create_encrypted_room_code(room.room_id , room.room_name ,cipher_suite )

        group_rooms.append({
            "room_id": room.room_id,
            "room_name": room.room_name,
            "room_code" : room_code.decode('utf-8'),
            "room_picture" : room.room_picture,
            "users": user_data
        })

    return jsonify({"group_rooms": group_rooms}), 200

@app.route("/user/dms", methods=["GET"])
@jwt_required()
@limiter.limit("100 per minute") 
def get_user_dms():
    current_user = get_jwt_identity()
    user_id = current_user.get("user_id")

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
                "profile_picture": user.profile_picture,
                "created_at" : user.created_at
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
@limiter.limit("3 per minute")  
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

@app.route('/user/notifications')
@jwt_required()
@limiter.limit("10 per minute")
def get_notifs():
    pass

@app.route("/rooms/<path:name>")
def download_rooms_file(name):
    try:
        return send_from_directory(app.config['ROOMS_FOLDER'], name)
    except FileNotFoundError:
        pass

@app.route("/users/<path:name>")
def download_users_file(name):
    try:
        return send_from_directory(app.config['USERS_FOLDER'], name)
    except FileNotFoundError:
        pass

@app.route("/user/dms/initiate", methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def create_dm_room():
    current_user = get_jwt_identity()
    user_id = current_user.get("user_id")
    
    data = request.get_json()
    print(data)
    recipient = data.get("recipient")

    recipient = models.User.query.filter_by(user_id=recipient.get("user_id")).first()
    if not recipient:
        return jsonify({"error": "Recipient does not exist."}), 404

    existing_room = (
        models.Room.query
        .filter_by(room_type="direct")
        .join(models.RoomUsers, models.Room.room_id == models.RoomUsers.room_id)
        .filter(models.RoomUsers.user_id.in_([user_id, recipient.user_id]))
        .group_by(models.Room.room_id)
        .having(models.db.func.count(models.RoomUsers.user_id) == 2)
        .first()
    )
    user_data = [
        {
            "user_id": recipient.user_id,
            "username": recipient.username,
            "email": recipient.email,
            "first_name": recipient.first_name,
            "last_name": recipient.last_name,
            "profile_picture": recipient.profile_picture,
            "created_at" : recipient.created_at,
            "role" : recipient.role
        }
    ]   

    if existing_room:
        return jsonify({
            "room_id": existing_room.room_id,
            "users" : user_data
        }), 200
    
    new_room = models.Room(
        room_type="direct",
        room_name=None, 
    )
    models.db.session.add(new_room)
    models.db.session.flush()  

    models.db.session.add(models.RoomUsers(user_id=user_id, room_id=new_room.room_id))
    models.db.session.add(models.RoomUsers(user_id=recipient.user_id, room_id=new_room.room_id))

    models.db.session.commit()

    return jsonify({
        "room_id": new_room.room_id,
        "users" : user_data
    }), 200
    

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


