FROM redmine:latest

COPY entrypoint.sh /entrypoint.sh
COPY database.yml.template /database.yml.template
COPY configuration.yml.template /configuration.yml.template
COPY receive_imap.sh.template /receive_imap.sh.template

RUN apt-get update \
    && apt-get install -y gettext cron tree git \
    && chmod +x /entrypoint.sh \
    && tree /usr/src/redmine

COPY redmine_plugins/project_mail_override /usr/src/redmine/plugins/project_mail_override

WORKDIR /usr/src/redmine/plugins
RUN git clone https://github.com/enricohuang/redmine_mermaid.git
WORKDIR /usr/src/redmine
RUN bundle install \
    && bundle exec rake redmine:plugins:assets RAILS_ENV=production

RUN chown redmine.redmine /usr/src/redmine \
      && tree /usr/src/redmine/plugins

ENTRYPOINT ["/entrypoint.sh"]
CMD ["rails", "server", "-b", "0.0.0.0"]