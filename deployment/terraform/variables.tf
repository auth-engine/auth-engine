variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Prefix for resource names"
  type        = string
  default     = "authengine"
}

variable "environment" {
  description = "Environment label (staging, production)"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "ec2_instance_type" {
  description = "EC2 instance type (t4g.micro for free tier ARM)"
  type        = string
  default     = "t4g.micro"
}

variable "ec2_key_name" {
  description = "Optional EC2 SSH key pair name (leave empty to use SSM only)"
  type        = string
  default     = ""
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH to EC2 (your IP/32). Use empty string to disable SSH."
  type        = string
  default     = ""
}
