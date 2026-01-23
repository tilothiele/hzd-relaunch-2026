#!/bin/bash

# Test valid CSV
cat <<EOF > test_valid.csv
A;B;C;D;E;F;G;H;I;J
valA1;valB1;valC1;valD1;name1;valF1;valG1;name1;valI1;name1
valA2;valB2;valC2;valD2;name2;valF2;valG2;name1;valI2;name2
EOF

echo "Testing valid CSV..."
python3 validate_csv.py test_valid.csv --delimiter ";"
if [ $? -eq 0 ]; then
    echo "PASS: Valid CSV accepted."
else
    echo "FAIL: Valid CSV rejected."
fi

# Test duplicate E
cat <<EOF > test_duplicate_e.csv
A;B;C;D;E;F;G;H;I;J
valA1;valB1;valC1;valD1;name1;valF1;valG1;name1;valI1;name1
valA2;valB2;valC2;valD2;name1;valF2;valG2;name1;valI2;name1
EOF

echo -e "\nTesting duplicate E..."
python3 validate_csv.py test_duplicate_e.csv --delimiter ";"
if [ $? -ne 0 ]; then
    echo "PASS: Duplicate E detected."
else
    echo "FAIL: Duplicate E not detected."
fi

# Test missing H in E
cat <<EOF > test_missing_h.csv
A;B;C;D;E;F;G;H;I;J
valA1;valB1;valC1;valD1;name1;valF1;valG1;missingH;valI1;name1
EOF

echo -e "\nTesting missing H in E..."
python3 validate_csv.py test_missing_h.csv --delimiter ";"
if [ $? -ne 0 ]; then
    echo "PASS: Missing H detected."
else
    echo "FAIL: Missing H not detected."
fi

# Test missing J in E
cat <<EOF > test_missing_j.csv
A;B;C;D;E;F;G;H;I;J
valA1;valB1;valC1;valD1;name1;valF1;valG1;name1;valI1;missingJ
EOF

echo -e "\nTesting missing J in E..."
python3 validate_csv.py test_missing_j.csv --delimiter ";"
if [ $? -ne 0 ]; then
    echo "PASS: Missing J detected."
else
    echo "FAIL: Missing J not detected."
fi

# Cleanup
rm test_valid.csv test_duplicate_e.csv test_missing_h.csv test_missing_j.csv
