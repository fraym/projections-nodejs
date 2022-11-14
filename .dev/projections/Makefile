.PHONY: help
help: ## Show this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"; printf "\Targets:\n"} /^[$$()% a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m	 %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

.PHONY: init
init: ## Initializes the projections service on the minikube cluster
	./docker-login.sh
	docker pull 067475952430.dkr.ecr.eu-central-1.amazonaws.com/fraym/projections:latest
	minikube image rm 067475952430.dkr.ecr.eu-central-1.amazonaws.com/fraym/projections:latest
	minikube image load 067475952430.dkr.ecr.eu-central-1.amazonaws.com/fraym/projections:latest

	kubectl apply -f .k8s/0-namespace.yml
	kubectl apply -f .k8s/1-configmap.yml
	kubectl apply -f .k8s/2-service.yml
	kubectl apply -f .k8s/3-deployment.yml

.PHONY: update
update: ## Updates the projections service on the minikube cluster
	make clean
	make init

.PHONY: clean
clean: ## Removes the projections service from the minikube cluster
	kubectl delete -f .k8s/3-deployment.yml
	kubectl delete -f .k8s/2-service.yml
	kubectl delete -f .k8s/1-configmap.yml
	kubectl delete -f .k8s/0-namespace.yml
