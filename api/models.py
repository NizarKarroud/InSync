from datetime import datetime , timezone
from app import db

class Registration:
    def __init__(self, username, email, password, first_name, last_name, role):
        self.username = username
        self.email = email
        self.password = password
        self.first_name = first_name
        self.last_name = last_name
        self.registration_date = datetime.now(timezone.utc)
        self.status = "pending"    # Current status of the registration (e.g., "pending", "approved", "rejected")
        self.admin_comments = ""
        self.role = role
    
    @property
    def json(self):
        return {
            "username": self.username,
            "email": self.email,
            "password": self.password,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "registration_date": self.registration_date.isoformat(),
            "status": self.status,
            "admin_comments": self.admin_comments,
            "is_active": self.is_active,
            "role": self.role
        }

class LoginAttempt:
    def __init__(self, username, ip_address, success):
        self.attempt_time = datetime.now(timezone.utc)
        self.username = username
        self.ip_address = ip_address
        self.success = success   # Whether the attempt was successful

    @property
    def json(self):
        return {
            "attempt_time": self.attempt_time.isoformat(),
            "username": self.username,
            "ip_address": self.ip_address,
            "success": self.success
        }

class UserMessage:
    def __init__(self, room_id, message_text , message_type , attachments):
        self.room_id = room_id
        self.timestamp =  datetime.now(timezone.utc)
        self.message_text = message_text  
        self.message_type = message_type  #"text",  // e.g., text, image, file
        self.attachments = attachments  # [ { type: "image", path: "static/files/room_id/file.extension" } ] 
    
    @property
    def json(self):
        return {
            "room_id": self.room_id,
            "timestamp": self.timestamp,
            "message_text": self.message_text,
            "message_type": self.message_type,
            "attachments": self.attachments
        }


class User(db.Model):
    __tablename__ = "Users"
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50) , nullable=False)
    password = db.Column(db.String(255) , nullable=False)
    email = db.Column(db.String(100) , unique=True,nullable=False)
    first_name = db.Column(db.String(50) , nullable=False)
    last_name = db.Column(db.String(50) , nullable=False)
    created_at = db.Column(db.DateTime, default= datetime.now(timezone.utc), nullable=False)
    account_status = db.Column(db.String(20), nullable=False) 
    isLogged = db.Column(db.Boolean, default=False, nullable=False)
    role = db.Column(db.String(20) , nullable=False)
    rooms = db.relationship('Room', secondary='RoomUsers', backref='users')

class Room(db.Model):
    __tablename__ = "Rooms"
    room_id = db.Column(db.Integer, primary_key=True)
    room_type = db.Column(db.String(10) , nullable=False)
    users = db.relationship('User', secondary='RoomUsers', backref='rooms')

class RoomUsers(db.Model):
    __tablename__ = "RoomUsers"
    user_id = db.Column(db.Integer, db.ForeignKey('Users.user_id'), primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('Rooms.room_id'), primary_key=True)


"""
    gonna store the file locally in static/files/room_id/file.extension
"""