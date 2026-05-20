import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Transaction, TransactionLog, Item, ItemTotal

# Deleting records
print("Flushing data...")
TransactionLog.objects.all().delete()
Transaction.objects.all().delete()
Item.objects.all().delete()
ItemTotal.objects.all().delete()
print("Successfully flushed all records from Transaction, TransactionLog, Item, and ItemTotal tables.")
