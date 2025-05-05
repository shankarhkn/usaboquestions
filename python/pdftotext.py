from pypdf import PdfReader
import re
import json

reader = PdfReader('python/2018open.pdf')

lines = []
for page in reader.pages:
    text = page.extract_text()
    if text:
        for line in text.splitlines():
            # Skip lines like "2018 USABO Exam Page X of Y"
            if re.search(r'USABO.*Page\s+\d+\s+of\s+\d+', line):
                continue
            lines.append(line)

# Regex to detect questions and answer choices
question_re = re.compile(r"^(\d+)\.\s+(.*)")
choice_re = re.compile(r"^\(?([A-E])\)?[.)]?\s+(.*)")

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
            # Convert choices dict to list
            current_question["choices"] = list(current_question["choices"].values())
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
        if not current_question["choices"]:
            current_question["question"] += " " + line
        else:
            last_letter = sorted(current_question["choices"].keys())[-1]
            current_question["choices"][last_letter] += " " + line

# Save last question
if current_question:
    current_question["choices"] = list(current_question["choices"].values())
    questions.append(current_question)

# Write to JSON
with open("usabo-api/questions.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)
