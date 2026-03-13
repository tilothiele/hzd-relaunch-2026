
python -m venv venv
source venv/bin/activate

pip install -r ./requirements.txt

playwright install

playwright codegen --target=python https://chromosoft.de

!!! Aber: die produktiven chromosoft-sktipte liegen schon in /kestra/prod/flows
