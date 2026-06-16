Reading from: D:\parkoptic\backend\data\raw\violations.csv
Exists: True
==================================================
LOADING DATASET
==================================================

Shape:
(298450, 24)

Columns:
['id', 'latitude', 'longitude', 'location', 'vehicle_number', 'vehicle_type', 'description', 'violation_type', 'offence_code', 'created_datetime', 'closed_datetime', 'modified_datetime', 'device_id', 'created_by_id', 'center_code', 'police_station', 'data_sent_to_scita', 'junction_name', 'action_taken_timestamp', 'data_sent_to_scita_timestamp', 'updated_vehicle_number', 'updated_vehicle_type', 'validation_status', 'validation_timestamp']

Info:
<class 'pandas.DataFrame'>
RangeIndex: 298450 entries, 0 to 298449
Data columns (total 24 columns):
 #   Column                        Non-Null Count   Dtype  
---  ------                        --------------   -----  
 0   id                            298450 non-null  str    
 1   latitude                      298450 non-null  float64
 2   longitude                     298450 non-null  float64
 3   location                      295409 non-null  str    
 4   vehicle_number                298450 non-null  str    
 5   vehicle_type                  298450 non-null  str    
 6   description                   0 non-null       float64
 7   violation_type                298450 non-null  str    
 8   offence_code                  298450 non-null  str    
 9   created_datetime              298450 non-null  str    
 10  closed_datetime               0 non-null       float64
 11  modified_datetime             298450 non-null  str    
 12  device_id                     298450 non-null  str    
 13  created_by_id                 298445 non-null  str    
 14  center_code                   287190 non-null  float64
 15  police_station                298445 non-null  str    
 16  data_sent_to_scita            298450 non-null  bool   
 17  junction_name                 298445 non-null  str    
 18  action_taken_timestamp        0 non-null       float64
 19  data_sent_to_scita_timestamp  42161 non-null   str    
 20  updated_vehicle_number        173196 non-null  str    
 21  updated_vehicle_type          173196 non-null  str    
 22  validation_status             173196 non-null  str    
 23  validation_timestamp          173196 non-null  str    
dtypes: bool(1), float64(6), str(17)
memory usage: 52.7 MB
None

First 5 Rows:
           id   latitude  longitude  ... updated_vehicle_type validation_status        validation_timestamp
0  FKID000000  12.925557  77.618665  ...             MAXI-CAB          approved  2023-11-30 03:08:24.818+00
1  FKID000001  12.905463  77.700778  ...                  NaN               NaN                         NaN
2  FKID000002  12.925449  77.618504  ...             MAXI-CAB          approved  2023-11-30 03:08:56.998+00
3  FKID000003  12.956521  77.518618  ...              SCOOTER          approved  2023-11-18 23:35:12.428+00
4  FKID000004  12.977767  77.580545  ...               TANKER          approved  2023-11-30 03:11:32.796+00

[5 rows x 24 columns]

Missing Values:
id                                   0
latitude                             0
longitude                            0
location                          3041
vehicle_number                       0
vehicle_type                         0
description                     298450
violation_type                       0
offence_code                         0
created_datetime                     0
closed_datetime                 298450
modified_datetime                    0
device_id                            0
created_by_id                        5
center_code                      11260
police_station                       5
data_sent_to_scita                   0
junction_name                        5
action_taken_timestamp          298450
data_sent_to_scita_timestamp    256289
updated_vehicle_number          125254
updated_vehicle_type            125254
validation_status               125254
validation_timestamp            125254
dtype: int64