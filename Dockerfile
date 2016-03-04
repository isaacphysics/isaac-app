FROM nginx:1.9.11
COPY ./dist/app/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
