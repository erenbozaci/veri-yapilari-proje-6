FROM nginx:alpine
# index.html, game.js ve src klasörünü Nginx sunucusunun içine kopyalıyoruz
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]