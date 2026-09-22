#!/usr/bin/env bash
# Shared helpers for AuthEngine deployment scripts.

set -euo pipefail

SCRIPT_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_LIB_DIR}/../.." && pwd)"
HELM_DIR="${HELM_DIR:-${REPO_ROOT}/helm/authengine}"
HELM_NAMESPACE="${HELM_NAMESPACE:-auth-dev}"
HELM_VALUES_FILE="${HELM_VALUES_FILE:-${HELM_DIR}/local-values.yaml}"
GITHUB_ORG="${GITHUB_ORG:-auth-engine}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log()   { printf '%b\n' "${BLUE}[INFO]${NC} $*"; }
ok()    { printf '%b\n' "${GREEN}[OK]${NC} $*"; }
warn()  { printf '%b\n' "${YELLOW}[WARN]${NC} $*"; }
err()   { printf '%b\n' "${RED}[ERROR]${NC} $*" >&2; }
phase() {
  printf '\n%b\n' "${BOLD}══════════════════════════════════════════════${NC}"
  printf '%b\n' "${BOLD}  $*${NC}"
  printf '%b\n' "${BOLD}══════════════════════════════════════════════${NC}"
}

confirm() {
  local prompt="${1:-Continue?}"
  if [[ "${SKIP_CONFIRM:-0}" == "1" ]]; then
    return 0
  fi
  read -r -p "${prompt} [y/N] " reply
  [[ "${reply}" =~ ^[Yy]$ ]]
}

require_cmd() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    err "Required command not found: ${cmd}"
    exit 1
  fi
}

load_domain_from_values() {
  local values_file="${1:-${HELM_VALUES_FILE}}"
  if [[ ! -f "${values_file}" ]]; then
    err "Helm values file not found: ${values_file}"
    exit 1
  fi
  ROOT_DOMAIN="$(grep -E '^[[:space:]]*domain:' "${values_file}" | head -1 | sed -E 's/.*domain:[[:space:]]*"?([^"#]+)"?.*/\1/' | tr -d ' ')"
  API_SUBDOMAIN="$(grep -E '^[[:space:]]*apiSubdomain:' "${values_file}" | head -1 | sed -E 's/.*:[[:space:]]*"?([^"#]+)"?.*/\1/' | tr -d ' ')"
  IDP_SUBDOMAIN="$(grep -E '^[[:space:]]*idpSubdomain:' "${values_file}" | head -1 | sed -E 's/.*:[[:space:]]*"?([^"#]+)"?.*/\1/' | tr -d ' ')"
  APP_SUBDOMAIN="$(grep -E '^[[:space:]]*dashboardSubdomain:' "${values_file}" | head -1 | sed -E 's/.*:[[:space:]]*"?([^"#]+)"?.*/\1/' | tr -d ' ')"
  ROOT_DOMAIN="${ROOT_DOMAIN:-authengine.org}"
  API_SUBDOMAIN="${API_SUBDOMAIN:-api}"
  IDP_SUBDOMAIN="${IDP_SUBDOMAIN:-auth}"
  APP_SUBDOMAIN="${APP_SUBDOMAIN:-app}"
  API_HOST="${API_SUBDOMAIN}.${ROOT_DOMAIN}"
  IDP_HOST="${IDP_SUBDOMAIN}.${ROOT_DOMAIN}"
  APP_HOST="${APP_SUBDOMAIN}.${ROOT_DOMAIN}"
  RANCHER_HOST="rancher.${ROOT_DOMAIN}"
}

k3s_kubectl() {
  local kubeconfig="${KUBECONFIG:-/etc/rancher/k3s/k3s.yaml}"
  sudo kubectl --kubeconfig="${kubeconfig}" "$@"
}

install_helm_cli() {
  if command -v helm >/dev/null 2>&1; then
    ok "Helm already installed: $(helm version --short 2>/dev/null || helm version | head -1)"
    return 0
  fi
  log "Installing Helm..."
  curl -fsSL -o /tmp/get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
  chmod 700 /tmp/get_helm.sh
  /tmp/get_helm.sh
  ok "Helm installed"
}

install_k3s_stack() {
  phase "Install K3s"
  if ! command -v k3s >/dev/null 2>&1; then
    curl -sfL https://get.k3s.io | sh -
    ok "K3s installed"
  else
    ok "K3s already installed"
  fi
  export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
  k3s_kubectl get nodes

  install_helm_cli

  phase "Install cert-manager + Rancher"
  load_domain_from_values
  helm repo add rancher-latest https://releases.rancher.com/server-charts/latest 2>/dev/null || true
  helm repo add jetstack https://charts.jetstack.io 2>/dev/null || true
  helm repo update

  if ! k3s_kubectl get namespace cert-manager >/dev/null 2>&1; then
    helm install cert-manager jetstack/cert-manager \
      --namespace cert-manager --create-namespace --set installCRDs=true
    ok "cert-manager installed"
  else
    ok "cert-manager already present"
  fi

  if ! k3s_kubectl get namespace cattle-system >/dev/null 2>&1; then
    helm install rancher rancher-latest/rancher \
      --namespace cattle-system --create-namespace \
      --set "hostname=${RANCHER_HOST}" \
      --set replicas=1 \
      --set bootstrapPassword="${RANCHER_BOOTSTRAP_PASSWORD:-admin}"
    ok "Rancher installed — https://${RANCHER_HOST}"
  else
    ok "Rancher already present"
  fi
}

helm_install_authengine() {
  phase "Helm install / upgrade AuthEngine"
  require_cmd helm
  if [[ ! -f "${HELM_DIR}/Chart.yaml" ]]; then
    err "Helm chart not found: ${HELM_DIR}"
    exit 1
  fi
  if [[ ! -f "${HELM_VALUES_FILE}" ]]; then
    err "Values file not found: ${HELM_VALUES_FILE}"
    err "Copy and edit: cp ${HELM_DIR}/values.yaml ${HELM_DIR}/local-values.yaml"
    exit 1
  fi

  local helm_action="upgrade"
  if ! helm status authengine -n "${HELM_NAMESPACE}" >/dev/null 2>&1; then
    helm_action="install"
  fi

  helm "${helm_action}" authengine "${HELM_DIR}" \
    --namespace "${HELM_NAMESPACE}" \
    --create-namespace \
    -f "${HELM_VALUES_FILE}" \
    --set seed.enabled=true \
    --set seed.runOnUpgrade=true

  ok "Helm ${helm_action} complete (namespace: ${HELM_NAMESPACE})"
  k3s_kubectl get pods -n "${HELM_NAMESPACE}" || kubectl get pods -n "${HELM_NAMESPACE}"
  k3s_kubectl get jobs -n "${HELM_NAMESPACE}" || kubectl get jobs -n "${HELM_NAMESPACE}"
}

verify_endpoints() {
  phase "Verify endpoints"
  require_cmd curl
  load_domain_from_values

  local checks=(
    "API health|https://${API_HOST}/api/v1/health"
    "Auth config|https://${API_HOST}/api/v1/auth/auth-config"
    "Dashboard|https://${APP_HOST}/login"
    "Rancher|https://${RANCHER_HOST}"
  )

  for entry in "${checks[@]}"; do
    local name="${entry%%|*}"
    local url="${entry##*|}"
    log "Checking ${name}: ${url}"
    if curl -fsSI --max-time 20 "${url}" >/dev/null 2>&1; then
      ok "${name} reachable"
    else
      warn "${name} not reachable yet"
    fi
  done
}

print_oauth_checklist() {
  load_domain_from_values
  cat <<EOF

OAuth redirect URIs (register in provider consoles):

  https://${API_HOST}/api/v1/auth/oauth/google/callback
  https://${API_HOST}/api/v1/auth/oauth/github/callback
  https://${API_HOST}/api/v1/auth/oauth/microsoft/callback
  https://${APP_HOST}/oauth/authengine/callback

EOF
}

print_hardware_specs() {
  cat <<'EOF'
Hardware requirements (single-node K3s + Rancher + AuthEngine):

  | Profile        | vCPU | RAM   | Disk  | Example instances        |
  |----------------|------|-------|-------|--------------------------|
  | Lab / dev VM   | 4    | 8 GB  | 40 GB | Multipass, t3.large      |
  | Production     | 4    | 16 GB | 80 GB | t4g.xlarge, cpx31, e2-std-4 |
  | Minimum (tight)| 2    | 4 GB  | 30 GB | May OOM during seed Job  |

Works on any cloud (AWS, GCP, Azure, Hetzner, DigitalOcean) or a local VM
with the same specs. ARM64 (Graviton t4g) and x86_64 are both supported.

EOF
}
