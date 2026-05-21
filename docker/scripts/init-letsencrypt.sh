#!/bin/bash
# =============================================================================
# init-letsencrypt.sh
# One-time bootstrap script for obtaining Let's Encrypt TLS certificates.
#
# Run this on the VPS BEFORE the first production deploy:
#   chmod +x docker/scripts/init-letsencrypt.sh
#   ./docker/scripts/init-letsencrypt.sh
#
# It will:
#   1. Download recommended TLS parameters from Certbot
#   2. Create a temporary self-signed certificate so Nginx can start
#   3. Start Nginx
#   4. Request real certificates via the ACME webroot challenge
#   5. Reload Nginx with the real certificates
# =============================================================================
set -euo pipefail

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()    { echo -e "${CYAN}ℹ ${NC} $*"; }
success() { echo -e "${GREEN}✔ ${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠ ${NC} $*"; }
error()   { echo -e "${RED}✖ ${NC} $*"; }

# ─── Configuration ───────────────────────────────────────────────────────────
domains=(speakio.fr www.speakio.fr speakio.eu www.speakio.eu)
data_path="./certbot"
staging=0   # Set to 1 to use Let's Encrypt staging servers (rate-limit-free)

# E-mail for Let's Encrypt notifications
if [ -n "${CERTBOT_EMAIL:-}" ]; then
    email="$CERTBOT_EMAIL"
else
    read -rp "Enter e-mail address for Let's Encrypt notifications: " email
fi

if [ -z "$email" ]; then
    error "E-mail address is required."
    exit 1
fi

# Primary certificate name (all domains share one cert)
cert_name="speakio.fr"

# ─── Pre-flight checks ──────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    error "Docker is not installed. Please install Docker first."
    exit 1
fi

# ─── Check for existing certificates ────────────────────────────────────────
if [ -d "$data_path/conf/live/$cert_name" ]; then
    warn "Existing certificates found for $cert_name."
    read -rp "Do you want to replace them? (y/N) " decision
    if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
        info "Keeping existing certificates. Exiting."
        exit 0
    fi
fi

# ─── Step 1: Download recommended TLS parameters ────────────────────────────
info "Downloading recommended TLS parameters from Certbot…"
mkdir -p "$data_path/conf"

curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    > "$data_path/conf/options-ssl-nginx.conf"

curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
    > "$data_path/conf/ssl-dhparams.pem"

success "TLS parameters downloaded."

# ─── Step 2: Create dummy self-signed certificate ────────────────────────────
info "Creating dummy self-signed certificate for $cert_name…"
cert_dir="$data_path/conf/live/$cert_name"
mkdir -p "$cert_dir"

openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
    -keyout "$cert_dir/privkey.pem" \
    -out "$cert_dir/fullchain.pem" \
    -subj '/CN=localhost' 2>/dev/null

success "Dummy certificate created."

# ─── Step 3: Start Nginx ────────────────────────────────────────────────────
info "Starting Nginx…"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d nginx
success "Nginx is running."

# ─── Step 4: Delete dummy certificate & request real ones ───────────────────
info "Removing dummy certificate…"
rm -rf "$cert_dir"
success "Dummy certificate removed."

info "Requesting real certificates from Let's Encrypt…"

# Build domain arguments
domain_args=""
for domain in "${domains[@]}"; do
    domain_args="$domain_args -d $domain"
done

# Use staging server if requested
staging_arg=""
if [ "$staging" -eq 1 ]; then
    staging_arg="--staging"
    warn "Using Let's Encrypt STAGING server (certificates will NOT be trusted)."
fi

docker compose run --rm certbot certonly --webroot \
    -w /var/www/certbot \
    $domain_args \
    --email "$email" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    $staging_arg

success "Real certificates obtained!"

# ─── Step 5: Reload Nginx with real certificates ────────────────────────────
info "Reloading Nginx with real certificates…"
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -s reload
success "Nginx reloaded successfully."

echo ""
success "=========================================="
success "  TLS setup complete for:"
for domain in "${domains[@]}"; do
    success "    • $domain"
done
success "=========================================="
echo ""
info "Certificates will auto-renew via the Certbot container."
info "Make sure your docker-compose.prod.yml has a certbot service with:"
info "  command: certonly --webroot -w /var/www/certbot --force-renewal"
info "  or a renewal entrypoint like:"
info "  entrypoint: \"/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h; done'\""
