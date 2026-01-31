

```
# Aufsetzen des Production Hosts

# 0. auf dem Server ist Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-90-generic x86_64) installiert.
# ebenso ist git installiert

# 1. Docker installieren
# https://docs.docker.com/engine/install/ubuntu/

# 2. Nonroot sudo user (kyno) anlegen
adduser kyno
# passwd: BmsWmI8Kh7Ws84
usermod -aG sudo kyno
usermod -aG docker kyno
rsync --archive --chown=kyno:kyno ~/.ssh /home/kyno

# nun als kyno weitermachen...

sudo vim /etc/ssh/sshd_config
# dort Einträge ändern zu:
# PermitRootLogin no
# PubkeyAuthentication yes
# PasswordAuthentication no

sudo vi /etc/sudoers.d/kyno
# befüllen mit der Zeile:
# kyno ALL=(ALL) NOPASSWD: ALL

# einen ssh-key erzeugen
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -C "kyno@hzd-coolify-prod"


```

