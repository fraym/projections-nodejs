# Development

You'll need the following apps for a smooth development experience:

-   minikube
-   lens
-   okteto
-   helm

## Running the dev environment

-   Start minikube if not already done:

```shell
minikube start
```

-   add mongodb and minio to your lokal kubernetes
    -   use Makefiles in `./.dev/*`
-   copy `.env.build` to `.env.build.local`
    -   add your personal access token (needs read access for private fraym org repositories)
-   start the dev container

```
make dev
```

-   connect your IDE to that okteto instance
