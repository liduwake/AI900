import json
import re

def parse_questions(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    questions = []
    current_question = None
    question_text_lines = []
    options = {}

    for line in lines:
        line = line.strip()

        # Skip empty lines and headers
        if not line or "IT认证轻松过" in line or "Page" in line or "Community vote distribution" in line:
            continue

        # Start of a new question
        if re.match(r"Topic \d+ Question #\d+", line):
            if current_question:
                # Finalize the previous question before starting a new one
                current_question['question'] = ' '.join(question_text_lines).strip()
                
                # Process options and answer
                answer_keys = list(current_question.get('answer', ''))
                if len(answer_keys) > 1:
                    current_question['type'] = 'multiple-choice'
                    current_question['answer'] = [options.get(key, '').strip() for key in answer_keys]
                else:
                    current_question['type'] = 'single-choice'
                    current_question['answer'] = options.get(current_question.get('answer', ''), '').strip()
                
                current_question['options'] = [v.strip() for v in options.values()]

                # Add valid questions only
                if current_question['options'] and current_question['answer']:
                   questions.append(current_question)

            # Reset for the new question
            current_question = {'id': len(questions) + 4} # Start id from 4
            question_text_lines = []
            options = {}
            continue

        if not current_question:
            continue

        # Extract options
        option_match = re.match(r"([A-Z])\. (.*)", line)
        if option_match:
            key, value = option_match.groups()
            # Clean "Most Voted" text
            value = value.replace("Most Voted", "").strip()
            options[key] = value
            continue
            
        # Extract answer
        if line.startswith("Correct Answer:"):
            answer = line.replace("Correct Answer:", "").strip()
            # Skip complex answers
            if len(answer) > 5: # Skip answers like "BC (100%)"
                 current_question = None # Discard this question
                 continue
            current_question['answer'] = answer
            continue

        # Extract question text, but avoid adding certain keywords
        if "HOTSPOT" not in line and "DRAG DROP" not in line and "Select and Place" not in line:
            if current_question:
                # avoid adding junk lines to question text
                if not line.startswith("Correct Answer:") and not re.match(r"^[A-Z]\.", line) and "http" not in line:
                    question_text_lines.append(line)


    # Add the last processed question
    if current_question:
        current_question['question'] = ' '.join(question_text_lines).strip()
        answer_keys = list(current_question.get('answer', ''))
        
        # Determine question type and format answer
        if len(answer_keys) > 1:
            current_question['type'] = 'multiple-choice'
            # Convert letter answers to full text
            full_answers = [options.get(key.strip(), '').strip() for key in answer_keys]
            current_question['answer'] = [ans for ans in full_answers if ans] # Filter out empty answers
        else:
            current_question['type'] = 'single-choice'
            current_question['answer'] = options.get(current_question.get('answer', '').strip(), '').strip()

        current_question['options'] = [v.strip() for v in options.values()]
        
        # Add explanation placeholder
        current_question['explanation'] = "Explanation will be added later."

        # Only add if it's a valid, parsed question
        if current_question.get('options') and current_question.get('answer'):
            questions.append(current_question)

    return questions

if __name__ == "__main__":
    parsed_questions = parse_questions('questions.txt')
    with open('questions_new.json', 'w', encoding='utf-8') as f:
        json.dump(parsed_questions, f, ensure_ascii=False, indent=2)

    print(f"Successfully parsed {len(parsed_questions)} questions and saved to questions_new.json")