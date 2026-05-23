# Sidecar container that takes nightly mysqldump snapshots.
# Built on mysql:8.4 because alpine's mysql-client is actually mariadb-client,
# which can't authenticate against MySQL 8's default caching_sha2_password.
# The image is Oracle Linux 9 based — use microdnf, not apt-get.
FROM mysql:8.4

# gzip + mysqldump already in the base image. cronie provides crond + crontab.
RUN microdnf install -y cronie \
    && microdnf clean all \
    && rm -rf /var/cache/yum

ENV TZ=UTC

COPY backup.sh    /usr/local/bin/backup.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/entrypoint.sh

VOLUME ["/backups"]

# Override the mysql image's entrypoint/cmd — we are not running mysqld here.
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
