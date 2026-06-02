FROM python:3.10-slim
WORKDIR /app

# Flask ve Flask-CORS kütüphanelerini Docker imajının içine kuruyoruz
RUN pip install --no-cache-dir flask flask-cors

COPY . .
EXPOSE 5000
CMD ["python", "app.py"]