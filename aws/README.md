# AWS deployment and assessment guide

This guide maps the LookJobber project to the cloud-project marking rubric. It
uses the existing React/Vite, Express, MongoDB/Mongoose, and Docker codebase;
it does not replace the application stack.

## 1. Problem analysis and cloud design (2 marks)

### Problem

Job seekers need to browse job opportunities and manage applications. Employers
need to publish jobs and review applicants. The application also needs secure
sign-in, resume handling, persistent records, and a way to scale web/API
traffic independently.

### Requirements addressed

- Serve the React single-page app and Express REST API in separate containers.
- Persist users, jobs, and applications outside replaceable application tasks.
- Route browser and API traffic through one public endpoint.
- Keep database and backend services off the public internet.
- Keep signing and database credentials out of source code and image layers.
- Add repeatable deployment, health checks, logs, autoscaling, and a smoke test.

### Architecture and service model

```text
Browser
  │ HTTPS (ACM certificate) / HTTP (demo only)
  ▼
Application Load Balancer (public subnets, 2 AZs)
  ▼
Frontend ECS/Fargate service (private subnets, 2 tasks)
  ├── static React app served by Nginx
  └── /api/* reverse proxy through AWS Cloud Map
          ▼
      Backend ECS/Fargate service (private subnets, 2–6 autoscaled tasks)
          ├── Amazon DocumentDB (isolated DB subnets, TLS, backups)
          ├── AWS Secrets Manager (DocDB password and JWT signing key)
          └── Amazon CloudWatch (logs, Container Insights, ALB alarm)
Images: Docker → Amazon ECR (scan-on-push enabled)
Private task egress: one NAT Gateway for ECR, package/image pulls, and AWS APIs
```

| Model | Project service | Reason |
| --- | --- | --- |
| IaaS | VPC, subnets, route tables, security groups, NAT, EIP | Explicitly demonstrates network segmentation and controlled ingress/egress. |
| PaaS | ECS Fargate, ALB, ECR, DocumentDB, Secrets Manager, CloudWatch | AWS operates the container hosts, database engine infrastructure, load balancer, secret storage, and monitoring. |
| SaaS | Cloudinary (optional existing resume upload integration) | Managed third-party resume/media service; credentials remain backend-only. |

The database selection is Amazon DocumentDB because the existing application
uses Mongoose/MongoDB. It is MongoDB-compatible, not an identical MongoDB
server; test every query and Mongoose feature used by this project before
production. The configuration enables TLS and uses the AWS global RDS CA
bundle.

## 2. Implementation and technical execution (8 marks)

### What is provisioned

Terraform in `aws/terraform` creates:

- A VPC with two public ALB subnets, two private ECS subnets, and two isolated
  database subnets across two Availability Zones.
- A public ALB. If an ACM certificate ARN is supplied, HTTP redirects to HTTPS
  and the load balancer uses a TLS 1.3/1.2 policy.
- Separate frontend and backend ECR repositories with immutable tags and
  image scanning enabled.
- ECS Fargate services with two frontend tasks and two initial backend tasks.
  Backend task count scales from 2 to 6 on 60% average CPU.
- Private Cloud Map DNS so the frontend's Nginx proxy can find backend tasks.
- Encrypted Amazon DocumentDB with database credentials in Secrets Manager,
  seven-day backups, audit/profiler log exports, and two instances by default.
- Least-privilege security-group paths: Internet → ALB → frontend → backend →
  database. The database has no public route.
- A random JWT signing secret in Secrets Manager and CloudWatch log groups,
  Container Insights, and an ALB 5xx alarm.

### Prerequisites

- An AWS account, AWS CLI v2 credentials for a least-privilege deployment user,
  Terraform 1.6+, Docker Desktop/Engine, and PowerShell.
- Quota for Fargate, an Application Load Balancer, NAT Gateway, and DocumentDB.
- An ACM certificate in the same region as the ALB for a production HTTPS URL.
- A budget alert: the demo provisions billable resources, especially NAT Gateway,
  ALB, and DocumentDB instances.

### Deploy

Run PowerShell from the repository root. Inspect the Terraform plan before
approving it, particularly the region, instance count, and estimated cost.

```powershell
Copy-Item .\aws\terraform\terraform.tfvars.example .\aws\terraform\terraform.tfvars
# Edit terraform.tfvars. For production, configure acm_certificate_arn and environment.
.\aws\deploy.ps1 -Region us-east-1 -Environment demo
```

The script initializes Terraform, creates ECR repositories, builds and pushes
version-tagged Linux/AMD64 images, then applies the remaining infrastructure.
For a custom domain, set the matching ACM certificate ARN in
`terraform.tfvars`, create the DNS record pointing at the ALB, and set
`frontend_url_override` to the exact HTTPS origin. Review the proposed changes
before any apply; for real environments remove `-auto-approve` from the script
and approve the reviewed plan manually.

The script assumes the AWS account is already authenticated. It does not create
an AWS account, domain, or certificate, and this repository's implementation
does not claim a deployment has been executed.

### State, security, and operations

Terraform state contains infrastructure metadata and may contain sensitive
values. Before a team/production deployment, create a private S3 bucket with
versioning, encryption, and public-access blocks, then copy
`terraform/backend.tf.example` to `aws/terraform/backend.tf`, replace the
bucket/region values, and run `terraform init`. Never commit state, plans,
`terraform.tfvars`, credentials, or `.env` files. Restrict state access and
enable the bucket's encryption and recovery controls.

The ECS task role receives only the managed task-execution policy and
`GetSecretValue` permission for the two secrets it needs. Database ingress is
limited to backend tasks. In production use HTTPS, rotate credentials, enforce
MFA and short-lived AWS credentials, review ECR scan findings, set alarms and
budgets, and consider AWS WAF/rate limiting. The current JWT implementation
uses an HttpOnly cookie and does not return the token in JSON; HTTPS enables
the Secure cookie flag.

The backend production dependency tree was patched; `npm audit --omit=dev`
reports zero advisories. The full development dependency scan still reports
one high-severity `braces` advisory nested under `nodemon`/`chokidar`; the
advisory has no recommended fixed version, and forcing npm's suggested fix
would downgrade the development server. This dependency is excluded from the
production image. ECR scan-on-push is enabled, but image scanning could not be
completed in this environment because Trivy was unavailable.

Logs:

```powershell
aws logs tail /ecs/lookjobber-demo/backend --since 15m --follow --region us-east-1
aws ecs describe-services --cluster lookjobber-demo --services frontend backend --region us-east-1
```

Check CloudWatch alarms and ECS service events when a task fails health checks.
The Nginx frontend health check is `/`; backend readiness is `/health`.

### Verify the live deployment

```powershell
.\aws\smoke-test.ps1 -BaseUrl (terraform -chdir=aws/terraform output -raw application_url)
```

The smoke test verifies the application page and the `/api/v1/job/getall`
response shape. It reports observed results at execution time; it does not
invent a performance score. Test registration/login, role authorization,
posting, applying, and resume upload separately with non-production test data.

## 3. Results and technical evaluation (2 marks)

### Expected evaluation

| Measure | Target / method | Result |
| --- | --- | --- |
| Frontend availability | ALB routes only to healthy ECS frontend tasks; two tasks span two AZs. | Measure after deployment from the ALB URL. |
| API readiness | Backend `/health` requires a connected database; frontend smoke test checks the jobs API. | Measure using `aws/smoke-test.ps1` and ECS health. |
| Elasticity | Backend ECS service scales between 2 and 6 tasks at 60% average CPU. | Observe desired/running task count in ECS during a controlled load test. |
| Persistence | DocumentDB backups retained for 7 days; application tasks are replaceable. | Create a test record, replace a task, and confirm the record remains. |
| Security | TLS option, private subnets, security-group chaining, encrypted DB, and Secrets Manager. | Verify ACM/redirect, security groups, encrypted storage, and secret references in AWS. |
| Performance | Establish a baseline with a safe, controlled HTTP load test. | Record p50/p95 latency, error rate, and throughput; no runtime measurements have been collected yet. |

### Indicative cost (not an AWS quote)

An always-on deployment in `us-east-1` with two 0.25-vCPU/0.5-GiB frontend
tasks, two 0.5-vCPU/1-GiB backend tasks, two `db.t3.medium` DocumentDB
instances, one NAT Gateway, one ALB, modest logs, and low traffic is expected to
cost roughly **US$250–450 per month** before taxes, data transfer, support,
Cloudinary, and unusual usage. Prices and DocumentDB instance availability vary
by region and date; use the AWS Pricing Calculator with current settings before
deploying. NAT Gateway, DocumentDB, and ALB incur ongoing charges even when
idle. The single NAT Gateway is a demo cost compromise and a single-AZ egress
dependency; production availability may require one NAT Gateway per AZ, which
increases cost. A single DocumentDB instance reduces cost but removes database
instance failover and is not the configured default.

For a lower-cost classroom demo, destroy resources after evaluation and check
the AWS Cost Explorer/Billing dashboard. Do not leave the NAT Gateway,
DocumentDB instances, or ALB running unintentionally.

## Viva preparation (3 marks)

1. **Why ECS Fargate instead of EC2?** Fargate runs the Docker tasks without
   managing host instances or patching the container hosts. EC2 can be cheaper
   for steady, high utilization but adds host operations.
2. **Why split frontend and backend containers?** Each service can be deployed,
   monitored, secured, and scaled independently; backend tasks are not directly
   public.
3. **How is the database protected?** DocumentDB is in isolated subnets with
   no internet route; only backend-task security groups can connect on 27017.
   credentials are injected from Secrets Manager and traffic uses TLS. Terraform
   state includes generated secret values, so keep it encrypted and access
   controlled; state backend configuration is included as an example.
4. **What happens when load increases?** ECS target tracking scales backend
   tasks from two up to six based on average CPU. ALB distributes frontend
   requests; DocumentDB instances provide database failover, not unlimited
   write scaling.
5. **Why not store data in a container?** Fargate task storage is ephemeral.
   Users, jobs, and applications belong in persistent managed database storage.
6. **What is the HTTPS limitation?** HTTPS is enabled only after an ACM
   certificate ARN for a controlled domain is configured. The default
   HTTP-only mode is for a short demo, not production.
7. **What do the health checks prove?** `/` checks the frontend process and
   `/health` checks backend/database readiness. The separate smoke test also
   verifies an API response, but none of these alone prove full business-flow
   correctness or performance.
8. **How would you evaluate performance?** Use a controlled load test, capture
   p50/p95 latency, throughput, errors, CPU/memory and scaling events, then
   compare against a stated baseline and budget. No performance result should
   be claimed until the test is actually run.

## Destroy demo resources

After the evaluation, remove deployed resources to stop most ongoing charges:

```powershell
terraform -chdir=aws/terraform destroy -var="aws_region=us-east-1" -var="environment=demo"
```

Review the destroy plan first. Production deletion protection and secret
recovery windows are intentional safeguards and can prevent immediate teardown.
