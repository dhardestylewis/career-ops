import os
import random
import json
import time
import sys
from pathlib import Path

# Base probabilities (Anthropic OA leak frequencies)
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

PROGRESS_FILE = Path(__file__).parent / ".oa_progress.json"
DEFAULT_RECOVERY = 12.0

def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r') as f:
            data = json.load(f)
            # Migrate old schema if needed
            for k, v in list(data.items()):
                if isinstance(v, (int, float)):
                    data[k] = {"last_seen": v, "recovery_hours": DEFAULT_RECOVERY, "level_reached": 0}
            return data
    return {}

def save_progress(progress):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def calculate_current_weights(progress, now):
    current_weights = {}
    for cat, base_wt in BASE_WEIGHTS.items():
        if cat in progress:
            data = progress[cat]
            elapsed_hours = (now - data["last_seen"]) / 3600.0
            recovery_hours = data.get("recovery_hours", DEFAULT_RECOVERY)
            
            # Decay multiplier: Drops to 5% immediately, recovers over dynamic recovery_hours
            recovery_ratio = min(1.0, elapsed_hours / recovery_hours)
            multiplier = 0.05 + (0.95 * recovery_ratio)
            current_weights[cat] = base_wt * multiplier
        else:
            current_weights[cat] = base_wt
    return current_weights

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
            # Use carriage return to overwrite the same line
            sys.stdout.write(f"\\r{timer_str}")
            sys.stdout.flush()
            time.sleep(1)
            seconds -= 1
        print("\\n\\n⏰ TIME IS UP!")
        print("\\a") # Terminal bell sound
    except KeyboardInterrupt:
        print("\\n\\n⏹️  Timer stopped early by user.")

def grade_session(progress, category):
    data = progress[category]
    print("\\n==============================================")
    print(f"GRADING SESSION: {category.upper()}")
    print("==============================================\\n")
    
    level = input("What level did you successfully complete? (0-5): ")
    try:
        data["level_reached"] = int(level)
    except:
        pass
        
    print("\\nHow difficult was this session?")
    print("1: Easy   (I breezed through it. Don't show me this again for a while.)")
    print("2: Medium (Challenging, but I figured it out. Standard review.)")
    print("3: Hard   (I struggled or failed. I need to practice this again soon.)")
    
    diff = input("Selection (1/2/3): ")
    if diff == '1':
        data["recovery_hours"] = 48.0 # Wait 2 days to fully recover probability
        print("Got it. Pushing this to the back of the queue (48h recovery).")
    elif diff == '3':
        data["recovery_hours"] = 4.0  # Recovers fast, will likely appear tonight
        print("Understood. Resurfacing this to the top of the queue (4h recovery).")
    else:
        data["recovery_hours"] = 12.0
        print("Logged. Standard review scheduled (12h recovery).")
        
    save_progress(progress)
    print("\\n✅ Progress saved. Great work!")

def main():
    print("==============================================")
    print("ANTHROPIC CODESIGNAL SIMULATOR")
    print("==============================================\\n")
    
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
    
    print("INSTRUCTIONS:")
    print(f"1. Open the file: mock-codesignal/{selected}/level_1*.py")
    print("2. Open a *second* terminal window to run your tests.")
    print("3. Start coding! Evolve your class sequentially up to Level 5.")
    
    # Initialize state before timing
    if selected not in progress:
        progress[selected] = {"last_seen": now, "recovery_hours": DEFAULT_RECOVERY, "level_reached": 0}
    else:
        progress[selected]["last_seen"] = now
    save_progress(progress)
    
    # Start the integrated proctor flow
    run_timer(minutes=90)
    grade_session(progress, selected)

if __name__ == "__main__":
    main()
