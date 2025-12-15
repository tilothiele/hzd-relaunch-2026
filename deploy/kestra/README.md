
Datenbank anlegen:

```
sudo -u postgres psql

CREATE DATABASE kestra;
CREATE USER kestra WITH PASSWORD 'GeheimesPasswort';
GRANT ALL PRIVILEGES ON DATABASE kestra TO kestra;

\c kestra  -- in die DB wechseln

GRANT ALL PRIVILEGES ON SCHEMA public TO kestra;
ALTER DATABASE kestra OWNER TO kestra;

-- oder

ALTER SCHEMA public OWNER TO kestra;


```
