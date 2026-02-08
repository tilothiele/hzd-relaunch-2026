
python -m venv venv
source venv/bin/activate

pip install -r ./requirements.txt

playwright install

playwright codegen https://hzd.chromosoft.de

----

Datum in localc formatieren: =DATUM(RECHTS(AJ1959;4);TEIL(AJ1959;4;2);TEIL(AJ1959;1;2))