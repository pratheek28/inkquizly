import base64
from io import BytesIO
import numpy as np
import easyocr
from PIL import Image
from PIL import UnidentifiedImageError
import google.generativeai as genai
from googleapiclient.discovery import build

# pre-processing 
api_key = "AIzaSyAwjQCVdaB_8BZleDTnBybvLeMnJUMJbIk"
current_cx = "a34d2089943bf47e1"
genai.configure(api_key)
model = genai.GenerativeModel("gemini-2.0-flash")
chat_history = []  # stores the chat history (session-based)

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

# returns response by taking 'subtitle' and generates a concise AI summary of that given 'subtitle'
def summarize_user_written(subtitle):
    response = model.generate_content("Can you generate a response to this that max 20 lines and is super understandable to any students? " \
    "Make sure that it is comprehensive yet super concise so that any student, regardless of their prior knowledge, will quickly understand " \
    f"and be able also to learn the implications of this and its application: {subtitle}")
    return response

# returns response by taking 'topic' and 'question' and answers the question WITHIN that topic ~ also allows saves chat history for follow-ups
def topic_specific_question(b64_topic, question):
    chat_history.append(f"Can you generate an answer to this question within 20 lines: {question}, KNOWING that the topic is: {ocr_from_base64(b64_topic)}")
    response = model.generate_content(chat_history)
    chat_history.append(response)
    return response

# returns a list of 4 image URL links that is taylored to the 'subtitle' and 'specific' inputs
def get_top_image_URL(b64_subtitle, specific):
    # Combine the inputs to form the search query
    query = f"{ocr_from_base64(b64_subtitle)} {specific}"
    
    # Build the Custom Search service
    service = build("customsearch", "v1", developerKey=api_key)
    
    # Execute the search request with searchType set to "image" and num set to 4
    result = service.cse().list(
        q=query,
        cx=current_cx,
        searchType="image",
        num=4  # Retrieve the top 4 results
    ).execute()
    
    # Extract the image URLs from the results
    if 'items' in result:
        return [item['link'] for item in result['items']]
    else:
        return []

# returns response by taking 'subtitle' and 'phrase' to generate a concise AI definition summary of a specific phrase from AI summary
def summarize_AI_written(b64_subtitle, b64_phrase):
    response = model.generate_content(f"Can you generate a response to the following phrase that is max 3 sentences to define the following: {ocr_from_base64(b64_phrase)}, WITHIN this topic: {ocr_from_base64(b64_subtitle)}")
    return response

# returns response from gemini that creates a scientifically proven study schedule that the student can use depending on the number of days before exam
def AI_study_schedule(numDays, subtitle_confidence):
    # Initialize an empty string
    subtitles_str = ""
    keys = list(subtitle_confidence.keys())
    for i, subtitle in enumerate(keys):
        subtitles_str += f"{subtitle} -> {subtitle_confidence[subtitle]}"
        if i < len(keys) - 1:
            subtitles_str += ", "
    response = model.generate_content("I want you to create a study plan based on scientific methods like pomodoro and other proven tecniques that are " \
    f"efficient. Also, you need to consider that the exam is in {numDays} days from now, and depending on the urgency, review the most critical topic in the topic: {subtitles_str}.")
    return response
