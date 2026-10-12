output "application_url" {
  description = "Public application URL. Add a DNS record and ACM certificate for production."
  value       = "${local.listener_scheme}://${aws_lb.application.dns_name}"
}

output "load_balancer_dns_name" {
  description = "DNS name of the public application load balancer."
  value       = aws_lb.application.dns_name
}

output "frontend_ecr_repository_url" {
  description = "Push the frontend image to this ECR repository."
  value       = aws_ecr_repository.frontend.repository_url
}

output "backend_ecr_repository_url" {
  description = "Push the backend image to this ECR repository."
  value       = aws_ecr_repository.backend.repository_url
}

output "documentdb_endpoint" {
  description = "Private DocumentDB cluster endpoint."
  value       = aws_docdb_cluster.application.endpoint
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.application.name
}

output "cloudwatch_backend_log_group" {
  description = "Backend application logs."
  value       = aws_cloudwatch_log_group.backend.name
}

output "docdb_master_secret_arn" {
  description = "Secrets Manager ARN for the generated DocumentDB administrator credential."
  value       = aws_secretsmanager_secret.docdb.arn
}
