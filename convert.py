import json
import re

def parse_questions(txt_content):
    questions = []
    
    # 1. 预处理：清除页码和特定广告噪音
    # 清除 --- Page X ---
    txt_content = re.sub(r'--- Page \d+ ---', '', txt_content)
    # 清除那个淘宝/闲鱼的广告行 (匹配 "IT认证" 开头的整行)
    txt_content = re.sub(r'IT认证轻松过.*', '', txt_content)
    
    # 2. 使用正则表达式查找所有题目块
    # 逻辑：查找 "Topic X Question #Y" 及其位置
    header_pattern = re.compile(r'Topic (\d+) Question #(\d+)')
    matches = list(header_pattern.finditer(txt_content))
    
    for i in range(len(matches)):
        try:
            # 获取当前题目的 Header 信息
            current_match = matches[i]
            topic_num = int(current_match.group(1))
            question_num = int(current_match.group(2))
            
            # 获取内容范围：从当前 Header 结束，到下一个 Header 开始（或是文件末尾）
            start_pos = current_match.end()
            end_pos = matches[i+1].start() if i + 1 < len(matches) else len(txt_content)
            
            # 提取题目主体文本
            block = txt_content[start_pos:end_pos].strip()
            
            # --- 解析题目内部结构 ---
            
            # A. 分离 "Correct Answer" 及其之后的内容
            # 注意：你的样本里 Correct Answer 后面可能有多个空格
            split_match = re.search(r'Correct Answer:\s*(.*)', block, re.DOTALL)
            
            if not split_match:
                print(f"Skipping Topic {topic_num} Q#{question_num}: No Correct Answer found.")
                continue
                
            question_and_options = block[:split_match.start()].strip()
            answer_section_raw = split_match.group(1).strip()
            
            # 处理答案和解析
            answer_lines = answer_section_raw.split('\n')
            correct_answer = answer_lines[0].strip() # 获取 "B"
            
            # 解析部分：去掉第一行答案，剩下的作为解析，并移除 "Community vote" 之后的内容
            explanation = '\n'.join(answer_lines[1:]).strip()
            explanation = re.sub(r'Community vote distribution.*', '', explanation, flags=re.DOTALL).strip()
            
            # B. 分离题目文本和选项
            # 查找所有选项的位置 (A. B. C. D.)
            option_pattern = re.compile(r'^[A-Z]\.\s', re.MULTILINE)
            option_matches = list(option_pattern.finditer(question_and_options))
            
            options = []
            question_text = ""
            
            if option_matches:
                # 题目文本是第一个选项之前的所有内容
                question_text = question_and_options[:option_matches[0].start()].strip()
                
                # 循环提取每个选项
                for j in range(len(option_matches)):
                    opt_start = option_matches[j].start()
                    # 选项结束位置是下一个选项的开始，或者是文本末尾
                    opt_end = option_matches[j+1].start() if j + 1 < len(option_matches) else len(question_and_options)
                    
                    # 提取选项文本
                    opt_text = question_and_options[opt_start:opt_end].strip()
                    
                    # *** 关键修复：移除 "Most Voted" ***
                    opt_text = opt_text.replace(" Most Voted", "")
                    # 移除开头的 "A. " 等标记 (可选，看你喜好，这里保留标记更清晰，或者只移除标记)
                    # 这里我们保留 "A. " 这种前缀，但在前端判定时要注意
                    
                    options.append(opt_text)
            else:
                # 没有选项（可能是拖拽题或热点题），整个块都是题目
                question_text = question_and_options
            
            # 构建 JSON 对象
            questions.append({
                'id': i + 1,
                'topic': topic_num,
                'questionNumber': question_num,
                'type': 'multiple-choice' if options else 'unknown',
                'question': question_text,
                'options': options,
                'correctAnswer': correct_answer,
                'explanation': explanation
            })
            
        except Exception as e:
            print(f"Error parsing Topic {topic_num} Q#{question_num}: {e}")

    return questions

if __name__ == '__main__':
    input_filename = 'questions.txt'
    output_filename = 'questions.json'
    
    try:
        with open(input_filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"Reading {input_filename}...")
        parsed_data = parse_questions(content)
        
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(parsed_data, f, indent=4, ensure_ascii=False)
            
        print(f"Success! Converted {len(parsed_data)} questions to {output_filename}")
        
    except FileNotFoundError:
        print(f"Error: Could not find '{input_filename}'. Please make sure the file exists.")
    except Exception as e:
        print(f"An error occurred: {e}")