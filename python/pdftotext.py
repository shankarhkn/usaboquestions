from pypdf import PdfReader
import re
import json

reader = PdfReader('python/2018open.pdf')

lines = []
for page in reader.pages:
    text = page.extract_text()
    if text:
        lines.extend(text.splitlines())

# Regex to detect the start of a question and answer choices
question_re = re.compile(r"^(\d+)\.\s+(.*)")          # e.g., "12. What is..."
choice_re = re.compile(r"^\(?([A-E])\)?[.)]?\s+(.*)") # accepts "(A)", "A.", "A) Text"

questions = []
current_question = None

for line in lines:
    line = line.strip()
    if not line:
        continue

    q_match = question_re.match(line)
    c_match = choice_re.match(line)

    if q_match:
        if current_question:
            questions.append(current_question)
        current_question = {
            "question": q_match.group(2).strip(),
            "choices": {}
        }
    elif c_match and current_question:
        letter = c_match.group(1).strip()
        text = c_match.group(2).strip()
        current_question["choices"][letter] = text
    elif current_question:
        # Append to question or last choice depending on context
        if not current_question["choices"]:
            current_question["question"] += " " + line
        else:
            last_letter = sorted(current_question["choices"].keys())[-1]
            current_question["choices"][last_letter] += " " + line

# Save final question
if current_question:
    questions.append(current_question)

# Export to JSON
with open("usabo-api/questions.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)
