FROM redmine:latest

COPY entrypoint.sh /entrypoint.sh
COPY database.yml.template /database.yml.template
COPY configuration.yml.template /configuration.yml.template
COPY receive_imap.sh.template /receive_imap.sh.template
RUN apt-get update \
    && apt-get install -y gettext cron \
    && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["rails", "server", "-b", "0.0.0.0"]