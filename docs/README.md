# Frontend

Diese Labels verhindern ein HTTP400:

```
traefik.enable=true
traefik.http.middlewares.gzip.compress=true
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
traefik.http.middlewares.http-basic-auth.basicauth.users=hzd:$2y$10$mYaRlpIEzKO/G0APvyVlU.i5ixqkBgG9pRxAbfrh/IhFKxseRuK1.
traefik.http.routers.app-http.entryPoints=http
traefik.http.routers.app-http.rule=Host(`hovawarte.app.tilothiele.de`)
traefik.http.routers.app-http.middlewares=redirect-to-https
traefik.http.routers.app-https.entryPoints=https
traefik.http.routers.app-https.rule=Host(`hovawarte.app.tilothiele.de`)
traefik.http.routers.app-https.middlewares=gzip,http-basic-auth
traefik.http.routers.app-https.tls=true
traefik.http.routers.app-https.tls.certresolver=letsencrypt
traefik.http.routers.app-https.service=app-service
traefik.http.services.app-service.loadbalancer.server.port=3000

caddy_0.basicauth.hzd="$2y$10$2Dw4WyhCZXF5Gi/lS8zo7e7Mfwek9yOS6EVc57XlW3c0944AiTgz2"
caddy_0.encode=zstd gzip
caddy_0.handle_path.0_reverse_proxy={{upstreams 3000}}
caddy_0.handle_path=/*
caddy_0.header=-Server
caddy_0.try_files={path} /index.html /index.php
caddy_0=https://hovawarte.app.tilothiele.de
caddy_ingress_network=coolify
```

