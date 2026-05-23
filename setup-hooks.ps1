# Run this ONCE to activate automatic SSL fix before every push
git config core.hooksPath .git-hooks
Write-Host "Git hooks activated! SSL will be fixed automatically on every push." -ForegroundColor Green
