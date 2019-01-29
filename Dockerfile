FROM nginx:stable
COPY ./app/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80

ARG API_VERSION

LABEL apiVersion=$API_VERSION
