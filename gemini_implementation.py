import google.generativeai as genai
from googleapiclient.discovery import build

# pre-processing 
api_key = "AIzaSyAwjQCVdaB_8BZleDTnBybvLeMnJUMJbIk"
current_cx = "a34d2089943bf47e1"
genai.configure(api_key)
model = genai.GenerativeModel("gemini-2.0-flash")

chat_history = []  # stores the chat history (session-based)

# returns response by taking 'subtitle' and generates a concise AI summary of that given 'subtitle'
def summarize_user_written(subtitle):
    response = model.generate_content("Can you generate a response to this that max 20 lines and is super understandable to college students? " \
    "Make sure that it is comprehensive yet super concise so that any student, regardless of their prior knowledge, will quickly understand " \
    "and be able also to learn the implication of this and its application: " + subtitle)
    return response

# returns response by taking 'topic' and 'question' and answers the question WITHIN that topic ~ also allows saves chat history for follow-ups
def topic_specific_question(topic, question):
    chat_history.append("Can you generate an answer to this question within 20 lines: " + question + " KNOWING that the topic is: " + topic)
    response = model.generate_content(chat_history)
    chat_history.append(response)
    return response

# returns a list of 4 image URL links that is taylored to the 'subtitle' and 'specific' inputs
def get_top_image_URL(subtitle, specific):
    # Combine the inputs to form the search query.
    query = f"{subtitle} {specific}"
    
    # Build the Custom Search service.
    service = build("customsearch", "v1", developerKey=api_key)
    
    # Execute the search request with searchType set to "image" and num set to 4.
    result = service.cse().list(
        q=query,
        cx=current_cx,
        searchType="image",
        num=4  # Retrieve the top 4 results.
    ).execute()
    
    # Extract the image URLs from the results.
    if 'items' in result:
        return [item['link'] for item in result['items']]
    else:
        return []

# returns response by taking 'subtitle' and 'phrase' to generate a concise AI definition summary of a specific phrase from AI summary
def summarize_AI_written(subtitle, phrase):
    response = model.generate_content("Can you generate a response to the following phrase that is max 3 sentences to define the following: " + phrase + ", WITHIN this topic: " + subtitle)
    return response
