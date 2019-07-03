STAGE ?= staging
STACK_NAME = main-app-spa-resources-$(STAGE)
BUCKET_REGION ?= eu-central-1
BUCKET_KEY_PREFIX ?= advanext-spa

usage:              ## Show this help
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

create-resources:   ## Create resources in AWS account
	stack_exists="$$(aws cloudformation describe-stack-resources --stack-name $(STACK_NAME) > /dev/null && echo true)"; \
		cmd=create-stack; if [ "$$stack_exists" = "true" ]; then cmd=update-stack; fi; \
		aws cloudformation $$cmd --stack-name $(STACK_NAME) --parameters ParameterKey=Environment,ParameterValue=$(STAGE) \
			--template-body file://config/aws/resources.cf.yml

deploy:             ## Deploy the latest version of the code to AWS
	@branch=$$(echo "$$CODEBUILD_WEBHOOK_HEAD_REF" | sed 's:^refs/heads/::' | sed 's:[_/]:-:g' | awk '{print tolower($$0)}'); \
		echo "Using branch name '$$branch' (extracted from CODEBUILD_WEBHOOK_HEAD_REF '$$CODEBUILD_WEBHOOK_HEAD_REF')"; \
		envName=staging; \
		if [ "$$STAGE" = "prod" ]; then envName=production; fi; \
		if [ "$$branch" = "" ]; then branch=$$envName; fi; \
		echo "Creating a new build for environment '$$STAGE'"; \
		yarn build && \
		SOURCE_VERSION=$$branch make publish-s3 && \
		if [ "$$branch" = "staging" ] || [ "$$branch" = "production" ] || [ "$$FORCE_DEPLOY" = "1" ]; then \
			echo "Triggering deployment of SPA artifacts to S3/CloudFront, branch $$branch, env $$STAGE" && \
			SOURCE_VERSION=$$branch make release-cloudfront; \
		fi

publish-s3:         ## Publish build artifacts to S3
	make publish-s3-separate

# Publish to S3, into a separate bucket per build
publish-s3-separate:
	@test "$(SOURCE_VERSION)" != "" || (echo 'Please specify a unique source version via $$SOURCE_VERSION'; exit 1)
	@bucket_name=$(BUCKET_KEY_PREFIX)-$(SOURCE_VERSION); \
		bucket_policy=$$(mktemp); \
		cp config/aws/s3-public-read-policy.json $$bucket_policy; \
		sed -i "s/__BUCKET_NAME__/$$bucket_name/" $$bucket_policy; \
		aws s3 mb s3://$$bucket_name; \
		aws s3api put-bucket-website --bucket $$bucket_name --website-configuration file://config/aws/s3-website-config.json; \
		aws s3api put-bucket-policy --bucket $$bucket_name --policy file://$$bucket_policy; \
		aws s3 sync --quiet build/ s3://$$bucket_name/

release-cloudfront: ## Release to CloudFront (Do NOT call this from your local machine)
	make do-release-cloudfront; echo TODO fix this

do-release-cloudfront:
	@test "$(SOURCE_VERSION)" != "" || (echo 'Please specify a unique source version via $$SOURCE_VERSION'; exit 1)
	@TMP_FILE="$$(mktemp)"; \
		CLOUDFRONT_DISTRIBUTION_ID=$$(aws cloudformation describe-stacks --stack-name $(STACK_NAME) \
			--query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionID'].OutputValue" --output text); \
		test "$$CLOUDFRONT_DISTRIBUTION_ID" != "" || (echo 'Unable to find CloudFrontDistributionID in stack $(STACK_NAME)'; exit 1); \
		echo "Getting config for CloudFront distribution '$$CLOUDFRONT_DISTRIBUTION_ID'"; \
		aws cloudfront get-distribution-config --id "$$CLOUDFRONT_DISTRIBUTION_ID" | jq '.DistributionConfig' > $$TMP_FILE; \
		etag=$$(aws cloudfront get-distribution-config --id "$$CLOUDFRONT_DISTRIBUTION_ID" | jq -r '.ETag'); \
		bucket_host=$(BUCKET_KEY_PREFIX)-$(SOURCE_VERSION).s3.$(BUCKET_REGION).amazonaws.com; \
		sed -i 's|.*"DomainName".*|"DomainName": "'$$bucket_host'",|' $$TMP_FILE; \
		echo "Updating CloudFront distribution '$$CLOUDFRONT_DISTRIBUTION_ID'"; \
		aws cloudfront update-distribution --id "$$CLOUDFRONT_DISTRIBUTION_ID" --distribution-config file://$$TMP_FILE --if-match $$etag; \
		aws cloudfront create-invalidation --distribution-id "$$CLOUDFRONT_DISTRIBUTION_ID" --paths /

.PHONY: usage deploy docker-build create-resources publish-s3 release-cloudfront
