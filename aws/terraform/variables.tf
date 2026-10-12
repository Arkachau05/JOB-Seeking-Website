variable "aws_region" {
  description = "AWS region in which to deploy the application."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short name used to identify resources."
  type        = string
  default     = "lookjobber"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,18}$", var.project_name))
    error_message = "project_name must be 3-19 lowercase letters, digits, or hyphens and start with a letter."
  }
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "demo"

  validation {
    condition     = contains(["demo", "staging", "production"], var.environment)
    error_message = "environment must be demo, staging, or production."
  }
}

variable "frontend_image_tag" {
  description = "Immutable tag of the frontend image already pushed to ECR."
  type        = string
  default     = "latest"
}

variable "backend_image_tag" {
  description = "Immutable tag of the backend image already pushed to ECR."
  type        = string
  default     = "latest"
}

variable "acm_certificate_arn" {
  description = "Existing ACM certificate ARN for HTTPS. Leave empty for an HTTP-only demo."
  type        = string
  default     = ""
}

variable "frontend_url_override" {
  description = "Optional browser origin for CORS, such as a custom HTTPS domain."
  type        = string
  default     = ""
}

variable "docdb_instance_class" {
  description = "Amazon DocumentDB instance type. Use a supported class in the selected region."
  type        = string
  default     = "db.t3.medium"
}

variable "docdb_instance_count" {
  description = "Number of DocumentDB instances. Use at least two for failover."
  type        = number
  default     = 2

  validation {
    condition     = var.docdb_instance_count >= 1 && var.docdb_instance_count <= 3
    error_message = "docdb_instance_count must be between 1 and 3."
  }
}

variable "backend_min_capacity" {
  description = "Minimum backend task count for autoscaling."
  type        = number
  default     = 2
}

variable "backend_max_capacity" {
  description = "Maximum backend task count for autoscaling."
  type        = number
  default     = 6
}
