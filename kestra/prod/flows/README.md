
python -m venv venv
source venv/bin/activate

pip install -r ./requirements.txt

playwright install

playwright codegen https://hzd.chromosoft.de