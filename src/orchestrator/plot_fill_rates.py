import pandas as pd
import matplotlib.pyplot as plt
import os
from datetime import datetime

tracker_file = 'logs/fill_rate_tracker.tsv'

if not os.path.exists(tracker_file):
    print("No tracking data found yet. Run the batch-evaluator to collect data.")
    exit(1)

df = pd.read_csv(tracker_file, sep='\t')
df['Timestamp'] = pd.to_datetime(df['Timestamp'])

# Extract company from URL to group by company
def get_company(url):
    if 'withwaymo' in url: return 'Waymo'
    if 'roblox' in url: return 'Roblox'
    if 'databricks' in url: return 'Databricks'
    if 'scaleai' in url: return 'ScaleAI'
    if 'coreweave' in url: return 'CoreWeave'
    return 'Other'

df['Company'] = df['URL'].apply(get_company)

# Average fill percentage per company per timestamp
# We will use the GitHash as an "iteration" proxy
summary = df.groupby(['GitHash', 'Timestamp', 'Company'])['FillPercentage'].mean().reset_index()
# Sort by timestamp to ensure chronological order of GitHashes
summary = summary.sort_values('Timestamp')

plt.figure(figsize=(12, 6))

for company in summary['Company'].unique():
    company_data = summary[summary['Company'] == company]
    # We plot the progression over time using GitHash
    plt.plot(company_data['GitHash'].astype(str), company_data['FillPercentage'], marker='o', label=company)

plt.title('Average Fill Rate Progression by Git Commit')
plt.xlabel('Git Hash (Chronological)')
plt.ylabel('Average Fill Rate (%)')
plt.ylim(0, 100)
plt.legend()
plt.grid(True, linestyle='--', alpha=0.7)

output_path = 'logs/fill_rate_progression.png'
plt.savefig(output_path, dpi=300, bbox_inches='tight')
print(f"Plot saved to {output_path}")
