data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  name                   = "${var.project_name}-${var.environment}"
  availability_zones     = slice(data.aws_availability_zones.available.names, 0, 2)
  frontend_image         = "${aws_ecr_repository.frontend.repository_url}:${var.frontend_image_tag}"
  backend_image          = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
  frontend_origin        = var.frontend_url_override != "" ? var.frontend_url_override : "${local.listener_scheme}://${aws_lb.application.dns_name}"
  listener_scheme        = var.acm_certificate_arn != "" ? "https" : "http"
  docdb_secret_arn       = aws_secretsmanager_secret.docdb.arn
  service_discovery_fqdn = "${aws_service_discovery_service.backend.name}.${aws_service_discovery_private_dns_namespace.application.name}"
  common_environment = [
    {
      name  = "PORT"
      value = "4000"
    },
    {
      name  = "FRONTEND_URL"
      value = local.frontend_origin
    },
    {
      name  = "JWT_EXPIRE"
      value = "1d"
    },
    {
      name  = "COOKIE_EXPIRE"
      value = "1"
    },
    {
      name  = "COOKIE_SECURE"
      value = tostring(var.acm_certificate_arn != "")
    },
    {
      name  = "DOCDB_HOST"
      value = aws_docdb_cluster.application.endpoint
    },
    {
      name  = "DOCDB_USER"
      value = aws_docdb_cluster.application.master_username
    },
  ]
}

resource "aws_vpc" "application" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${local.name}-vpc"
  }
}

resource "aws_internet_gateway" "application" {
  vpc_id = aws_vpc.application.id

  tags = {
    Name = "${local.name}-igw"
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.application.id
  cidr_block              = "10.20.${count.index}.0/24"
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name}-public-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.application.id
  cidr_block        = "10.20.${count.index + 10}.0/24"
  availability_zone = local.availability_zones[count.index]

  tags = {
    Name = "${local.name}-private-${count.index + 1}"
  }
}

resource "aws_subnet" "database" {
  count             = 2
  vpc_id            = aws_vpc.application.id
  cidr_block        = "10.20.${count.index + 20}.0/24"
  availability_zone = local.availability_zones[count.index]

  tags = {
    Name = "${local.name}-database-${count.index + 1}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.application.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.application.id
  }

  tags = {
    Name = "${local.name}-public"
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${local.name}-nat"
  }
}

resource "aws_nat_gateway" "application" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  depends_on = [aws_internet_gateway.application]

  tags = {
    Name = "${local.name}-nat"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.application.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.application.id
  }

  tags = {
    Name = "${local.name}-private"
  }
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.application.id

  tags = {
    Name = "${local.name}-database-isolated"
  }
}

resource "aws_route_table_association" "database" {
  count          = 2
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

resource "aws_security_group" "load_balancer" {
  name        = "${local.name}-alb"
  description = "Public HTTP(S) ingress to the application load balancer"
  vpc_id      = aws_vpc.application.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = var.acm_certificate_arn != "" ? [1] : []
    content {
      description = "HTTPS"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "frontend" {
  name        = "${local.name}-frontend"
  description = "Frontend tasks accept traffic only from the load balancer"
  vpc_id      = aws_vpc.application.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.load_balancer.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "backend" {
  name        = "${local.name}-backend"
  description = "Backend tasks accept traffic only from the frontend service"
  vpc_id      = aws_vpc.application.id

  ingress {
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "database" {
  name        = "${local.name}-database"
  description = "DocumentDB accepts connections only from backend tasks"
  vpc_id      = aws_vpc.application.id

  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  egress = []
}

resource "aws_docdb_subnet_group" "application" {
  name       = local.name
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name = "${local.name}-docdb-subnets"
  }
}

resource "aws_docdb_cluster" "application" {
  cluster_identifier              = local.name
  engine                          = "docdb"
  master_username                 = "lookjobber_admin"
  master_password                 = random_password.docdb.result
  db_subnet_group_name            = aws_docdb_subnet_group.application.name
  vpc_security_group_ids          = [aws_security_group.database.id]
  storage_encrypted               = true
  backup_retention_period         = 7
  preferred_backup_window         = "07:00-09:00"
  preferred_maintenance_window    = "sun:09:00-sun:10:00"
  deletion_protection             = var.environment == "production"
  skip_final_snapshot             = var.environment != "production"
  enabled_cloudwatch_logs_exports = ["audit", "profiler"]

  tags = {
    Name = "${local.name}-docdb"
  }
}

resource "random_password" "docdb" {
  length  = 40
  special = false
}

resource "aws_secretsmanager_secret" "docdb" {
  name                    = "${local.name}/docdb-credentials"
  recovery_window_in_days = var.environment == "production" ? 30 : 0
}

resource "aws_secretsmanager_secret_version" "docdb" {
  secret_id = aws_secretsmanager_secret.docdb.id
  secret_string = jsonencode({
    username = aws_docdb_cluster.application.master_username
    password = random_password.docdb.result
  })
}

resource "aws_docdb_cluster_instance" "application" {
  count              = var.docdb_instance_count
  identifier         = "${local.name}-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.application.id
  instance_class     = var.docdb_instance_class
  engine             = aws_docdb_cluster.application.engine
  promotion_tier     = count.index

  tags = {
    Name = "${local.name}-docdb-${count.index + 1}"
  }
}

resource "aws_service_discovery_private_dns_namespace" "application" {
  name = "lookjobber.internal"
  vpc  = aws_vpc.application.id
}

resource "aws_service_discovery_service" "backend" {
  name = "backend"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.application.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${local.name}-frontend"
  image_tag_mutability = "IMMUTABLE"
  force_delete         = var.environment != "production"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "backend" {
  name                 = "${local.name}-backend"
  image_tag_mutability = "IMMUTABLE"
  force_delete         = var.environment != "production"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecs_cluster" "application" {
  name = local.name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${local.name}/frontend"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.name}/backend"
  retention_in_days = 30
}

resource "aws_iam_role" "task_execution" {
  name = "${local.name}-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "read_database_secret" {
  name = "${local.name}-read-docdb-secret"
  role = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = local.docdb_secret_arn
    }]
  })
}

resource "aws_iam_role_policy" "read_jwt_secret" {
  name = "${local.name}-read-jwt-secret"
  role = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = aws_secretsmanager_secret.jwt.arn
    }]
  })
}

resource "random_password" "jwt" {
  length           = 48
  special          = true
  override_special = "-_=+@"
}

resource "aws_secretsmanager_secret" "jwt" {
  name                    = "${local.name}/jwt-signing-key"
  recovery_window_in_days = var.environment == "production" ? 30 : 0
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id     = aws_secretsmanager_secret.jwt.id
  secret_string = random_password.jwt.result
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "${local.name}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.task_execution.arn

  container_definitions = jsonencode([{
    name      = "frontend"
    image     = local.frontend_image
    essential = true
    portMappings = [{
      containerPort = 80
      protocol      = "tcp"
    }]
    environment = [
      {
        name  = "BACKEND_HOST"
        value = local.service_discovery_fqdn
      },
      {
        name  = "NGINX_RESOLVER"
        value = "169.254.169.253"
      }
    ]
    healthCheck = {
      command     = ["CMD-SHELL", "wget -q -O /dev/null http://127.0.0.1/ || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 10
    }
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.frontend.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "frontend"
      }
    }
  }])
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.task_execution.arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = local.backend_image
    essential = true
    portMappings = [{
      containerPort = 4000
      protocol      = "tcp"
    }]
    environment = local.common_environment
    secrets = [
      {
        name      = "DOCDB_PASSWORD"
        valueFrom = "${local.docdb_secret_arn}:password::"
      },
      {
        name      = "JWT_SECRET_KEY"
        valueFrom = aws_secretsmanager_secret.jwt.arn
      }
    ]
    healthCheck = {
      command     = ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:4000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))\""]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.backend.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "backend"
      }
    }
  }])
}

resource "aws_lb" "application" {
  name               = local.name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.load_balancer.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.environment == "production"
}

resource "aws_lb_target_group" "frontend" {
  name        = "${local.name}-frontend"
  port        = 80
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.application.id

  health_check {
    enabled             = true
    path                = "/"
    matcher             = "200-399"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.application.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = var.acm_certificate_arn == "" ? "forward" : "redirect"
    target_group_arn = var.acm_certificate_arn == "" ? aws_lb_target_group.frontend.arn : null

    dynamic "redirect" {
      for_each = var.acm_certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }
}

resource "aws_lb_listener" "https" {
  count             = var.acm_certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.application.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = var.acm_certificate_arn
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

resource "aws_ecs_service" "frontend" {
  name            = "frontend"
  cluster         = aws_ecs_cluster.application.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.frontend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 80
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.task_execution,
    aws_iam_role_policy.read_database_secret,
    aws_iam_role_policy.read_jwt_secret
  ]
}

resource "aws_ecs_service" "backend" {
  name            = "backend"
  cluster         = aws_ecs_cluster.application.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.backend.arn
  }

  depends_on = [
    aws_iam_role_policy_attachment.task_execution,
    aws_iam_role_policy.read_database_secret,
    aws_iam_role_policy.read_jwt_secret,
    aws_docdb_cluster_instance.application
  ]
}

resource "aws_appautoscaling_target" "backend" {
  max_capacity       = var.backend_max_capacity
  min_capacity       = var.backend_min_capacity
  resource_id        = "service/${aws_ecs_cluster.application.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "${local.name}-backend-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 60
    scale_in_cooldown  = 180
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${local.name}-alb-5xx"
  alarm_description   = "Application load balancer is returning elevated 5xx responses."
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 2
  threshold           = 10
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.application.arn_suffix
  }
}
