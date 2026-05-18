import os
import sys
import json
import glob
import subprocess
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent
ACTIVE_SESSION_FILE = BASE_DIR / ".active_session.json"
WORKSPACE_FILE = BASE_DIR / "workspace.py"
RUNNER_FILE = BASE_DIR / ".run.py"
MOCK_DIR = BASE_DIR / "mock-codesignal"

def load_session():
    if not ACTIVE_SESSION_FILE.exists():
        print("❌ No active session found. Start a session with: python simulate_oa.py")
        sys.exit(1)
    with open(ACTIVE_SESSION_FILE, 'r') as f:
        return json.load(f)

def save_session(session):
    with open(ACTIVE_SESSION_FILE, 'w') as f:
        json.dump(session, f)

def get_level_file(topic, level):
    topic_dir = MOCK_DIR / topic
    files = glob.glob(str(topic_dir / f"level_{level}_*.py"))
    if not files:
        return None
    return files[0]

def extract_tests(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
        
    # The tests start where we see "class Test"
    match = re.search(r'(class Test.*)', content, re.DOTALL)
    if match:
        return match.group(1)
    return None

def extract_prompt(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
        
    lines = content.split('\\n')
    prompt_lines = []
    for line in lines:
        if line.startswith('class '):
            break
        if line.startswith('#'):
            prompt_lines.append(line)
            
    return "\\n".join(prompt_lines)

def run_tests(workspace_content, tests_content):
    with open(RUNNER_FILE, 'w') as f:
        f.write(workspace_content)
        f.write("\n\nimport unittest\nimport os\nfrom decimal import Decimal\n\n")
        f.write(tests_content)
        
    # Run the tests
    result = subprocess.run([sys.executable, str(RUNNER_FILE)], capture_output=True, text=True)
    
    if RUNNER_FILE.exists():
        os.remove(RUNNER_FILE)
        
    return result

def main():
    session = load_session()
    topic = session["topic"]
    level = session["level"]
    
    level_file = get_level_file(topic, level)
    if not level_file:
        print(f"Error: Could not find tests for {topic} Level {level}")
        sys.exit(1)
        
    if not WORKSPACE_FILE.exists():
        print("Error: workspace.py not found.")
        sys.exit(1)
        
    with open(WORKSPACE_FILE, 'r') as f:
        workspace_content = f.read()
        
    tests_content = extract_tests(level_file)
    if not tests_content:
        print("Error: Could not extract tests from mock file.")
        sys.exit(1)
        
    print(f"Running tests for {topic.upper()} - LEVEL {level}...")
    
    result = run_tests(workspace_content, tests_content)
    
    if result.returncode != 0:
        print("\\nTESTS FAILED\\n")
        print("--- Output ---")
        print(result.stdout)
        print(result.stderr)
        print("--------------\\nFix your code in workspace.py and run 'python submit.py' again.")
        sys.exit(1)
        
    print("\\nALL TESTS PASSED!\\n")
    print(result.stderr) # unittest prints success to stderr usually
    
    # --- AUTO SAVE-STATE ---
    history_dir = BASE_DIR / "history"
    history_dir.mkdir(exist_ok=True)
    checkpoint_file = history_dir / f"level_{level}_passed.py"
    with open(checkpoint_file, 'w') as f:
        f.write(workspace_content)
    print(f"💾 Checkpoint saved: If you mess up the next level, recover your code from history/level_{level}_passed.py\\n")
    # -----------------------
    
    # Advance to next level
    next_level = level + 1
    next_level_file = get_level_file(topic, next_level)
    
    if not next_level_file:
        print("YOU PASSED LEVEL 5! CONGRATULATIONS!")
        print("Assessment Complete. Run 'python simulate_oa.py --grade' to log your score.")
        os.remove(ACTIVE_SESSION_FILE)
        sys.exit(0)
        
    print(f"UNLOCKED LEVEL {next_level}\\n")
    
    prompt = extract_prompt(next_level_file)
    print("======================================================")
    print("NEW REQUIREMENTS:")
    print("======================================================")
    print(prompt)
    print("======================================================\\n")
    print(f"Implement these requirements in workspace.py and run 'python submit.py' when ready.")
    
    session["level"] = next_level
    save_session(session)

if __name__ == "__main__":
    main()
