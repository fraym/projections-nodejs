help: ## Show this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"; printf "\Targets:\n"} /^[$$()% a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m	 %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

dev: ## Runs the projections-nodejs dev environment on the minikube cluster
	kubectl apply -f .k8s/1-service.yml
	kubectl apply -f .k8s/2-deployment.yml
	okteto up -n fraym -f .okteto.yml

dev-stop: ## Removes the projections-nodejs services dev environment from the minikube cluster
	okteto down -n fraym -f .okteto.yml
	kubectl delete -f .k8s/2-deployment.yml
	kubectl delete -f .k8s/1-service.yml

.PHONY: lint
lint: ## Run linters
	npm run format
	npm run lint
