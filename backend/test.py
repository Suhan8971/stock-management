import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'transactions';")
for row in cursor.fetchall():
    print(row)
