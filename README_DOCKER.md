# Deploying with Docker

To build the isaac-app container:

```
docker build -t isaac-app .
```

To test it, you'll want to forward port 80:

```
docker run --name isaac-app1 -p 80:80 isaac-app
```
