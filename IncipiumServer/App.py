import os
from flask import Flask, request, jsonify
from vosk import Model, KaldiRecognizer
import wave
import json
from pydub import AudioSegment
import io

from textblob import TextBlob

app = Flask(__name__)

# Load Vosk Model (path should be where your vosk-model is)
MODEL_PATH = "vosk-model-en-us-0.22"
if not os.path.exists(MODEL_PATH):
    raise ValueError(f"Model not found at {MODEL_PATH}")
model = Model(MODEL_PATH)

# Function to transcribe audio using Vosk
def transcribe_audio(audio_bytes):
    # Open the audio bytes as a wave file
    wf = wave.open(io.BytesIO(audio_bytes), "rb")
    
    # Check if the audio format is mono PCM
    if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() not in [8000, 16000, 32000]:
        raise ValueError("Audio file must be WAV format mono PCM.")
    
    rec = KaldiRecognizer(model, wf.getframerate())
    
    transcription = ""
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            result = rec.Result()
            transcription += json.loads(result)["text"] + " "
    
    result = rec.FinalResult()
    transcription += json.loads(result)["text"]
    
    return transcription.strip()


def convert_audio_to_wav(audio_bytes):
    try:
        # Load the audio file from the provided bytes
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
        
        # Convert to mono and set the frame rate and sample width
        audio = audio.set_channels(1)           # Convert to mono
        audio = audio.set_sample_width(2)        # Set sample width to 16-bit (2 bytes)
        audio = audio.set_frame_rate(16000)      # Set frame rate to 16000 Hz
        
        # Export as WAV format to a byte stream
        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        wav_buffer.seek(0)  # Move the buffer pointer to the beginning
        
        # Check the properties of the converted audio
        wav_audio = AudioSegment.from_file(wav_buffer, format="wav")
        print(f"Converted Audio - Channels: {wav_audio.channels}, Sample Width: {wav_audio.sample_width}, Frame Rate: {wav_audio.frame_rate}")
        
        return wav_buffer
    except Exception as e:
        print(f"Error converting audio to WAV: {e}")
        raise


# Route to handle audio transcription
@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    filename = file.filename
    
    # Read the file content
    audio_bytes = file.read()

    # Convert audio to WAV format if necessary
    if filename.endswith(('.mp3', '.m4a', '.ogg')):
        print('Converting file:', filename)
        wav_buffer = convert_audio_to_wav(audio_bytes)
        audio_bytes = wav_buffer.getvalue()  # Get the WAV bytes
    elif not filename.endswith('.wav'):
        return jsonify({"error": "Unsupported file format"}), 400

    try:
        transcription = transcribe_audio(audio_bytes)
    except Exception as e:
        print(f"Transcription error: {e}")
        return jsonify({"error": str(e)}), 500

    return jsonify({"transcription": transcription})


def determine_emotion(polarity, subjectivity):
    if subjectivity > 0.5:
        if polarity < -0.7:
            return 'Fear'
        elif polarity < -0.5:
            return 'Sadness'
        elif polarity < 0:
            return 'Anxiety'
        elif polarity < 0.3:
            return 'Confusion'
        elif polarity < 0.7:
            return 'Excitement'
        else:
            return 'Happy'
    return 'Neutral'

# Sentiment analysis route using TextBlob for more detailed sentiment extraction
@app.route('/analyze-sentiment-blob', methods=['POST'])
def analyze_sentiment_blob():
    data = request.get_json()  # Get the JSON data sent in the request
    text_transcription = data.get('textTranscription', '')  # Extract transcription

    # Perform sentiment analysis
    blob = TextBlob(text_transcription) 

    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    emotion = determine_emotion(polarity, subjectivity)

    return jsonify({
        'polarity': polarity,
        'subjectivity': subjectivity,
        'emotion': emotion,
        'sentiment_type': 'Positive' if polarity > 0 else 'Negative' if polarity < 0 else 'Neutral'
    })

# Home route
@app.route('/')
def home():
    return 'Welcome to the Audio Transcription API!'

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=8080)