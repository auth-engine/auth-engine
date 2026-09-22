output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "ec2_public_ip" {
  description = "Elastic IP for API server — point api.<domain> DNS here (or via Cloudflare)"
  value       = aws_eip.api.public_ip
}

output "ec2_instance_id" {
  description = "EC2 instance ID (for SSM Session Manager)"
  value       = aws_instance.api.id
}

output "ssm_session_command" {
  description = "AWS CLI command to connect to the instance with Session Manager"
  value       = "aws ssm start-session --target ${aws_instance.api.id}"
}
