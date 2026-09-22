#!/bin/bash
set -euo pipefail

dnf update -y

dnf install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl restart amazon-ssm-agent

touch /opt/${project_name}-ready
