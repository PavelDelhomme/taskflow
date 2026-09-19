FROM nginx:1.27-alpine
COPY web/ /usr/share/nginx/html/
COPY deploy/nginx-3003.conf /etc/nginx/conf.d/default.conf
EXPOSE 3003
