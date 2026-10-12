param(
    [Parameter(Mandatory = $true)]
    [string]$BaseUrl
)

$ErrorActionPreference = "Stop"
$base = $BaseUrl.TrimEnd("/")

$homeResponse = Invoke-WebRequest -Uri "$base/" -Method Get -UseBasicParsing
if ($homeResponse.StatusCode -ne 200 -or $homeResponse.Content -notmatch "LookJobber") {
    throw "Frontend health check failed."
}

$jobs = Invoke-RestMethod -Uri "$base/api/v1/job/getall" -Method Get
if (-not $jobs.success -or $null -eq $jobs.jobs) {
    throw "Jobs API did not return the expected success/jobs response."
}

Write-Host "PASS: frontend returned HTTP $($homeResponse.StatusCode)"
Write-Host "PASS: jobs API returned $($jobs.jobs.Count) live job(s)"
