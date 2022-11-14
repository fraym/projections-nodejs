.PHONY: help
help: ## Show this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"; printf "\Targets:\n"} /^[$$()% a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m	 %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

.PHONY: init
init: ##Initializes the minio helm chart on the minikube cluster
	kubectl apply -f .k8s/0-namespace.yml
	helm repo add bitnami https://charts.bitnami.com/bitnami
	helm install minio bitnami/minio -n minio -f .k8s/1-helm.yml

.PHONY: clean
clean: ##Removes the minio service from the minikube cluster
	helm delete minio -n minio
	kubectl delete -f .k8s/0-namespace.yml
