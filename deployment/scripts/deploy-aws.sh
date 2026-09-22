#!/usr/bin/env bash
# AuthEngine — cloud VM deployment (AWS EC2 via Terraform; same steps for any cloud provider).
#
# Usage:
#   ./scripts/deploy-aws.sh specs       # hardware requirements
#   ./scripts/deploy-aws.sh plan        # terraform plan
#   ./scripts/deploy-aws.sh apply       # terraform apply
#   ./scripts/deploy-aws.sh dns         # DNS A records checklist
#   ./scripts/deploy-aws.sh k3s         # install K3s + Rancher on EC2 via SSM
#   ./scripts/deploy-aws.sh helm        # helm install (needs kubectl context)
#   ./scripts/deploy-aws.sh verify      # curl public endpoints
#   ./scripts/deploy-aws.sh all         # interactive walk-through
#
# Environment:
#   TF_DIR=terraform   TFVARS_FILE=terraform/terraform.tfvars
#   HELM_NAMESPACE=authengine   HELM_VALUES_FILE=helm/authengine/prod-values.yaml
#   AWS_PROFILE, AWS_REGION, SKIP_CONFIRM=1, TF_AUTO_APPROVE=1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

TF_DIR="${TF_DIR:-${REPO_ROOT}/terraform}"
TFVARS_FILE="${TFVARS_FILE:-${TF_DIR}/terraform.tfvars}"
PLAN_FILE="${TF_DIR}/tfplan"

aws_cli() {
  if [[ -n "${AWS_PROFILE:-}" ]]; then
    aws --profile "${AWS_PROFILE}" "$@"
  else
    aws "$@"
  fi
}

terraform_cmd() {
  local extra=()
  [[ -n "${AWS_REGION:-}" ]] && extra+=(AWS_REGION="${AWS_REGION}")
  [[ -n "${AWS_PROFILE:-}" ]] && extra+=(AWS_PROFILE="${AWS_PROFILE}")
  env "${extra[@]}" terraform -chdir="${TF_DIR}" "$@"
}

tf_output() {
  terraform_cmd output -raw "$1" 2>/dev/null || true
}

tf_state_ready() {
  terraform_cmd output -json >/dev/null 2>&1
}

check_terraform_prereqs() {
  require_cmd terraform
  if [[ ! -f "${TFVARS_FILE}" ]]; then
    err "Missing ${TFVARS_FILE}"
    log "  cp ${TF_DIR}/terraform.tfvars.example ${TFVARS_FILE}"
    log "  # Set ec2_instance_type = \"t4g.xlarge\" for production"
    exit 1
  fi
}

cmd_specs() {
  print_hardware_specs
  cat <<EOF
AWS Terraform defaults (override in terraform.tfvars):

  ec2_instance_type = "t4g.xlarge"   # recommended (4 vCPU, 16 GB ARM)
  ec2_instance_type = "t4g.large"    # minimum (2 vCPU, 8 GB)

Same K3s + Helm stack works on **any cloud VM** with a public IP:

  1. Create a VM (4 vCPU, 8–16 GB RAM, 40–80 GB disk)
  2. Open ports 80 and 443 in the security group / firewall
  3. Point DNS A records to the VM public IP
  4. Run: curl -sfL https://get.k3s.io | sh -
  5. Follow k3s + helm steps from the deployment guide

EOF
}

cmd_plan() {
  check_terraform_prereqs
  phase "Terraform plan"
  terraform_cmd fmt -check -recursive || terraform_cmd fmt -recursive
  terraform_cmd init -upgrade
  terraform_cmd validate
  terraform_cmd plan -out="${PLAN_FILE}"
  ok "Plan saved: ${PLAN_FILE}"
}

cmd_apply() {
  check_terraform_prereqs
  phase "Terraform apply"
  if [[ -f "${PLAN_FILE}" ]] && [[ "${TF_AUTO_APPROVE:-0}" != "1" ]]; then
    terraform_cmd apply "${PLAN_FILE}"
  else
    terraform_cmd apply ${TF_AUTO_APPROVE:+-auto-approve}
  fi
  ok "Terraform apply complete"
  terraform_cmd output
}

cmd_dns() {
  phase "DNS records"
  local eip
  eip="$(tf_output ec2_public_ip)"
  load_domain_from_values
  if [[ -z "${eip}" ]]; then
    warn "No Terraform state — enter your VM public IP manually"
    eip="<VM_PUBLIC_IP>"
  fi
  cat <<EOF

Point these DNS A records at ${eip} (TTL 300):

  api.${ROOT_DOMAIN}
  auth.${ROOT_DOMAIN}
  app.${ROOT_DOMAIN}
  rancher.${ROOT_DOMAIN}

On any cloud provider: create identical A records pointing at your VM's elastic/public IP.

EOF
}

run_ssm_on_ec2() {
  local comment="$1"
  shift
  require_cmd aws
  local instance_id
  instance_id="$(tf_output ec2_instance_id)"
  if [[ -z "${instance_id}" ]]; then
    err "ec2_instance_id not in Terraform state — run: $0 apply"
    exit 1
  fi

  local params_file
  params_file="$(mktemp)"
  {
    printf '{"commands":['
    local first=true
    for cmd in "$@"; do
      [[ "${first}" == true ]] && first=false || printf ','
      python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "${cmd}"
    done
    printf ']}'
  } >"${params_file}"

  log "SSM → ${instance_id} (${comment})"
  local command_id
  command_id="$(aws_cli ssm send-command \
    --instance-ids "${instance_id}" \
    --document-name "AWS-RunShellScript" \
    --comment "${comment}" \
    --parameters "file://${params_file}" \
    --query 'Command.CommandId' --output text)"
  rm -f "${params_file}"

  local status="InProgress"
  while [[ "${status}" == "InProgress" || "${status}" == "Pending" ]]; do
    sleep 4
    status="$(aws_cli ssm get-command-invocation \
      --command-id "${command_id}" --instance-id "${instance_id}" \
      --query 'Status' --output text 2>/dev/null || echo InProgress)"
  done

  aws_cli ssm get-command-invocation \
    --command-id "${command_id}" --instance-id "${instance_id}" \
    --query '[Status, StandardOutputContent, StandardErrorContent]' --output text | tail -50

  [[ "${status}" == "Success" ]] || { err "SSM failed: ${status}"; exit 1; }
  ok "SSM command succeeded"
}

cmd_k3s() {
  phase "Install K3s + Rancher on EC2 (via SSM)"
  if ! tf_state_ready; then
    err "Run terraform apply first"
    exit 1
  fi
  load_domain_from_values
  local rancher_host="rancher.${ROOT_DOMAIN}"

  if ! confirm "Install K3s + Rancher on EC2 via SSM?"; then
    return 0
  fi

  run_ssm_on_ec2 "authengine-k3s" \
    "curl -sfL https://get.k3s.io | sh -" \
    "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml" \
    "kubectl get nodes" \
    "curl -fsSL -o /tmp/get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 && chmod 700 /tmp/get_helm.sh && /tmp/get_helm.sh" \
    "helm repo add rancher-latest https://releases.rancher.com/server-charts/latest || true" \
    "helm repo add jetstack https://charts.jetstack.io || true" \
    "helm repo update" \
    "helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set installCRDs=true || true" \
    "helm install rancher rancher-latest/rancher --namespace cattle-system --create-namespace --set hostname=${rancher_host} --set replicas=1 --set bootstrapPassword=admin || true"

  ok "K3s + Rancher install sent to EC2"
  log "Open https://${rancher_host} and change the bootstrap password"
  log "Copy kubeconfig: sudo cat /etc/rancher/k3s/k3s.yaml on the instance"
}

cmd_helm() {
  phase "Helm install AuthEngine"
  require_cmd helm
  require_cmd kubectl
  if [[ ! -f "${HELM_VALUES_FILE}" ]]; then
    err "Create ${HELM_VALUES_FILE} from values.yaml with production secrets"
    exit 1
  fi
  if ! confirm "helm upgrade --install authengine (namespace: ${HELM_NAMESPACE})?"; then
    return 0
  fi
  helm upgrade --install authengine "${HELM_DIR}" \
    --namespace "${HELM_NAMESPACE}" \
    --create-namespace \
    -f "${HELM_VALUES_FILE}" \
    --set seed.enabled=true \
    --set seed.runOnUpgrade=true
  kubectl get pods,jobs -n "${HELM_NAMESPACE}"
  ok "Helm release deployed"
}

cmd_verify() {
  verify_endpoints
}

cmd_all() {
  log "AuthEngine cloud VM deployment (AWS Terraform)"
  cmd_specs
  check_terraform_prereqs
  cmd_plan
  if confirm "Terraform apply?"; then
    TF_AUTO_APPROVE=1 cmd_apply
  fi
  cmd_dns
  if command -v aws >/dev/null 2>&1 && aws_cli sts get-caller-identity >/dev/null 2>&1; then
    if confirm "Install K3s + Rancher on EC2 via SSM?"; then
      cmd_k3s
    fi
  else
    warn "AWS CLI not configured — install K3s manually on the VM (see docs)"
  fi
  if confirm "Helm install (requires kubectl context)?"; then
    cmd_helm
  fi
  if confirm "Verify endpoints?"; then
    cmd_verify
  fi
  print_oauth_checklist
  ok "Cloud deployment walk-through complete"
}

usage() {
  cat <<EOF
Usage: $(basename "$0") <command>

Commands:
  specs     Hardware requirements + cloud notes
  plan      Terraform fmt, init, validate, plan
  apply     Terraform apply
  dns       DNS A record checklist
  k3s       Install K3s + Rancher on EC2 via AWS SSM
  helm      Helm upgrade --install AuthEngine (local kubectl)
  verify    Curl public endpoints
  all       Interactive full walk-through

Environment: TF_DIR TFVARS_FILE HELM_NAMESPACE HELM_VALUES_FILE AWS_PROFILE

Docs: https://docs.authengine.org/deployment/#cloud-vm-aws-or-any-provider
EOF
}

main() {
  local cmd="${1:-help}"
  shift || true
  case "${cmd}" in
    specs) cmd_specs ;;
    plan) cmd_plan ;;
    apply) cmd_apply ;;
    dns) cmd_dns ;;
    k3s) cmd_k3s ;;
    helm) cmd_helm ;;
    verify) cmd_verify ;;
    all) cmd_all ;;
    help|-h|--help) usage ;;
    *) err "Unknown command: ${cmd}"; usage; exit 1 ;;
  esac
}

main "$@"
