terragrunt = {
    terraform {
        source = "git::git@github.com:Advanon/advanon-infrastructure.git//terraform/modules/cicd/serverless?ref=tags/v0.1.15"
    }
}

project_name = "advanext-spa"
