from django.db import models

class Project(models.Model):
    project_id = models.AutoField(primary_key=True)
    project_name = models.CharField(max_length=255)

    class Meta:
        managed = True
        db_table = 'project'

class ItemTotal(models.Model):
    item_total_id = models.AutoField(primary_key=True)
    item_name = models.CharField(max_length=255, unique=True)
    category = models.CharField(max_length=100, default='')

    @property
    def total_quantity(self):
        from .models import Item
        return Item.objects.filter(item_name__iexact=self.item_name).count()

    @property
    def booked_quantity(self):
        active_bookings = self.bookings.filter(status='active')
        return sum(b.quantity for b in active_bookings)

    @property
    def available_quantity(self):
        total = self.total_quantity
        issued = sum(t.quantity for t in self.transaction_set.filter(status='active'))
        return total - issued - self.booked_quantity

    class Meta:
        managed = True
        db_table = 'item_totals'

class Item(models.Model):
    item_id = models.AutoField(primary_key=True)
    item_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    date = models.DateField(null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'items'

class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, unique=True)
    role = models.CharField(max_length=1)
    project = models.ForeignKey(Project, on_delete=models.DO_NOTHING, db_column='project_id')

    class Meta:
        managed = True
        db_table = 'users'

class Booking(models.Model):
    booking_id = models.AutoField(primary_key=True)
    event_name = models.CharField(max_length=255)
    item = models.ForeignKey(ItemTotal, on_delete=models.CASCADE, db_column='item_total_id', related_name='bookings')
    quantity = models.IntegerField()
    from_date = models.DateField()
    to_date = models.DateField()
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    allocated_items = models.ManyToManyField(Item, related_name='bookings', blank=True)

    class Meta:
        managed = True
        db_table = 'bookings'

class Transaction(models.Model):
    transaction_id = models.AutoField(primary_key=True)
    item = models.ForeignKey(ItemTotal, on_delete=models.CASCADE, db_column='item_total_id')
    from_user = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column='from_user_id', related_name='from_transactions', null=True, blank=True)
    to_user_id = models.CharField(max_length=255, db_column='to_user_id')
    quantity = models.IntegerField()
    transaction_type = models.CharField(max_length=1)
    issued_date = models.DateField()
    expected_return_date = models.DateField(null=True, blank=True)
    actual_return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50)
    user_type = models.CharField(max_length=50, default='other')
    created_by = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column='created_by', related_name='created_transactions')
    created_at = models.DateTimeField(auto_now_add=True)
    allocated_items = models.ManyToManyField(Item, related_name='transactions', blank=True)

    class Meta:
        managed = True
        db_table = 'transactions'

class TransactionLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, db_column='transaction_id')
    action = models.CharField(max_length=100)
    action_by = models.ForeignKey(User, on_delete=models.DO_NOTHING, db_column='action_by')
    timestamp = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(null=True, blank=True)

    class Meta:
        managed = True
        db_table = 'transactionlogs'
