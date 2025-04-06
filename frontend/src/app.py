from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from astrapy import DataAPIClient
import os
import uuid
import time


app = Flask(__name__)
from flask_cors import CORS

CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:3000", "http://localhost:3000"]}})


bcrypt = Bcrypt(app)

ApiClient = os.environ['ApiClient']
endpoint = os.environ['Endpoints']


client = DataAPIClient(ApiClient) #FIX ME: USE ENV VAR ON VERCEL
db = client.get_database_by_api_endpoint(
  endpoint #ENV VAR
)
print("Connected!")

table = db.get_table("users")


@app.route('/getSignUpDetails', methods=['POST', 'OPTIONS'])
def getSignUpDetails():
    if request.method == "OPTIONS":
        return jsonify({}), 204
    data = request.get_json()
    if data:
        firstName = data.get("firstName", "")
        lastName = data.get("lastName", "")
        email = data.get("email", "")
        password = data.get("password", "")
        confirmPassword = data.get("confirmPassword", "")

        if (firstName != "" and lastName != "" and email != "" and password != ""): #I/O Guard
            if password != confirmPassword:
                response = {
                    "message": "Error: Your passwords do not match. Try again!"
                }
                return jsonify(response)
            
            existingUser = list(table.find({"email": {"$eq": email}})) 


            if existingUser:# CHECKS TO SEE IF THERE IS AN EXISTING USER WITH THAT EMAIL
                response = {
                    "message": "You already have an account! Log In!"
                }
                return jsonify(response)
            
            id = uuid.uuid4()
            encrypted_password = bcrypt.generate_password_hash(password).decode("utf-8")
            user_data = {
                "id": id,
                "name": (firstName + " " + lastName),
                "email": email,
                "password": encrypted_password
            }
            table.insert_one(user_data)
            response = {
                "message": "Sucessfully created your account. Please Log In!"
            }
            return jsonify(response)
        else:
            response = {
                "message": "Error: Please fill out all of the fields"
            }
            return jsonify(response)
    else:
        response = {
            "message": "Error: Problem with getting data"
        }
        return jsonify(response)



@app.route("/getLoginDetails", methods=['POST', 'OPTIONS'])
def getLoginDetails():
    if request.method == "OPTIONS":
        return jsonify({}), 204
    data = request.get_json()
    if data:
        email = data.get("email", "")
        password = data.get("password", "")
        if email == "" or password == "":
            response = {
                "message": "Error: Please fill out of the fields"
            }
            return jsonify(response)
        existingUser = list(table.find({"email": {"$eq": email}}))
        if not existingUser:
            response = {
                "message": "Error: No Account found with that email"
            }
            return jsonify(response)
        if bcrypt.check_password_hash(existingUser[0]["password"], password):
            
            return jsonify({
            "message": "Success: Logged in!",
            "user": {
                "email": email,
                "name": "Pratheek",  # You can pull this from DB if needed
                "password": password
            }
        })
        else:
            response = {
                "message": "Error: Incorrect password"
            }
            return jsonify(response)
    else:
        response = {
            "message": "Error: Problem with getting data"
        }
        return jsonify(response)
    



@app.after_request
def after_request(response):
    origin = request.headers.get("Origin")
    if origin in ["http://127.0.0.1:3000", "http://localhost:3000"]:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response




if __name__ == "__main__":
    app.run(debug=True)


