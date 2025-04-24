from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from astrapy import DataAPIClient
import os
import uuid
import time
import base64
from io import BytesIO
import numpy as np
import easyocr
from PIL import Image
from PIL import UnidentifiedImageError
import google.generativeai as genai
from googleapiclient.discovery import build
import re
import os

app = Flask(__name__)
from flask_cors import CORS

CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:3000", "http://localhost:3000"]}})


bcrypt = Bcrypt(app)


DATA_API_CLIENT = os.environ.get("DATA_API_KEY")
API_KEY = os.environ.get("API_KEY")

client = DataAPIClient(DATA_API_CLIENT) #FIX ME: USE ENV VAR ON VERCEL
db = client.get_database_by_api_endpoint(
  API_KEY #ENV VAR
)
print("Connected!")

table = db.get_table("users")

tableNotes = db.get_table("notes")


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
                "name": "Test",
                "password": "Test2",
                "email": "Test3"
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
    


@app.route("/getNote", methods=['POST', 'OPTIONS'])
def getNote():
    if request.method == "OPTIONS":
        return jsonify({}), 204
    data = request.get_json()
    #FROM DATA GET NOTE DATA FROM DATABASE AND RETURN IT WITH JSNOFINY


@app.after_request
def after_request(response):
    origin = request.headers.get("Origin")
    if origin in ["http://127.0.0.1:3000", "http://localhost:3000"]:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


# pre-processing 
# api_key = "AIzaSyBJw3b2gdm1iaRUScBMnA5bHCPE209lM2U"
CX_VAR = os.environ.get("CX_VAR")
current_cx = CX_VAR
# genai.configure(api_key=api_key)
# model = genai.GenerativeModel("gemini-2.0-flash")
# chat_history = []  # stores the chat history (session-based)

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

client = genai.Client(api_key=GOOGLE_API_KEY)
print("Connected!")

# response = client.models.generate_content(
#     model="gemini-2.0-flash", contents="Explain how AI works in a few words"
# )
# print(response.text)



# converts base64 type to readable text for general use
def ocr_from_base64(b64_str):
    # Decode the base-64 string into bytes
    # Add padding if necessary
    # The padding logic is correct, adding padding if it's not a multiple of 4
    b64_str += "=" * ((4 - len(b64_str) % 4) % 4)  
    
    try:
        # The likely issue is with the image data itself. So, wrap it in a try-except
        image_data = base64.b64decode(b64_str)
        image = Image.open(BytesIO(image_data)).convert('RGB')
        image_np = np.array(image)
        reader = easyocr.Reader(['en'])
        results = reader.readtext(image_np, detail=0)
        return " ".join(results)
    except UnidentifiedImageError:
        # Handle the specific exception that PIL throws
        # print out this helpful debugging message
        print(f"Error: Could not identify image format from base64 string.")
        # If you want, you can add more error handling or logging
        return ""  # Or raise a custom exception
    

@app.route("/getsummarized", methods=['POST'])
def summarize_user_written():
    # Get the subtitle from the incoming request
    subtitle = request.get_json()
    
    # Assuming you have a model object that can generate content based on the subtitle
    response = client.models.generate_content(
    model="gemini-2.0-flash", contents="Can you generate a response to this that max 20 lines and is super understandable to any students? " \
                                      "Make sure that it is comprehensive yet super concise so that any student, regardless of their prior knowledge, will quickly understand " \
                                      f"and be able also to learn the implications of this and its application: {subtitle['topic']}"
    )
    
    # Return the AI-generated summary as a JSON response
    return jsonify({"summary": response.text})  # Ensure the response is correctly wrapped in a dictionary for jsonify


@app.route("/getdefinition", methods=['POST'])
def summarize_AI_written():
    # Get the subtitle from the incoming request
    data = request.get_json()
    
    # Assuming you have a model object that can generate content based on the subtitle
    response = client.models.generate_content(
    model="gemini-2.0-flash", contents=f"Can you generate a response to the following phrase that is max 2 sentences to define the following: {ocr_from_base64(data['img'])}, WITHIN this topic: {data['topic']}"
    )
    
    # Return the AI-generated summary as a JSON response
    return jsonify({"definition": response.text})  # Ensure the response is correctly wrapped in a dictionary for jsonify


# # returns response by taking 'subtitle' and generates a concise AI summary of that given 'subtitle'
# @app.route("/getsummarized", methods=['POST'])
# def summarize_user_written():
#     subtitle=request.get_json()
#     response = model.generate_content("Can you generate a response to this that max 20 lines and is super understandable to any students? " \
#     "Make sure that it is comprehensive yet super concise so that any student, regardless of their prior knowledge, will quickly understand " \
#     f"and be able also to learn the implications of this and its application: {subtitle.topic}")
#     return jsonify.response



# returns a list of 4 image URL links that is taylored to the 'subtitle' and 'specific' inputs
@app.route("/getimages", methods=['POST'])
def get_top_image_URL():
    data = request.get_json()
    # Combine the inputs to form the search query
    #query = topic.get('data', '')  # Access the 'data' field from the JSON (ensure the key is 'data')
    query={data['topic']}

    IMAGE_SEARCH = os.environ.get("IMAGE_SEARCH")
    # Build the Custom Search service
    service = build("customsearch", "v1", developerKey=IMAGE_SEARCH)
    
    # Execute the search request with searchType set to "image" and num set to 4
    result = service.cse().list(
        q=query,
        cx=current_cx,
        searchType="image",
        num=6  # Retrieve the top 4 results
    ).execute()

    links = [item['link'] for item in result.get('items', [])]
    return jsonify({"item1": links[0], "item2": links[1], "item3": links[2], "item4": links[3]})






# returns response from gemini that creates a 5 question MCQ based on a specific subtitle and returns a parsable dictionary
@app.route("/get", methods=['POST'])
def AI_MCQ():
    resp = request.get_json()
    response = model.generate_content(f"Create 5 multiple choice questions with 3 options each about {resp.data}. Please generate in the following format => Q1: (first question)\nA: (first choice for first question)\nB (second choice for first question)\nC (third choice for first question)\nCheck: (correct option A, B, or C)." \
                                      "PLEASE DON'T SAY ANYTHING ELSE BUT JUST GIVE WHAT I ASK. Also, go to the next line for every single new line")
    pattern = (
        r"Q\d+:\s*(.+?)\n"   # Capture the question text (non-greedy)
        r"A:\s*(.+?)\n"      # Capture option A
        r"B:\s*(.+?)\n"      # Capture option B
        r"C:\s*(.+?)\n"      # Capture option C
        r"Check:\s*([ABC])"  # Capture the correct option (A, B, or C)
    )
    
    matches = re.findall(pattern, response, re.DOTALL)

    # Build a list of dictionaries, one for each question
    mcq_list = []
    for question, option_a, option_b, option_c, correct in matches:
        mcq_list.append({
            'Q': question.strip(),
            'A': option_a.strip(),
            'B': option_b.strip(),
            'C': option_c.strip(),
            'Check': correct.strip()
        })



# returns response from gemini that creates a pomodoro study schedule that the student can use depending on the number of days before exam
@app.route("/getschedule", methods=['POST'])
def AI_study_schedule():
    data = request.get_json()
    numDays=data.days
    subtitle_confidence=data.confidence
    # Initialize an empty string
    subtitles_str = ""
    keys = list(subtitle_confidence.keys())
    for i, subtitle in enumerate(keys):
        subtitles_str += f"{subtitle} -> {subtitle_confidence[subtitle]}"
        if i < len(keys) - 1:
            subtitles_str += ", "

    response = client.models.generate_content(
    model="gemini-2.0-flash", contents=("I want you to create a study plan using pomodoro in the format: 'T1 is for first 25 minutes, T2 is the second 25 minutes, ... up to T4 ONLY'. " \
    f"Also, you need to consider that the exam is in {numDays} days from now, and depending on the urgency, review the most critical topic in the following topic and confidence level pairs (0 to 1): {subtitles_str}. " \
    "Don't say anything else except give me the schedule in the format I asked you and once only, just give what I ask and don't say what you understand or anything else."))

    # use regex to find pattern in generated response
    pattern = r'(T\d+):\s*(.+)'
    matches = re.findall(pattern, response)

    # Build the dictionary from the regex matches
    sceds = {key: value for key, value in matches}
    return jsonify({"one": sceds[0], "two": sceds[1], "three": sceds[2], "four": sceds[3]})



@app.route("/save", methods=['POST'])
def CanvasSave():
    res=request.get_json()

    client = DataAPIClient(DATA_API_CLIENT) #FIX ME: USE ENV VAR ON VERCEL
    db = client.get_database_by_api_endpoint(
    API_KEY #ENV VAR
    )
    print("Connected!")
    table=db.get_table("notes")


    for index, values in zip(res['index'], res['dat']):
        canvas_data={
            "id":uuid.uuid4(),
            "data":values,
            "indx":index,
            "note":res['note'],
            "uid":uuid.uuid4(),
        }
        table.insert_one(canvas_data)




if __name__ == "__main__":
    app.run(debug=True)
