# CHRMS production deployment

- Frontend: https://chrms.chirocity.gov.et
- API: https://chrms-api.chirocity.gov.et
- API/database health: https://chrms-api.chirocity.gov.et/health

Required GitHub secrets: VPS_HOST, VPS_USER, VPS_SSH_KEY.
Optional: VPS_PORT, VPS_APP_DIR (default /var/www/CHRMS), VPS_SSH_FINGERPRINT.
Push main or manually run Deploy CHRMS to VPS. CI verifies container builds,
migrations and service health before deployment. The VPS needs Compose v2,
OpenSSL, and the existing chirocity_edge network and HRMS proxy/certbot containers.

Manual deployment after updating your checkout:

```bash
cd /var/www/CHRMS
bash deploy/deploy.sh
```

The script generates random credentials in root .env on first deployment.
Retrieve admin credentials on the VPS:

```bash
grep '^ADMIN_' .env
```

The initial account is created separately from the demo seed. Existing admins
and production data are retained. Changing ADMIN_PASSWORD in .env does not
reset an existing database account. Demo data is not loaded automatically.

Production uses both docker-compose.yml and docker-compose.domains.yml.
Use deploy/deploy.sh instead of plain docker compose up to retain proxy access.
The API and frontend have unique names; no database or app port is published.
The database volume is chrms_postgres_data and survives container replacements.

Domain configuration is stored at the shared certificate-store host path
/var/www/HRMS/deploy/certbot/conf/chirocity-sites/chrms.conf and loaded by the
HRMS shared-sites wildcard include. Certificate renewal and proxy reload are
scheduled twice daily through /etc/cron.d/chrms-cert-renewal.

For a local CI-style verification without the VPS shared proxy:

```bash
DEPLOY_DOMAINS=0 bash deploy/deploy.sh
```
