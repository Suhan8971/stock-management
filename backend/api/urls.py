from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, ItemViewSet, ItemTotalViewSet, UserViewSet, 
    TransactionViewSet, TransactionLogViewSet, BookingViewSet,
    trace_items_list, trace_item_detail
)
router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'items', ItemViewSet)
router.register(r'item_totals', ItemTotalViewSet)
router.register(r'users', UserViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'transactionlogs', TransactionLogViewSet)
router.register(r'bookings', BookingViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('trace/items/', trace_items_list, name='trace-items-list'),
    path('trace/items/<int:item_id>/', trace_item_detail, name='trace-item-detail'),
]
