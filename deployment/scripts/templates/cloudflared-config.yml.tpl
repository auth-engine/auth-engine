# Cloudflare Tunnel config for AuthEngine (local VM / no public IP).
# Copy to the VM: /etc/cloudflared/config.yml
# Replace TUNNEL_ID and credentials path after: cloudflared tunnel create authengine

tunnel: TUNNEL_ID
credentials-file: /etc/cloudflared/TUNNEL_ID.json

ingress:
  - hostname: api.DOMAIN
    service: http://127.0.0.1:80
  - hostname: auth.DOMAIN
    service: http://127.0.0.1:80
  - hostname: app.DOMAIN
    service: http://127.0.0.1:80
  - hostname: rancher.DOMAIN
    service: http://127.0.0.1:80
  - service: http_status:404
