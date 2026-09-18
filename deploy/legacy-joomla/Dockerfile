FROM php:5.6-apache

RUN docker-php-ext-install mysqli pdo_mysql \
    && a2enmod rewrite \
    && printf '%s\n' \
        'SetEnvIf X-Forwarded-Proto "^https$" HTTPS=on' \
        > /etc/apache2/conf-available/https-proxy.conf \
    && a2enconf https-proxy