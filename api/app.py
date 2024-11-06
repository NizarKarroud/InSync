from flask import Flask, jsonify, render_template, request , url_for
from flask_jwt_extended import create_access_token , JWTManager ,jwt_required , get_jwt_identity
from flask_swagger_ui import get_swaggerui_blueprint
from flask_pymongo import PyMongo
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail , Message
import os
from werkzeug.security import generate_password_hash , check_password_hash
from dotenv import load_dotenv
from threading import Thread

import models 

load_dotenv()

app = Flask(__name__)

app.config["MONGO_URI"] = os.getenv('MONGO_URI')

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("POSTGRES_URI")

db = SQLAlchemy(app)

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = os.getenv('EMAIL_ADDRESS')
app.config['MAIL_PASSWORD'] = os.getenv('EMAIL_PWD')

app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")  

jwt = JWTManager(app)

mail = Mail(app)

from threading import Thread

def send_email(app, msg):
    with app.app_context():
        mail.send(msg)

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

@app.route('/user/login' , methods=['POST'])
def login():
    data = request.get_json()  # Get the JSON data sent by the client
    username = data.get('username')
    password = data.get('password')
    print(username , password)

@app.route('/user/register' , methods=['POST'])
def register():
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = generate_password_hash(data.get("password"))
    last_name = data.get("last_name")
    role = data.get("role")
    first_name = data.get('first_name')
    registration_form = models.Registration(username , email , password , first_name , last_name , role).json
    mongo.db.registration.insert_one(registration_form)
    return '', 204  # 204 No Content



@app.route('/user/forgotpwd' , methods=['POST'])
def forgot_password():
    data = request.get_json()
    user_email = data.get("user_email")

    msg = Message()
    msg.subject = "Password Reset Request"
    msg.recipients = [user_email]
    msg.sender = str(os.getenv('EMAIL_ADDRESS'))

    # if username : 
        # access_token = create_access_token(identity=username)

    reset_link = reset_link = url_for('reset_password')
    msg.body = (
        f"Hello User,\n\n"
        f"We received a request to reset your password. "
        f"If this was you, please click the link below to reset your password:\n\n"
        f"{reset_link}\n\n"
        f"If you did not request a password reset, please ignore this email."
    )    
    Thread(target=send_email, args=(app, msg)).start()
    return jsonify(
        message=f"If a user with the email '{user_email}' exists, a recovery email has been sent."
    )


@app.route('/user/reset_password' , methods=['POST'])
@jwt_required()
def reset_password():
    current_user = get_jwt_identity()

if __name__ == '__main__':
    app.run('0.0.0.0', 16000 , debug=True)


