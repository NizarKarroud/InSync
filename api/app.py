from flask import Flask, jsonify, render_template, request , url_for , send_from_directory
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

@app.route('/user/login' , methods=['POST'])
def login():
    data = request.get_json()  
    username = data.get('username')
    password = data.get('password')

    user_availability = models.User.query.filter_by(username=username).first()
    if user_availability : 
        hashed_password = user_availability.password
        if check_password_hash(hashed_password , password):
            return jsonify({"status" : "correct  credentials"}) , 200

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
        access_token = create_access_token(identity=username , expires_delta= datetime.timedelta(minutes=20))

        reset_link  = "http://" +app.config["FRONTEND_URL"]+ url_for('reset_password', token=access_token)
    
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
    data = request.get_json()

    user_availability = models.User.query.filter_by(username=current_user).first()

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


