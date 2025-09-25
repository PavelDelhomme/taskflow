FROM python:3.11-slim

WORKDIR /app

# Copier requirements et installer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier TOUS les fichiers Python (même si on les utilise pas tous)
COPY main.py .
COPY database.py .
COPY auth_routes.py .
COPY tasks_routes.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]