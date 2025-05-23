import fitz  # PyMuPDF
import re
import json
import difflib
import csv

# Normalize text for comparison
def normalize(text):
    return re.sub(r'[^a-z0-9]+', '', text.lower())

# Load PDF
doc = fitz.open("python/2018open.pdf")

highlighted_texts = set()

# Step 1: Extract all highlighted words
for page in doc:
    words = page.get_text("words")
    if not page.annots():
        continue
    for annot in page.annots():
        if annot.type[0] == 8:  # Highlight
            quads = annot.vertices
            rects = [fitz.Quad(quad).rect for quad in zip(quads[::4], quads[1::4], quads[2::4], quads[3::4])]
            for rect in rects:
                enlarged_rect = rect + (-2, -2, 2, 2)
                hits = [w for w in words if fitz.Rect(w[:4]).intersects(enlarged_rect)]
                text = " ".join(w[4] for w in hits).strip()
                if text:
                    highlighted_texts.add(text)

print("🔍 Extracted highlights:")
for h in highlighted_texts:
    print(f" - {h}")

normalized_highlights = [normalize(h) for h in highlighted_texts]

# Step 2: Extract text lines from all pages
lines = []
for page in doc:
    text = page.get_text("text")
    for line in text.splitlines():
        if not re.search(r'USABO.*Page\s+\d+', line):
            lines.append(line.strip())

# Step 3: Parse questions
question_re = re.compile(r"^(\d+)\.\s+(.*)")
choice_re = re.compile(r"^\(?([A-E])\)?[.)]?\s+(.*)")

questions = []
current_question = None

for line in lines:
    if not line:
        continue

    q_match = question_re.match(line)
    c_match = choice_re.match(line)

    if q_match:
        if current_question:
            current_question["choices"] = list(current_question["choices"].values())
            questions.append(current_question)
        current_question = {
            "question_number": q_match.group(1),
            "question": q_match.group(2).strip(),
            "choices": {},
            "answer": None,
            "answer_text": None,
            "matched_highlight": None
        }

    elif c_match and current_question:
        letter = c_match.group(1)
        text = c_match.group(2).strip()
        current_question["choices"][letter] = text

        norm_text = normalize(text)
        matched = False

        for hl, norm_hl in zip(highlighted_texts, normalized_highlights):
            if norm_hl == norm_text or norm_hl in norm_text or norm_text in norm_hl or \
               difflib.SequenceMatcher(None, norm_hl, norm_text).ratio() > 0.85:
                current_question["answer"] = letter
                current_question["answer_text"] = text
                current_question["matched_highlight"] = hl
                matched = True
                break

        if matched:
            print(f"✅ Match: ({letter}) {text} ← Highlighted as: {hl}")

    elif current_question:
        if not current_question["choices"]:
            current_question["question"] += " " + line
        else:
            last = sorted(current_question["choices"].keys())[-1]
            current_question["choices"][last] += " " + line

# Add last question
if current_question:
    current_question["choices"] = list(current_question["choices"].values())
    questions.append(current_question)

# Step 4: Save JSON
json_path = "usabo-api/questions.json"
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

# Step 5: Save Debug CSV
csv_path = "usabo-api/debug.csv"
with open(csv_path, "w", newline='', encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["Question #", "Question", "Matched Answer", "Answer Text", "Matched Highlight"])
    for q in questions:
        writer.writerow([
            q["question_number"],
            q["question"],
            q["answer"] or "",
            q["answer_text"] or "",
            q["matched_highlight"] or ""
        ])

# Step 6: Report
total = len(questions)
with_answers = sum(1 for q in questions if q["answer"])
print(f"✅ Saved {total} questions to {json_path}")
print(f"✅ Also wrote debug info to {csv_path}")
print(f"✅ {with_answers} questions have answers ({(with_answers / total) * 100:.1f}% success)")
