import base64
from io import BytesIO
import numpy as np
import easyocr
from PIL import Image
from PIL import UnidentifiedImageError
import google.generativeai as genai
from googleapiclient.discovery import build
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import re
from astrapy import DataAPIClient
import uuid


app = Flask(__name__)
CORS(app)
#CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # Explicit CORS policy for frontend origin

#CORS(app)  # Enable CORS for all routes


@app.after_request
def apply_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE'
    return response


# pre-processing 
# api_key = "AIzaSyBJw3b2gdm1iaRUScBMnA5bHCPE209lM2U"
current_cx = "92852ef3945e14340"
# genai.configure(api_key=api_key)
# model = genai.GenerativeModel("gemini-2.0-flash")
# chat_history = []  # stores the chat history (session-based)

client = genai.Client(api_key="AIzaSyBJw3b2gdm1iaRUScBMnA5bHCPE209lM2U")

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
    
    # Build the Custom Search service
    service = build("customsearch", "v1", developerKey="AIzaSyAwjQCVdaB_8BZleDTnBybvLeMnJUMJbIk")
    
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

    client = DataAPIClient("AstraCS:SJhgQhsNgggKxufCHncCCXoe:4afbec1c9ea56f024aa1ce249855ef1b7001817640de6832e2883308ced7d6d0") #FIX ME: USE ENV VAR ON VERCEL
    db = client.get_database_by_api_endpoint(
    "https://d48eb3bc-cf69-4655-baca-a381b7ee3136-us-east-2.apps.astra.datastax.com" #ENV VAR
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
