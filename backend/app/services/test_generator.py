from typing import Dict, Any
from app.services.gemini_service import GeminiService
from app.models.test_session import Level, Phase


class TestGeneratorService:
    """Service for generating IELTS test content using Gemini"""

    def __init__(self):
        self.gemini = GeminiService()

        self.level_to_band = {
            Level.BEGINNER: "3.0-4.0",
            Level.ELEMENTARY: "4.0-4.5",
            Level.INTERMEDIATE: "5.0-5.5",
            Level.UPPER_INTERMEDIATE: "6.0-6.5",
            Level.ADVANCED: "7.0-8.0",
        }

    def generate_listening_speaking(self, level: Level) -> Dict[str, Any]:
        """Generate Listening & Speaking test content (30 minutes)"""
        band = self.level_to_band.get(level, "5.0-5.5")

        system_instruction = """You are an expert IELTS examiner. Generate test content in JSON format only."""

        prompt = f"""
Generate an IELTS Listening & Speaking test for {level.value} level (IELTS {band}) in JSON format.

### CONTENT REQUIREMENTS:
1. LISTENING (20 mins, 4 sections, 5 questions/section):
   - Sec 1: Daily conversation (Multiple choice/Fill-blank).
   - Sec 2: Social monologue (Multiple choice/Matching).
   - Sec 3: Academic conversation (Multiple choice/Short answer).
   - Sec 4: Academic lecture (Fill-blank/Matching).
   - MANDATORY: Each section must include a realistic 'audio_transcript' (250-300 words) containing all answers.
   - CRITICAL: Each question must be UNIQUE and DIFFERENT. Do NOT repeat similar questions or test the same information point.
   - Each question should test different aspects: main ideas, specific details, numbers, names, locations, dates, reasons, etc.
   - IMPORTANT: For matching questions, provide 'options' array with choices like ["A. Option 1", "B. Option 2", "C. Option 3"].

2. SPEAKING (10 mins):
   - Part 1: 3-4 Intro questions (hometown, study/work, etc.).
   - Part 2: 1 Cue card (topic + bullet points).
   - Part 3: 3-4 Analytical questions related to Part 2.

### OUTPUT JSON STRUCTURE:
{{
  "listening": {{
    "sections": [
      {{
        "id": 1,
        "title": "string",
        "instructions": "string",
        "audio_transcript": "Full natural dialogue...",
        "questions": [
          {{
            "id": 1,
            "type": "multiple_choice | fill_blank | matching | short_answer",
            "question": "string",
            "options": ["A", "B", "C"], // Required for MC and matching types
            "correct_answer": "string"
          }}
        ]
      }}
    ]
  }},
  "speaking": {{
    "part1": [{{ "id": 1, "question": "string" }}],
    "part2": {{ "topic": "string", "task_card": "string" }},
    "part3": [{{ "id": 1, "question": "string" }}]
  }}
}}
"""

        return self.gemini.generate_json(prompt, system_instruction)

    def generate_reading_writing(self, level: Level) -> Dict[str, Any]:
        """Generate Reading & Writing test content (30 minutes)"""
        band = self.level_to_band.get(level, "5.0-5.5")

        system_instruction = """You are an expert IELTS examiner. Generate test content in JSON format only."""

        prompt = f"""
Generate an IELTS Reading & Writing test for {level.value} level (IELTS {band}) in JSON format.

### CONTENT REQUIREMENTS:
1. READING (15 mins, 2 passages, 5 questions/passage):
   - Pass 1: Data/chart-based article (300-400 words). Questions: Multiple choice, True/False/Not Given.
   - Pass 2: Social topic article (300-400 words). Questions: Multiple choice, Matching Headings.
   - CRITICAL: Each question must be UNIQUE and DIFFERENT. Do NOT repeat similar questions or test the same information point.
   - Each question should test different aspects: main ideas, specific details, inferences, vocabulary, author's opinion, comparisons, etc.
   - Ensure questions cover different parts of the passage, not the same paragraph or sentence.
   - For True/False/Not Given: test different statements, not variations of the same fact.
   - IMPORTANT: For matching_headings questions:
     * If matching multiple paragraphs (e.g., "Match headings with paragraphs A-E"), provide:
       - "items": ["A", "B", "C", "D", "E"] (list of paragraphs/items to match)
       - "options": ["i. Heading 1", "ii. Heading 2", ...] (list of headings to choose from)
     * If single matching, provide "options" array with headings like ["i. Introduction", "ii. Main findings", "iii. Conclusion"].

2. WRITING (15 mins):
   - Task 1 (50-80 words): Describe a chart. MANDATORY: 
     * Provide 'chart_data' as JSON object with structure:
       {{"type": "bar|line|pie", "title": "Chart Title", "labels": ["Label1", "Label2"], "data": [10, 20, 30], "xAxis": "X Label", "yAxis": "Y Label"}}
     * Also provide 'chart_description' as text fallback with all raw data (type, title, labels, specific numbers, and key trends).
   - Task 2 (100-120 words): Social essay topic.

### OUTPUT JSON STRUCTURE:
{{
  "reading": {{
    "passages": [
      {{
        "id": 1,
        "title": "string",
        "content": "string",
        "questions": [
          {{
            "id": 1,
            "type": "multiple_choice | tf_ng | matching_headings",
            "question": "string",
            "options": ["i. Option 1", "ii. Option 2", "iii. Option 3"], // Required for MC and matching_headings types
            "items": ["A", "B", "C"], // Optional: for matching_headings with multiple items (paragraphs)
            "correct_answer": "string" // For matching_headings with items, use format: "A:i, B:ii, C:iii"
          }}
        ]
      }}
    ]
  }},
  "writing": {{
    "task1": {{
      "instructions": "Summarise the main features...",
      "chart_data": {{"type": "bar", "title": "Chart Title", "labels": ["A", "B", "C"], "data": [10, 20, 30], "xAxis": "Category", "yAxis": "Value"}},
      "chart_description": "Detailed text data: [Type], [Title], [Data Points], [Trends]...",
      "word_limit": 50
    }},
    "task2": {{
      "question": "string",
      "word_limit": 100
    }}
  }}
}}
"""

        return self.gemini.generate_json(prompt, system_instruction)
