from flask import Flask, jsonify, render_template, request, redirect, url_for
from flask_jwt_extended import create_access_token , JWTManager ,jwt_required , get_jwt_identity
from flask_swagger_ui import get_swaggerui_blueprint
from dotenv import load_dotenv
from flask_pymongo import PyMongo
import os
from models import Registration
from werkzeug.security import generate_password_hash , check_password_hash

load_dotenv()

app = Flask(__name__)

app.config["MONGO_URI"] = os.getenv('MONGO_URI')


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

@app.route('/login' , methods=['POST'])
def login():
    data = request.get_json()  # Get the JSON data sent by the client
    username = data.get('username')
    password = data.get('password')
    print(username , password)

@app.route('/register' , methods=['POST'])
def register():
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = generate_password_hash(data.get("password"))
    last_name = data.get("last_name")
    role = data.get("role")
    first_name = data.get('first_name')
    registration_form = Registration(username , email , password , first_name , last_name , role).json()
    mongo.db.registration.insert_one(registration_form)
    return '', 204  # 204 No Content


if __name__ == '__main__':
    app.run('0.0.0.0', 16000 , debug=True)
