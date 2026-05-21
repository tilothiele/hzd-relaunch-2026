
# Projektstruktur:

```
 project/
 ├── jobs/
 │   ├── job_001/
 │   │   ├── original/
 │   │   ├── extracted/
 │   │   ├── processed/
 │   │   ├── metadata.json
 │   │   └── status.json
 │
 ├── pipeline/
 │   ├── quality.py
 │   ├── detection.py
 │   ├── classifier.py
 │   ├── review.py
 │   ├── resourcespace.py
 │   └── models/
 │
 ├── app/
 │   └── review_ui.py
 │
 └── main.py
```

## Pipeline Schritte

```
Extract from IMAP → Classification+Triage → Preprocessing → AI → Review Queue → Mensch → DAM
```

## Technische Umsetzung / Libraries

| Aufgabe          | Technologie      |
| ---------------- | ---------------- |
| Queue            | Redis + rq       |
| Image Processing | OpenCV + Pillow  |
| Detection        | YOLOv8           |
| Faces            | face_recognition |
| Semantik         | CLIP             |
| UI               | Streamlit        |
| Upload           | requests         |
| Metadaten        | JSON             |
