import csv
import sys
import argparse
from collections import Counter

def validate_csv(file_path, delimiter=',', quotechar='"'):
    errors = []
    e_column_values = []
    h_column_values = []
    j_column_values = []
    
    try:
        with open(file_path, mode='r', encoding='utf-8-sig') as csvfile:
            reader = csv.reader(csvfile, delimiter=delimiter, quotechar=quotechar)
            header = next(reader, None) # Skip header if present
            
            if not header:
                print(f"Error: File {file_path} is empty.")
                return False

            for row_idx, row in enumerate(reader, start=2): # start=2 because 1 is header
                if len(row) < 10:
                    errors.append(f"Row {row_idx}: Insufficient columns (need at least 10, found {len(row)})")
                    continue
                
                val_e = row[4].strip()
                val_h = row[7].strip()
                val_j = row[9].strip()
                
                e_column_values.append((row_idx, val_e))
                if val_h:
                    h_column_values.append((row_idx, val_h))
                if val_j:
                    j_column_values.append((row_idx, val_j))
                    
    except FileNotFoundError:
        print(f"Error: File {file_path} not found.")
        return False
    except Exception as e:
        print(f"Error reading file: {e}")
        return False

    # Check for uniqueness in E
    e_only_values = [v for _, v in e_column_values]
    counts_e = Counter(e_only_values)
    duplicates = [val for val, count in counts_e.items() if count > 1]
    
    if duplicates:
        for val in duplicates:
            rows = [idx for idx, v in e_column_values if v == val]
            errors.append(f"Spalte E: Wert '{val}' ist nicht eindeutig (Zeilen: {rows})")

    # Check that H values exist in E
    e_set = set(e_only_values)
    for row_idx, val_h in h_column_values:
        if val_h and val_h not in e_set:
            errors.append(f"Row {row_idx}: Wert in Spalte H '{val_h}' existiert nicht in Spalte E.")

    # Check that J values exist in E
    for row_idx, val_j in j_column_values:
        if val_j and val_j not in e_set:
            errors.append(f"Row {row_idx}: Wert in Spalte J '{val_j}' existiert nicht in Spalte E.")

    if errors:
        print(f"Validation failed for {file_path}:")
        for error in errors:
            print(f"  - {error}")
        return False
    else:
        print(f"Validation successful for {file_path}.")
        return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate CSV file based on specific column rules.")
    parser.add_argument("file", help="Path to the CSV file")
    parser.add_argument("--delimiter", default=";", help="CSV delimiter (default: ;)")
    
    args = parser.parse_args()
    
    success = validate_csv(args.file, delimiter=args.delimiter)
    if not success:
        sys.exit(1)
