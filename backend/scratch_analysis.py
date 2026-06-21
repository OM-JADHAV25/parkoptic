import pandas as pd
import json
import numpy as np

df_clean = pd.read_parquet('data/processed/cleaned_violations.parquet')
df_temp = pd.read_parquet('data/processed/temporal_profiles.parquet')

print('--- Overall Hourly Distribution ---')
overall_hourly = df_clean['hour'].value_counts().sort_index()
print(overall_hourly.to_dict())

print('\n--- 08:00 vs 18:00 ---')
print(f'08:00 count: {overall_hourly.get(8, 0)}')
print(f'18:00 count: {overall_hourly.get(18, 0)}')

if overall_hourly.get(18, 0) > 0:
    diff = overall_hourly.get(8, 0) / overall_hourly.get(18, 0)
    print(f'08:00 is {diff:.2f}x of 18:00')

print('\n--- Temporal Profiles Sum to 1.0 Check ---')
sums = df_temp.groupby('h3_index')['temporal_weight'].sum()
print(f'Min sum: {sums.min():.4f}, Max sum: {sums.max():.4f}, Mean sum: {sums.mean():.4f}')

print('\n--- Representative Cells ---')
top_cells = df_temp.groupby('h3_index')['total_count'].max().sort_values(ascending=False).head(3).index.tolist()
for cell in top_cells:
    cell_data = df_temp[df_temp['h3_index'] == cell].sort_values('hour')
    peak_idx = cell_data['temporal_weight'].idxmax()
    peak = cell_data.loc[peak_idx]
    
    hour = int(peak['hour'])
    weight = float(peak['temporal_weight'])
    
    print(f'Cell {cell}: Peak at {hour:02d}:00 with weight {weight:.4f}')

print('\n--- Enforcement Bias Check ---')
print("Checking for sudden drops in counts:")
print("Are there periods of near-zero violations? (00:00 - 05:00)")
night_hours = [0, 1, 2, 3, 4, 5]
night_counts = {h: overall_hourly.get(h, 0) for h in night_hours}
print(night_counts)

print('\nDone.')
