#!/usr/bin/env bash
# AuthEngine — local laptop VM deployment (Multipass + K3s + Rancher + Cloudflare Tunnel + Helm).
#
# Usage:
#   ./scripts/deploy-local-vm.sh specs          # hardware requirements
#   ./scripts/deploy-local-vm.sh vm-create      # create Multipass VM
#   ./scripts/deploy-local-vm.sh vm-info        # show VM IP / status
#   ./scripts/deploy-local-vm.sh vm-shell       # open shell in VM
#   ./scripts/deploy-local-vm.sh sync           # copy helm chart into VM
#   ./scripts/deploy-local-vm.sh k3s            # install K3s + Rancher on VM
#   ./scripts/deploy-local-vm.sh cloudflare     # print Cloudflare Tunnel steps
#   ./scripts/deploy-local-vm.sh helm           # helm upgrade on VM
#   ./scripts/deploy-local-vm.sh verify         # curl public endpoints
#   ./scripts/deploy-local-vm.sh all            # full guided install
#
# Environment:
#   VM_NAME=authengine-lab   VM_CPUS=4   VM_MEM=8G   VM_DISK=40G
#   HELM_NAMESPACE=auth-dev   HELM_VALUES_FILE=helm/authengine/local-values.yaml
#   SKIP_CONFIRM=1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

VM_NAME="${VM_NAME:-authengine-lab}"
VM_CPUS="${VM_CPUS:-4}"
VM_MEM="${VM_MEM:-8G}"
VM_DISK="${VM_DISK:-40G}"
VM_IMAGE="${VM_IMAGE:-24.04}"

vm_exec() {
  multipass exec "${VM_NAME}" -- bash -lc "$1"
}

require_multipass() {
  require_cmd multipass
}

cmd_specs() {
  print_hardware_specs
  cat <<EOF
Local VM defaults (override with env vars):

  VM_NAME=${VM_NAME}
  VM_CPUS=${VM_CPUS}   VM_MEM=${VM_MEM}   VM_DISK=${VM_DISK}

No public IP required — use Cloudflare Tunnel (\`$0 cloudflare\`) to expose
api, auth, app, and rancher hostnames to the internet.

EOF
}

cmd_vm_create() {
  require_multipass
  phase "Create Multipass VM: ${VM_NAME}"
  if multipass info "${VM_NAME}" >/dev/null 2>&1; then
    ok "VM ${VM_NAME} already exists"
    multipass info "${VM_NAME}"
    return 0
  fi
  multipass launch "${VM_IMAGE}" \
    --name "${VM_NAME}" \
    --cpus "${VM_CPUS}" \
    --memory "${VM_MEM}" \
    --disk "${VM_DISK}"
  ok "VM created"
  multipass info "${VM_NAME}"
}

cmd_vm_info() {
  require_multipass
  multipass info "${VM_NAME}" || err "VM ${VM_NAME} not found — run: $0 vm-create"
}

cmd_vm_shell() {
  require_multipass
  multipass shell "${VM_NAME}"
}

cmd_sync() {
  require_multipass
  phase "Sync helm chart to VM"
  vm_exec "mkdir -p ~/auth-engine/infra"
  multipass transfer "${REPO_ROOT}/helm" "${VM_NAME}:/home/ubuntu/auth-engine/infra/"
  multipass transfer "${REPO_ROOT}/scripts" "${VM_NAME}:/home/ubuntu/auth-engine/infra/" 2>/dev/null || true
  ok "Synced helm/ to VM:~/auth-engine/infra/helm/"
}

cmd_k3s() {
  require_multipass
  cmd_sync
  phase "Install K3s + Rancher on ${VM_NAME}"
  vm_exec "export HELM_DIR=~/auth-engine/infra/helm/authengine HELM_VALUES_FILE=~/auth-engine/infra/helm/authengine/local-values.yaml; source ~/auth-engine/infra/scripts/lib/common.sh; install_k3s_stack"
  ok "K3s stack installed on VM"
}

cmd_cloudflare() {
  load_domain_from_values
  phase "Cloudflare Tunnel setup"
  cat <<EOF
Use Cloudflare Tunnel when the VM has no public IP (laptop / home lab).

1. Install cloudflared on the VM:

   multipass shell ${VM_NAME}
   curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
   echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared jammy main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
   sudo apt update && sudo apt install -y cloudflared

2. Authenticate and create a tunnel:

   cloudflared tunnel login
   cloudflared tunnel create authengine

3. Route DNS (Cloudflare dashboard or CLI):

   cloudflared tunnel route dns authengine ${API_SUBDOMAIN}.${ROOT_DOMAIN}
   cloudflared tunnel route dns authengine ${IDP_SUBDOMAIN}.${ROOT_DOMAIN}
   cloudflared tunnel route dns authengine ${APP_SUBDOMAIN}.${ROOT_DOMAIN}
   cloudflared tunnel route dns authengine rancher.${ROOT_DOMAIN}

4. Config file — template at:
   ${SCRIPT_DIR}/templates/cloudflared-config.yml.tpl

   Replace DOMAIN with ${ROOT_DOMAIN} and TUNNEL_ID with your tunnel UUID.
   Point all hostnames to http://127.0.0.1:80 (K3s Traefik).

5. Run the tunnel:

   sudo cloudflared --config /etc/cloudflared/config.yml tunnel run

   Or install as a service:
   sudo cloudflared service install
   sudo systemctl enable --now cloudflared

TLS terminates at Cloudflare — Traefik receives HTTP on port 80.

EOF
}

cmd_helm() {
  require_multipass
  cmd_sync
  phase "Helm upgrade on ${VM_NAME}"
  vm_exec "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml; \
    cd ~/auth-engine/infra/helm/authengine && \
    helm upgrade --install authengine . \
      -n ${HELM_NAMESPACE} --create-namespace \
      -f local-values.yaml \
      --set seed.enabled=true \
      --set seed.runOnUpgrade=true"
  vm_exec "sudo kubectl get pods,jobs -n ${HELM_NAMESPACE}"
  ok "AuthEngine deployed"
}

cmd_verify() {
  verify_endpoints
}

cmd_all() {
  log "AuthEngine local VM deployment"
  print_hardware_specs
  cmd_specs
  if ! confirm "Create Multipass VM (${VM_NAME}, ${VM_CPUS} CPU, ${VM_MEM} RAM)?"; then
    exit 0
  fi
  cmd_vm_create
  if confirm "Install K3s + Rancher on VM? (takes a few minutes)"; then
    cmd_sync
    cmd_k3s
  fi
  cmd_cloudflare
  if confirm "Deploy AuthEngine Helm chart on VM?"; then
    cmd_helm
  fi
  warn "Complete Cloudflare Tunnel setup on the VM before verify will pass."
  if confirm "Run verification curls?"; then
    cmd_verify
  fi
  print_oauth_checklist
  ok "Local VM deployment complete"
  log "Rancher: https://rancher.${ROOT_DOMAIN:-authengine.org}"
  log "Login:   https://${APP_HOST:-app.authengine.org}/login"
}

usage() {
  cat <<EOF
Usage: $(basename "$0") <command>

Commands:
  specs        Show hardware requirements
  vm-create    Create Multipass VM (${VM_NAME})
  vm-info      Show VM status
  vm-shell     Open shell in VM
  sync         Copy helm chart into VM
  k3s          Install K3s + cert-manager + Rancher on VM
  cloudflare   Cloudflare Tunnel setup guide
  helm         Helm upgrade AuthEngine on VM
  verify       Curl public endpoints
  all          Interactive full install

Environment: VM_NAME VM_CPUS VM_MEM VM_DISK HELM_NAMESPACE HELM_VALUES_FILE

Docs: https://docs.authengine.org/deployment/#local-vm-laptop--cloudflare-tunnel
EOF
}

main() {
  local cmd="${1:-help}"
  shift || true
  case "${cmd}" in
    specs) cmd_specs ;;
    vm-create) cmd_vm_create ;;
    vm-info) cmd_vm_info ;;
    vm-shell) cmd_vm_shell ;;
    sync) cmd_sync ;;
    k3s) cmd_k3s ;;
    cloudflare) cmd_cloudflare ;;
    helm) cmd_helm ;;
    verify) cmd_verify ;;
    all) cmd_all ;;
    help|-h|--help) usage ;;
    *) err "Unknown command: ${cmd}"; usage; exit 1 ;;
  esac
}

main "$@"
