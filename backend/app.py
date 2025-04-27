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
from PIL import Image
from PIL import UnidentifiedImageError
#import google.generativeai as genai
from googleapiclient.discovery import build
from google import genai
import re
import os
import requests



app = Flask(__name__)
from flask_cors import CORS

CORS(app, resources={r"/*": {"origins": ["*"]}})
#"https://inkquizly.tech", "https://www.inkquizly.tech"


bcrypt = Bcrypt(app)


ASTRA_TOKEN = os.environ.get("ASTRA_TOKEN")

# client = DataAPIClient(f"{DATA_API_CLIENT}") #FIX ME: USE ENV VAR ON VERCEL
# db = client.get_database_by_api_endpoint(
#   f"{API_KEY}" #ENV VAR
# )

client = DataAPIClient(ASTRA_TOKEN)
db = client.get_database_by_api_endpoint(
  "https://d48eb3bc-cf69-4655-baca-a381b7ee3136-us-east-2.apps.astra.datastax.com"
)



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
                "password": encrypted_password,
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
                "name": existingUser[0]["name"],
                "password": existingUser[0]["password"],
                "email": existingUser[0]["email"],
                "id":existingUser[0]["id"],
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
    


# @app.route("/getNote", methods=['POST', 'OPTIONS'])
# def getNote():
#     if request.method == "OPTIONS":
#         return jsonify({}), 204
#     data = request.get_json()
#     #FROM DATA GET NOTE DATA FROM DATABASE AND RETURN IT WITH JSNOFINY

@app.route("/getNote", methods=['POST', 'OPTIONS'])
def getNote():
    if request.method == "OPTIONS":
        return jsonify({}), 204
    
    try:
        # Get the JSON data from the request body
        data = request.get_json()

        # Assuming 'UID' is passed in the request data
        user_uid = data.get('user')  # Get the UID from the request data

        if not user_uid:
            return jsonify({"message": "UID not provided"}), 400

        # Connect to the database
        # client = DataAPIClient(DATA_API_CLIENT) #IMPORTANT MANY
        # db = client.get_database_by_api_endpoint(API_KEY)
        table = db.get_table("notes")

        # Fetch records based on UID
        notes_data = table.find({"uid": user_uid})

        # # Create a set to store unique note names
        # unique_note_names = set()

        # # Iterate through the records and add each unique 'note' to the set
        # for note in notes_data:
        #     note_name = note.get("note")  # Extract the note name
        #     if note_name:  # Ensure that there is a note_name value
        #         unique_note_names.add(note_name)  # Add it to the set (duplicates are automatically ignored)

                # Create dictionaries to store unique note names and corresponding confidence values
        note_confidence_dict = {}

        # Iterate through the records and add each unique 'note' to the dictionary
        for note in notes_data:
            note_name = note.get("note")  # Extract the note name
            confidence = note.get("confidence")  # Extract the confidence value

            if note_name:  # Ensure that there is a note_name value
                # If the note is not already in the dictionary, add it
                if note_name not in note_confidence_dict:
                    note_confidence_dict[note_name] = confidence

        # Extract the unique note names and corresponding confidence values
        unique_note_names = list(note_confidence_dict.keys())
        unique_confidences = list(note_confidence_dict.values())

        # Convert the set to a list and return as JSON
        # return jsonify({"note_names": list(unique_note_names)}), 200
        return jsonify({"note_names": unique_note_names, "confidences": unique_confidences}), 200


    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({"message": "Error occurred while fetching notes"}), 500
    
@app.route("/deleteNote", methods=['POST'])
def delete_note():
    try:
        # Get the data from the request body
        data = request.get_json()
        user_uid = data.get('user')
        note_name = data.get('note')
        
        if not user_uid or not note_name:
            return jsonify({"message": "User UID or Note Name not provided"}), 400
        
        # Fetch all notes matching note and uid to get the ids
        notes = table.find({"note": note_name, "uid": user_uid})
        
        if not notes:
            return jsonify({"message": "No matching notes found"}), 404

        # Delete all matching notes using their ids
        for note in notes:
            table.delete({"id": note["id"]})
        
        return jsonify({"message": "Notes deleted successfully"}), 200
    
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({"message": "Error occurred while deleting the note"}), 500





@app.after_request
def after_request(response):
    origin = request.headers.get("Origin")
    allowed_origins = ["*"]
    if origin in allowed_origins:
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

#genai.configure(api_key=GOOGLE_API_KEY)

client = genai.Client(api_key=GOOGLE_API_KEY) #IMPORTANT FIX

#client = genai.Client(api_key="AIzaSyBJw3b2gdm1iaRUScBMnA5bHCPE209lM2U")


#client = genai.GenerativeModel("gemini-2.0-flash")
#client = genai.Client()


# client = genai.Client(api_key=GOOGLE_API_KEY)
print("Connected!")

# response = client.models.generate_content(
#     model="gemini-2.0-flash", contents="Explain how AI works in a few words"
# )
# print(response.text)



# converts base64 type to readable text for general use
# def ocr_from_base64(b64_str):
#     # Decode the base-64 string into bytes
#     # Add padding if necessary
#     # The padding logic is correct, adding padding if it's not a multiple of 4
#     b64_str += "=" * ((4 - len(b64_str) % 4) % 4)  
    
#     try:
#         # The likely issue is with the image data itself. So, wrap it in a try-except
#         image_data = base64.b64decode(b64_str)
#         image = Image.open(BytesIO(image_data)).convert('RGB')
#         image_np = np.array(image)
#         reader = easyocr.Reader(['en'])
#         results = reader.readtext(image_np, detail=0)
#         return " ".join(results)
#     except UnidentifiedImageError:
#         # Handle the specific exception that PIL throws
#         # print out this helpful debugging message
#         print(f"Error: Could not identify image format from base64 string.")
#         # If you want, you can add more error handling or logging
#         return ""  # Or raise a custom exception

# Initialize EasyOCR reader
# reader = easyocr.Reader(['en'])

# def ocr_from_base64(b64_str, max_width=800, max_height=800, crop_area=None):
#     # Ensure the base64 string has proper padding
#     b64_str += "=" * ((4 - len(b64_str) % 4) % 4)  # Fix padding if missing

#     try:
#         # Decode the base64 string into bytes
#         image_data = base64.b64decode(b64_str)
        
#         # Open the image from bytes and convert to RGB mode
#         image = Image.open(BytesIO(image_data)).convert('RGB')

#         # Resize the image for better OCR performance (optional)
#         image = resize_image(image, max_width, max_height)

#         # Crop the image if a crop area is specified (optional)
#         if crop_area:
#             image = image.crop(crop_area)

#         # Convert the image to a numpy array (for EasyOCR processing)
#         image_np = np.array(image)
        
#         # # Initialize EasyOCR reader
#         # reader = easyocr.Reader(['en'])

#         # Perform OCR on the image
#         results = reader.readtext(image_np, detail=0)  # detail=0 returns only the text

#         # Join all recognized text into a single string and return it
#         return " ".join(results)
    
#     except UnidentifiedImageError:
#         # Handle the case where the image is invalid or cannot be identified
#         print(f"Error: Could not identify image format from base64 string.")
#         return "Invalid image format."
    
#     except Exception as e:
#         # Catch any other general errors
#         print(f"Error during OCR processing: {e}")
#         return "An error occurred during OCR processing."


# def resize_image(image, max_width, max_height):
#     # Get the current size of the image
#     width, height = image.size
    
#     # Calculate the scaling factor for width and height
#     scale_factor = min(max_width / width, max_height / height)

#     # If the image is smaller than the max dimensions, don't resize it
#     if scale_factor < 1:
#         new_width = int(width * scale_factor)
#         new_height = int(height * scale_factor)
#         image = image.resize((new_width, new_height), Image.ANTIALIAS)

#     return image
    
OCR_API_KEY = os.environ.get("OCR_API_KEY")


def ocr_from_base64(b64_str, max_width=800, max_height=800, crop_area=None):
    # Ensure the base64 string has proper padding
    b64_str += "=" * ((4 - len(b64_str) % 4) % 4)  # Fix padding if missing

    try:
        # Decode the base64 string into bytes
        image_data = base64.b64decode(b64_str)
        
        # Open the image from bytes and convert to RGB mode
        image = Image.open(BytesIO(image_data)).convert('RGB')

        # Resize the image for better OCR performance (optional)
        image = resize_image(image, max_width, max_height)

        # Crop the image if a crop area is specified (optional)
        if crop_area:
            image = image.crop(crop_area)

        # Convert the image to base64 after processing
        buffered = BytesIO()
        image.save(buffered, format="JPEG")
        b64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')

        # Perform OCR using OCR.space API
        ocr_text = ocr_space_from_base64(b64_image)

        # Return the OCR results
        return ocr_text
    
    except Exception as e:
        # Handle any general errors
        print(f"Error during OCR processing: {e}")
        return "An error occurred during OCR processing."

def resize_image(image, max_width, max_height):
    # Get the current size of the image
    width, height = image.size
    
    # Calculate the scaling factor for width and height
    scale_factor = min(max_width / width, max_height / height)

    # If the image is smaller than the max dimensions, don't resize it
    if scale_factor < 1:
        new_width = int(width * scale_factor)
        new_height = int(height * scale_factor)
        image = image.resize((new_width, new_height), Image.ANTIALIAS)

    return image

def ocr_space_from_base64(base64_str, api_key=OCR_API_KEY):
    url = 'https://api.ocr.space/parse/image'
    
    # Prepare the payload with the base64 string
    payload = {
        'apikey': api_key,
        'base64Image': f'data:image/jpeg;base64,{base64_str}'
    }
    
    # Send the POST request to OCR.space
    response = requests.post(url, data=payload)

    # Handle the response
    if response.status_code == 200:
        result = response.json()
        if result.get('ParsedResults'):
            # Extract the text from the response
            return " ".join([parsed_result['ParsedText'] for parsed_result in result['ParsedResults']])
        else:
            print("OCR failed to extract text.")
            return "No text found."
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return f"Error during OCR API call: {response.status_code}"

    

    

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
    model="gemini-2.0-flash", contents=f"Can you generate a short simplistic definition type response to the following phrase that is max 2 sentences to define the following phrase: {ocr_from_base64(data['img'])}, Make sure the definition is within the following context if given: {data['topic']}"
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



# @app.route("/save", methods=['POST'])
# def CanvasSave():
#     res=request.get_json()

#     #client = DataAPIClient(DATA_API_CLIENT) #FIX ME: USE ENV VAR ON VERCEL
#     client = DataAPIClient("AstraCS:SJhgQhsNgggKxufCHncCCXoe:4afbec1c9ea56f024aa1ce249855ef1b7001817640de6832e2883308ced7d6d0")
#     db = client.get_database_by_api_endpoint(
#     #API_KEY #ENV VAR #Important 2 things
#     "https://d48eb3bc-cf69-4655-baca-a381b7ee3136-us-east-2.apps.astra.datastax.com"
#     )
#     print("Connected!")
#     table=db.get_table("notes")


#     for index, values in zip(res['index'], res['dat']):
#         canvas_data={
#             "id":uuid.uuid4(),
#             "data":values,
#             "indx":index,
#             "note":res['note'],
#             "uid":uuid.uuid4(),
#         }
#         table.insert_one(canvas_data)

#     return jsonify({"message": "SUCCESS"})  # ✅ Add this


@app.route("/save", methods=['POST'])
def CanvasSave():
    try:
        # Get the JSON data from the request body
        res = request.get_json()

        # Connect to the database
        # client = DataAPIClient(DATA_API_CLIENT)
        # db = client.get_database_by_api_endpoint(API_KEY)
        print("Connected!") #Important change 4 times
        table = db.get_table("notes")

        note_name = res['note']  # The note name used for checking
        key=res['user']
        print("key is:",key)
        conf=res['conf']

        # Step 1: Process each index individually
        for index, values in zip(res['index'], res['dat']):
            # Query for the record by 'note' and 'indx' (only fetch the matching record)
            existing_note = table.find_one({"note": note_name, "indx": index})

            if existing_note:
                # Step 2: If the note exists, update it with the new data
                update_query = {"$set": {"data": values,"confidence":conf}}
                table.update_one({"id": existing_note['id']}, update_query)
                print(f"Updated existing note with ID: {existing_note['id']}, page index: {index}")
            else:
                # Step 3: If the note doesn't exist, insert a new record
                canvas_data = {
                    "id": str(uuid.uuid4()),  # Generate a new UUID for the new note
                    "data": values,
                    "indx": index,
                    "note": note_name,
                    "uid": key,  # Generate a UID for the new note
                    "confidence":conf,
                }
                table.insert_one(canvas_data)
                print(f"Inserted new note with name: {note_name}, page index: {index}")

        # Return a success message
        return jsonify({"message": "SUCCESS"}), 200

    except Exception as e:
        # Return an error message if something goes wrong
        print(f"Error occurred: {str(e)}")
        return jsonify({"message": "So an Error occurred during save operation", "error": str(e)}), 500


@app.route("/load", methods=['POST'])
def CanvasLoad():
    try:
        # Get the JSON data from the request body
        res = request.get_json()
        note_name = res['note']  # The note name to load

        # Connect to the database
        # client = DataAPIClient(DATA_API_CLIENT)
        # db = client.get_database_by_api_endpoint(API_KEY)
        print("Connected!")
        table = db.get_table("notes")

        # Find all rows with the given note name
        matching_rows = list(table.find({"note": note_name}))

        # Sort rows by the index field
        sorted_rows = sorted(matching_rows, key=lambda row: row['indx'])

        # Collect only the 'data' fields into a list
        ordered_data = [row['data'] for row in sorted_rows]

        return jsonify({"message": "SUCCESS", "data": ordered_data}), 200

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({"message": "So an Error occurred during load operation", "error": str(e)}), 500





if __name__ == "__main__":
    app.run(debug=True)
