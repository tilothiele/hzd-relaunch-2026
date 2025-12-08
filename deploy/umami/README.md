
Datenbank anlegen:

```
sudo -u postgres psql

CREATE DATABASE umami;
CREATE USER umami WITH PASSWORD 'GeheimesPasswort';
GRANT ALL PRIVILEGES ON DATABASE umami TO umami;

\c umami  -- in die DB wechseln

GRANT ALL PRIVILEGES ON SCHEMA public TO umami;
ALTER DATABASE umami OWNER TO umami;

-- oder

ALTER SCHEMA public OWNER TO umami;


```
