from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import random
import os
import sqlite3

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///typing_scores.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_name = db.Column(db.String(50), nullable=False)
    wpm = db.Column(db.Integer, nullable=False)
    accuracy = db.Column(db.Float, nullable=False)
    difficulty = db.Column(db.String(20), nullable=False, default='medium')
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'player_name': self.player_name,
            'wpm': self.wpm,
            'accuracy': self.accuracy,
            'difficulty': self.difficulty,
            'date': self.date.strftime('%Y-%m-%d %H:%M')
        }

# Create the instance directory if it doesn't exist
if not os.path.exists('instance'):
    os.makedirs('instance')

# Close any existing connections
db_path = 'instance/typing_scores.db'
try:
    if os.path.exists(db_path):
        # Close all connections
        temp_conn = sqlite3.connect(db_path)
        temp_conn.close()
        # Remove the file
        os.remove(db_path)
except Exception as e:
    print(f"Warning: Could not remove existing database: {e}")

# Create tables
with app.app_context():
    db.create_all()

# Sample text for typing test
sample_texts = [
    "The quick brown fox jumps over the lazy dog.",
    "To be or not to be, that is the question.",
    "All that glitters is not gold.",
    "Practice makes perfect.",
    "A journey of a thousand miles begins with a single step."
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_text')
def get_text():
    return jsonify({'text': random.choice(sample_texts)})

@app.route('/submit_score', methods=['POST'])
def submit_score():
    try:
        data = request.json
        new_score = Score(
            player_name=data['player_name'],
            wpm=data['wpm'],
            accuracy=data['accuracy'],
            difficulty=data.get('difficulty', 'medium')  # Default to medium if not specified
        )
        db.session.add(new_score)
        db.session.commit()
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"Error submitting score: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/get_rankings')
def get_rankings():
    try:
        # Get all scores
        scores = Score.query.all()
        
        # Convert scores to dictionaries and apply difficulty multipliers
        rankings = []
        for score in scores:
            score_dict = score.to_dict()
            # Apply difficulty multiplier to WPM
            multiplier = {
                'easy': 1.0,
                'medium': 1.2,
                'hard': 1.5
            }.get(score.difficulty, 1.0)
            
            score_dict['adjusted_wpm'] = score.wpm * multiplier
            rankings.append(score_dict)
        
        # Sort by adjusted WPM
        rankings.sort(key=lambda x: x['adjusted_wpm'], reverse=True)
        
        # Take top 10
        top_rankings = rankings[:10]
        
        # Add rank numbers
        for i, rank in enumerate(top_rankings):
            rank['rank'] = i + 1
        
        return jsonify(top_rankings)
    except Exception as e:
        print(f"Error getting rankings: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
