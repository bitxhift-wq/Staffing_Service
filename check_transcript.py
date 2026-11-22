import json

with open(r'C:\Users\mukhe\.gemini\antigravity\brain\2ede3814-0ea9-4a37-a299-e3d4ddb64576\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        data = json.loads(line)
        if data.get('media'):
            print(f"Line {i}, Step {data.get('step_index')}: {data['media']}")
        if data.get('type') == 'USER_INPUT':
            print(f"User Input step {data.get('step_index')}: content length {len(data.get('content', ''))}, media: {data.get('media')}")
