from rest_framework import serializers
from .models import Project, Item, ItemTotal, User, Transaction, TransactionLog, Booking

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

class ItemTotalSerializer(serializers.ModelSerializer):
    total_quantity = serializers.SerializerMethodField()
    available_quantity = serializers.SerializerMethodField()
    booked_quantity = serializers.SerializerMethodField()

    class Meta:
        model = ItemTotal
        fields = '__all__'

    def get_total_quantity(self, obj):
        return obj.total_quantity

    def get_booked_quantity(self, obj):
        return obj.booked_quantity

    def get_available_quantity(self, obj):
        return obj.available_quantity

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

class TransactionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionLog
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.item_name', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
