param(
    [string]$Region = "us-east-1",
    [string]$Environment = "demo",
    [string]$TerraformDirectory = (Join-Path $PSScriptRoot "terraform"),
    [string]$ImageTag = (Get-Date -Format "yyyyMMddHHmmss")
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$previousLocation = Get-Location

try {
    Set-Location $TerraformDirectory

    terraform init
    if ($LASTEXITCODE -ne 0) {
        throw "Terraform initialization failed."
    }

    terraform apply `
        -var="aws_region=$Region" `
        -var="environment=$Environment" `
        -target=aws_ecr_repository.frontend `
        -target=aws_ecr_repository.backend
    if ($LASTEXITCODE -ne 0) {
        throw "ECR repository provisioning failed."
    }

    $frontendRepository = terraform output -raw frontend_ecr_repository_url
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to read the frontend ECR repository URL from Terraform."
    }
    $backendRepository = terraform output -raw backend_ecr_repository_url
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to read the backend ECR repository URL from Terraform."
    }
    $accountId = aws sts get-caller-identity --query Account --output text

    if ($LASTEXITCODE -ne 0) {
        throw "Unable to identify the active AWS account. Configure AWS credentials and retry."
    }

    $registry = "$accountId.dkr.ecr.$Region.amazonaws.com"
    $loginPassword = aws ecr get-login-password --region $Region
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to obtain an ECR login token."
    }
    $loginPassword | docker login --username AWS --password-stdin $registry
    $loginPassword = $null
    if ($LASTEXITCODE -ne 0) {
        throw "ECR login failed."
    }

    Set-Location $repoRoot
    docker build --platform linux/amd64 -t "${frontendRepository}:$ImageTag" .\frontend
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend image build failed."
    }
    docker push "${frontendRepository}:$ImageTag"
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend image push failed."
    }

    docker build --platform linux/amd64 -t "${backendRepository}:$ImageTag" .\backend
    if ($LASTEXITCODE -ne 0) {
        throw "Backend image build failed."
    }
    docker push "${backendRepository}:$ImageTag"
    if ($LASTEXITCODE -ne 0) {
        throw "Backend image push failed."
    }

    Set-Location $TerraformDirectory
    terraform apply `
        -var="aws_region=$Region" `
        -var="environment=$Environment" `
        -var="frontend_image_tag=$ImageTag" `
        -var="backend_image_tag=$ImageTag"

    if ($LASTEXITCODE -ne 0) {
        throw "Terraform deployment failed. Review the Terraform output and AWS service events."
    }

    $applicationUrl = terraform output -raw application_url
    if ($LASTEXITCODE -ne 0) {
        throw "Deployment completed but the application URL could not be read from Terraform."
    }
    Write-Host "Deployment URL: $applicationUrl"
    Write-Host "Image tag: $ImageTag"
}
finally {
    Set-Location $previousLocation
}
