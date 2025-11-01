import pandas as pd
import mysql.connector
from shapely import wkt

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'NewPassword123!',
    'database': 'findmypark_nyc'
}

DATA_PATH = 'data/'

def extract_centroid(multipolygon_wkt):
    try:
        geom = wkt.loads(multipolygon_wkt)
        centroid = geom.centroid
        return centroid.y, centroid.x
    except:
        return None, None

def inject_parks(conn):
    print("\n" + "="*60)
    print("Injecting Park data...")
    print("="*60)
    
    parks_df = pd.read_csv(DATA_PATH + 'Parks_Properties.csv')
    print(f"{len(parks_df)} in total")
    
    parks_df[['latitude', 'longitude']] = parks_df['multipolygon'].apply(
        lambda x: pd.Series(extract_centroid(x)) if pd.notna(x) else (None, None)
    )
    
    original_count = len(parks_df)
    parks_df = parks_df[parks_df['latitude'].notna()]
    print(f"{original_count - len(parks_df)} are removed")
    
    # borough
    borough_map = {
        'M': 'Manhattan', 'X': 'Bronx', 'B': 'Brooklyn',
        'Q': 'Queens', 'R': 'Staten Island'
    }
    parks_df['borough_full'] = parks_df['BOROUGH'].map(borough_map)
    
    # zipcode
    parks_df['zipcode_clean'] = parks_df['ZIPCODE'].apply(
        lambda x: str(x).split(',')[0].strip()[:10] if pd.notna(x) else None
    )
    
    # is_waterfront
    parks_df['is_waterfront'] = parks_df['WATERFRONT'].fillna('').astype(str).str.strip().str.lower() == 'true'

    
    # parks_df['has_nature_preserve'] = parks_df['TYPECATEGORY'].fillna('').str.lower().isin(
    #     ['nature area', 'natural area']
    # )
    
    cursor = conn.cursor()
    inserted = 0
    skipped = 0
    
    for _, row in parks_df.iterrows():
        try:
            park_id = str(row['GISPROPNUM']).strip() if pd.notna(row['GISPROPNUM']) else None
            
            if park_id is None or park_id == '' or park_id == 'nan':
                skipped += 1
                continue
            
            park_name = row['SIGNNAME'] if pd.notna(row['SIGNNAME']) else row.get('NAME311', f'Park {park_id}')
            
            cursor.execute("""
                INSERT INTO Park (
                    park_id, park_name, park_size,
                    borough, zipcode, latitude, longitude,
                    park_type, acres, is_waterfront,
                    avg_rating
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    park_name = VALUES(park_name),
                    park_size = VALUES(park_size),
                    borough = VALUES(borough),
                    zipcode = VALUES(zipcode),
                    latitude = VALUES(latitude),
                    longitude = VALUES(longitude),
                    park_type = VALUES(park_type),
                    acres = VALUES(acres),
                    is_waterfront = VALUES(is_waterfront)
            """, (
                park_id[:50],
                park_name[:200],
                float(row['ACRES']) if pd.notna(row['ACRES']) else None,  # park_size
                row['borough_full'],
                row['zipcode_clean'],
                float(row['latitude']),
                float(row['longitude']),
                row['TYPECATEGORY'][:50] if pd.notna(row['TYPECATEGORY']) else None,
                float(row['ACRES']) if pd.notna(row['ACRES']) else None,  # acres
                bool(row['is_waterfront']),
                0.00  # avg_rating
            ))
            inserted += 1
            
            if inserted % 500 == 0:
                print(f"process: {inserted}/{len(parks_df)}")
                
        except Exception as e:
            print(f"injection failed: (GISPROPNUM: {row.get('GISPROPNUM')}): {e}")
            skipped += 1
            continue
    
    conn.commit()
    cursor.close()
    
    print(f"\nPark injection finished:")
    print(f"{inserted} injected ")
    print(f"{skipped} skipped")
    
    return inserted

def inject_facilities(conn):
    print("\n" + "="*60)
    print("Injecting Facilities data...")
    print("="*60)
    
    facilities_df = pd.read_csv(DATA_PATH + 'Athletic_Facilities.csv')
    print(f"{len(facilities_df)} in total")
    
    facility_type_map = {
        'BASKETBALL': 'Basketball',
        'TENNIS': 'Tennis',
        'REGULATION_SOCCER': 'Soccer',
        'ADULT_BASEBALL': 'Baseball',
        'ADULT_SOFTBALL': 'Softball',
        'VOLLEYBALL': 'Volleyball',
        'HANDBALL': 'Handball',
        'Pickleball': 'Pickleball',
        'HOCKEY': 'Hockey',
        'CRICKET': 'Cricket',
        'RUGBY': 'Rugby',
        'LACROSSE': 'Lacrosse',
        'BOCCE': 'Bocce',
        'ADULT_FOOTBALL': 'Football',
        'TRACK_AND_FIELD': 'Track'
    }
    
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT park_id FROM Park")
    valid_park_ids = set(row[0] for row in cursor.fetchall())
    print(f"{len(valid_park_ids)} valid parks")
    
    inserted = 0
    skipped = 0
    
    for _, row in facilities_df.iterrows():
        park_id = str(row['GISPROPNUM']).strip() if pd.notna(row['GISPROPNUM']) else None
        
        if park_id is None or park_id == '' or park_id == 'nan' or park_id not in valid_park_ids:
            skipped += 1
            continue
        
        for col, facility_type in facility_type_map.items():
            if col in row and pd.notna(row[col]) and str(row[col]).upper() == 'TRUE':
                try:
                    surface_type = row.get('SURFACE_TYPE', 'Unknown')
                    is_lighted = str(row.get('FIELD_LIGHTED', '')).upper() == 'TRUE'
                    is_accessible = str(row.get('ACCESSIBLE', '')).upper() == 'TRUE'
                    field_condition = str(row.get('FEATURESTATUS', 'Unknown'))
                    raw_dimensions = row.get('DIMENSIONS')
                    dimensions= str(raw_dimensions).strip() if pd.notna(raw_dimensions) and str(raw_dimensions).strip().lower() != 'nan' else None
                    
                    cursor.execute("""
                        INSERT INTO Facility (
                            park_id, facility_type, dimensions, surface_type,
                            is_lighted, is_accessible, field_condition,
                            avg_facility_rating, total_facility_reviews
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        park_id[:50],
                        facility_type,
                        dimensions[:100],
                        surface_type[:50] if pd.notna(surface_type) else 'Unknown',
                        is_lighted,
                        is_accessible,
                        field_condition,
                        0.00,
                        0
                    ))
                    inserted += 1
                    
                except Exception as e:
                    print(f"Injection failed: (Park: {park_id}, Type: {facility_type}): {e}")
                    continue
        
        if (skipped + inserted) % 500 == 0:
            print(f"process: {skipped + inserted}/{len(facilities_df)}")
    
    conn.commit()
    cursor.close()
    
    print(f"\nFacility injection finished: ")
    print(f"{inserted} injected ")
    print(f"{skipped} skipped")
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT facility_type, COUNT(*) as count
        FROM Facility
        GROUP BY facility_type
        ORDER BY count DESC
    """)
    
    print("\nfacility_type statistics:")
    for facility_type, count in cursor.fetchall():
        print(f"{facility_type}: {count}")
    cursor.close()
    
    return inserted

def inject_trails(conn):
    print("\n" + "="*60)
    print("Injecting Trail data...")
    print("="*60)
    
    trails_df = pd.read_csv(DATA_PATH + 'Parks_Trails.csv')
    print(f" {len(trails_df)} Trails in total")
    
    trails_df['difficulty_clean'] = trails_df['Difficulty'].fillna('Unkown')
    
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT park_id FROM Park")
    valid_park_ids = set(row[0] for row in cursor.fetchall())
    print(f"{len(valid_park_ids)} valid parks")
    
    inserted = 0
    skipped = 0
    
    for _, row in trails_df.iterrows():
        park_id = str(row['ParkID']).strip() if pd.notna(row['ParkID']) else None
        
        if park_id is None or park_id == '' or park_id == 'nan' or park_id not in valid_park_ids:
            skipped += 1
            continue
        
        try:
            trail_name = row.get('Trail_Name', '')
            if pd.isna(trail_name) or str(trail_name).strip() == '':
                park_name = row.get('Park_Name', f'Park {park_id}')
                trail_name = f'Trail at {park_name}'
            
            raw_width = row.get('Width_ft')
            width_ft = str(raw_width).strip() if pd.notna(raw_width) and str(raw_width).strip().lower() != 'nan' else None

            
            # surface
            surface = str(row.get('Surface', 'Unknown')).strip()
            if surface == '' or surface == 'nan':
                surface = 'Unknown'

            trail_markers = str(row.get('TrailMarkersInstalled', '')).strip().upper()
            has_trail_markers = trail_markers in ['TRUE', 'YES', '1', 'Y']
            
            cursor.execute("""
                INSERT INTO Trail (
                    park_id, trail_name, width_ft, surface,
                    difficulty,  has_trail_markers,
                    avg_trail_rating, total_trail_reviews
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                park_id[:50],
                str(trail_name)[:200],
                width_ft[:50],
                surface[:50],
                row['difficulty_clean'],

                has_trail_markers,
                0.00,
                0
            ))
            inserted += 1
            
            
        except Exception as e:
            print(f"Injection failed (Park: {park_id}, Trail: {row.get('Trail_Name', 'Unknown')}): {e}")
            skipped += 1
            continue
    
    conn.commit()
    cursor.close()
    
    print(f"\nTrail injection finished:")
    print(f"{inserted} injected ")
    print(f"{skipped} skipped")
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT difficulty, COUNT(*) as count
        FROM Trail
        GROUP BY difficulty
        ORDER BY count DESC
    """)
    
    print("\nTrail difficulty statistics:")
    for difficulty, count in cursor.fetchall():
        print(f"{difficulty}: {count}")
    
    cursor.execute("""
        SELECT surface, COUNT(*) as count
        FROM Trail
        GROUP BY surface
        ORDER BY count DESC
        LIMIT 10
    """)
    
    print("\nsurface type statistics (Top 10):")
    for surface, count in cursor.fetchall():
        print(f"{surface}: {count}")
    
    cursor.close()
    
    return inserted

def main():
    print("\n" + "="*60)
    print("NYC Parks Injection")
    print("="*60)
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        print("connection established")
    except Exception as e:
        print(f"connection failed: {e}")
        return
    
    try:
        parks_count = inject_parks(conn)
        facilities_count = inject_facilities(conn)
        trails_count = inject_trails(conn)
        
        print("\n" + "="*60)
        print("all data injected")
        print("="*60)
        print(f"Stat:")
        print(f"Parks: {parks_count}")
        print(f"Facilities: {facilities_count}")
        print(f"Trails: {trails_count}")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\error occured: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        conn.close()
        print("disconnected")

if __name__ == "__main__":
    main()