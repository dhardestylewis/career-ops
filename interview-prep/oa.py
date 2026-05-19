import os
import sys
import json
import time
import random
import glob
import subprocess
import argparse
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent
PROGRESS_FILE = BASE_DIR / ".oa_progress.json"
ACTIVE_SESSION_FILE = BASE_DIR / ".active_session.json"
WORKSPACE_FILE = BASE_DIR / "workspace.py"
RUNNER_FILE = BASE_DIR / ".run.py"
MOCK_DIR = BASE_DIR / "mock-codesignal"
DEFAULT_RECOVERY = 12.0

BASE_WEIGHTS = {
    "in_memory_db": 35.0,
    "file_system": 35.0,
    "bank_account": 10.0,
    "inventory_cart": 5.0,
    "rate_limiter": 5.0,
    "message_queue": 5.0,
    "cloud_db": 2.0,
    "spreadsheet": 1.0,
    "text_editor": 1.0,
    "json_parser": 1.0
}

# --- SHARED UTILS ---

def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r') as f:
            data = json.load(f)
            for k, v in list(data.items()):
                if isinstance(v, (int, float)):
                    data[k] = {"last_seen": v, "recovery_hours": DEFAULT_RECOVERY, "level_reached": 0}
            return data
    return {}

def save_progress(progress):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def load_session():
    if not ACTIVE_SESSION_FILE.exists():
        print("❌ No active session found. Start one with: python oa.py start")
        sys.exit(1)
    with open(ACTIVE_SESSION_FILE, 'r') as f:
        return json.load(f)

def save_session(session):
    with open(ACTIVE_SESSION_FILE, 'w') as f:
        json.dump(session, f)

# --- START COMMAND LOGIC ---

def calculate_current_weights(progress, now):
    current_weights = {}
    for cat, base_wt in BASE_WEIGHTS.items():
        if cat in progress:
            data = progress[cat]
            elapsed_hours = (now - data["last_seen"]) / 3600.0
            recovery_hours = data.get("recovery_hours", DEFAULT_RECOVERY)
            recovery_ratio = min(1.0, elapsed_hours / recovery_hours)
            multiplier = 0.05 + (0.95 * recovery_ratio)
            current_weights[cat] = base_wt * multiplier
        else:
            current_weights[cat] = base_wt
    return current_weights

def extract_workspace_skeleton(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r'(.*?)(?=class Test)', content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return content

def run_timer(minutes=90):
    seconds = int(minutes * 60)
    print(f"\\n==============================================")
    print(f"⏳ PROCTOR TIMER STARTED ({minutes} MINUTES)")
    print(f"Press Ctrl+C at any time to finish early and grade.")
    print(f"==============================================\\n")
    try:
        while seconds > 0:
            mins, secs = divmod(seconds, 60)
            timer_str = f"Time Remaining: {mins:02d}:{secs:02d}"
            sys.stdout.write(f"\\r{timer_str}")
            sys.stdout.flush()
            time.sleep(1)
            seconds -= 1
        print("\\n\\n⏰ TIME IS UP!")
        print("\\a")
    except KeyboardInterrupt:
        print("\\n\\n⏹️  Timer stopped early by user.")

def run_simulation_start():
    print("==============================================")
    print("🤖 ANTHROPIC CODESIGNAL SIMULATOR")
    print("==============================================\\n")
    
    if ACTIVE_SESSION_FILE.exists():
        print("⚠️  You already have an active session!")
        print("Run 'python oa.py submit' to test your code, or 'python oa.py grade' to end it.")
        return
        
    progress = load_progress()
    now = time.time()
    
    current_weights = calculate_current_weights(progress, now)
    cats = list(current_weights.keys())
    wts = list(current_weights.values())
    
    selected = random.choices(cats, weights=wts, k=1)[0]
    total_wt = sum(wts)
    actual_pct = (current_weights[selected] / total_wt) * 100
    
    print(f"ALGORITHM SELECTED: {selected.upper()}")
    print(f"(Dynamic Probability: {actual_pct:.1f}% | Base: {BASE_WEIGHTS[selected]}%)\\n")
    
    if selected in progress and progress[selected].get("level_reached", 0) > 0:
        prev_level = progress[selected]["level_reached"]
        print(f"📊 HISTORY: You previously reached Level {prev_level} on this problem.\\n")
        
    level_1_files = glob.glob(str(MOCK_DIR / selected / "level_1_*.py"))
    if level_1_files:
        skeleton = extract_workspace_skeleton(level_1_files[0])
        with open(WORKSPACE_FILE, 'w', encoding='utf-8') as f:
            f.write(skeleton)
            
    with open(ACTIVE_SESSION_FILE, 'w') as f:
        json.dump({"topic": selected, "level": 1}, f)
        
    if selected not in progress:
        progress[selected] = {"last_seen": now, "recovery_hours": DEFAULT_RECOVERY, "level_reached": 0}
    else:
        progress[selected]["last_seen"] = now
    save_progress(progress)
    
    print("INSTRUCTIONS:")
    print("1. Open 'workspace.py' in your IDE.")
    print("2. Open a *second* terminal window.")
    print("3. Start coding! Run 'python oa.py submit' in the second terminal to test your code.")
    
    run_timer(minutes=90)
    run_grading()

# --- SUBMIT COMMAND LOGIC ---

def get_level_file(topic, level):
    topic_dir = MOCK_DIR / topic
    files = glob.glob(str(topic_dir / f"level_{level}_*.py"))
    if not files: return None
    return files[0]

def extract_tests(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r'(class Test.*)', content, re.DOTALL)
    if match: return match.group(1)
    return None

def extract_prompt(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    lines = content.split('\\n')
    prompt_lines = []
    for line in lines:
        if line.startswith('class '): break
        if line.startswith('#'): prompt_lines.append(line)
    return "\\n".join(prompt_lines)

def run_submission():
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
        
    with open(WORKSPACE_FILE, 'r', encoding='utf-8') as f:
        workspace_content = f.read()
        
    tests_content = extract_tests(level_file)
    if not tests_content:
        print("Error: Could not extract tests from mock file.")
        sys.exit(1)
        
    print(f"Running tests for {topic.upper()} - LEVEL {level}...")
    
    with open(RUNNER_FILE, 'w', encoding='utf-8') as f:
        f.write(workspace_content)
        f.write("\\n\\nimport unittest\\nimport os\\nfrom decimal import Decimal\\n\\n")
        f.write(tests_content)
        
    result = subprocess.run([sys.executable, str(RUNNER_FILE)], capture_output=True, text=True)
    if RUNNER_FILE.exists(): os.remove(RUNNER_FILE)
    
    if result.returncode != 0:
        print("\\nTESTS FAILED\\n")
        print("--- Output ---")
        print(result.stdout)
        print(result.stderr)
        print("--------------\\nFix your code in workspace.py and run 'python oa.py submit' again.")
        sys.exit(1)
        
    print("\\nALL TESTS PASSED!\\n")
    print(result.stderr)
    
    # Auto Checkpoint
    history_dir = BASE_DIR / "history"
    history_dir.mkdir(exist_ok=True)
    checkpoint_file = history_dir / f"level_{level}_passed.py"
    with open(checkpoint_file, 'w', encoding='utf-8') as f:
        f.write(workspace_content)
    print(f"💾 Checkpoint saved: If you mess up the next level, recover your code from history/level_{level}_passed.py\\n")
    
    next_level = level + 1
    next_level_file = get_level_file(topic, next_level)
    
    if not next_level_file:
        print("YOU PASSED LEVEL 5! CONGRATULATIONS!")
        print("Assessment Complete. Run 'python oa.py grade' to log your score.")
        os.remove(ACTIVE_SESSION_FILE)
        sys.exit(0)
        
    print(f"UNLOCKED LEVEL {next_level}\\n")
    prompt = extract_prompt(next_level_file)
    print("======================================================")
    print("NEW REQUIREMENTS:")
    print("======================================================")
    print(prompt)
    print("======================================================\\n")
    print("Implement these requirements in workspace.py and run 'python oa.py submit' when ready.")
    
    session["level"] = next_level
    save_session(session)

# --- GRADE COMMAND LOGIC ---

def run_grading():
    if not ACTIVE_SESSION_FILE.exists():
        print("No active session to grade.")
        return
        
    with open(ACTIVE_SESSION_FILE, 'r') as f:
        session = json.load(f)
        
    category = session["topic"]
    progress = load_progress()
    
    if category not in progress:
        progress[category] = {"last_seen": time.time(), "recovery_hours": DEFAULT_RECOVERY, "level_reached": session["level"]}
    
    data = progress[category]
    print("\\n==============================================")
    print(f"GRADING SESSION: {category.upper()}")
    print("==============================================\\n")
    
    level = input("What level did you successfully complete? (0-5): ")
    try: data["level_reached"] = int(level)
    except: pass
        
    print("\\nHow difficult was this session?")
    print("1: Easy   (I breezed through it. Don't show me this again for a while.)")
    print("2: Medium (Challenging, but I figured it out. Standard review.)")
    print("3: Hard   (I struggled or failed. I need to practice this again soon.)")
    
    diff = input("Selection (1/2/3): ")
    if diff == '1':
        data["recovery_hours"] = 48.0
        print("Got it. Pushing this to the back of the queue (48h recovery).")
    elif diff == '3':
        data["recovery_hours"] = 4.0
        print("Understood. Resurfacing this to the top of the queue (4h recovery).")
    else:
        data["recovery_hours"] = 12.0
        print("Logged. Standard review scheduled (12h recovery).")
        
    save_progress(progress)
    os.remove(ACTIVE_SESSION_FILE)
    print("\\n✅ Progress saved. Great work!")

def main():
    parser = argparse.ArgumentParser(description="CodeSignal OA Simulator CLI")
    subparsers = parser.add_subparsers(dest="command", required=True, help="Available commands")
    
    subparsers.add_parser("start", help="Start a new 90-minute assessment session")
    subparsers.add_parser("submit", help="Submit workspace.py and run against hidden tests")
    subparsers.add_parser("grade", help="End session early and grade difficulty")
    
    args = parser.parse_args()
    
    if args.command == "start":
        run_simulation_start()
    elif args.command == "submit":
        run_submission()
    elif args.command == "grade":
        run_grading()

if __name__ == "__main__":
    main()
