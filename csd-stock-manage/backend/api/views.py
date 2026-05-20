from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import Project, Item, ItemTotal, User, Transaction, TransactionLog, Booking
from .serializers import ProjectSerializer, ItemSerializer, ItemTotalSerializer, UserSerializer, TransactionSerializer, TransactionLogSerializer, BookingSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

def get_available_items_for_allocation(item_total, quantity, start_date, end_date):
    from django.db.models import Q
    from .models import Item

    all_items = Item.objects.filter(item_name__iexact=item_total.item_name)
    
    active_txn_items = Item.objects.filter(
        transactions__status='active'
    )
    
    overlapping_booking_items = Item.objects.filter(
        bookings__status='active',
        bookings__from_date__lte=end_date,
        bookings__to_date__gte=start_date
    )
    
    available_items = all_items.exclude(
        pk__in=active_txn_items.values('pk')
    ).exclude(
        pk__in=overlapping_booking_items.values('pk')
    ).order_by('item_id')
    
    allocated_list = list(available_items[:quantity])
    
    if len(allocated_list) < quantity:
        return None
        
    return allocated_list


class ItemTotalViewSet(viewsets.ModelViewSet):
    queryset = ItemTotal.objects.all()
    serializer_class = ItemTotalSerializer

    def list(self, request, *args, **kwargs):
        from django.utils import timezone
        from .models import Booking
        today = timezone.now().date()
        Booking.objects.filter(status='active', to_date__lt=today).update(status='released')
        return super().list(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        item_name = instance.item_name
        
        # Delete related Item history records
        Item.objects.filter(item_name__iexact=item_name).delete()
        
        return super().destroy(request, *args, **kwargs)

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

    def create(self, request, *args, **kwargs):
        item_name = request.data.get('item_name')
        category = request.data.get('category', '')
        date = request.data.get('date', None)
        
        try:
            quantity = int(request.data.get('total_quantity', 0))
        except (ValueError, TypeError):
            quantity = 0

        if item_name:
            new_item = None
            qty_to_create = quantity if quantity > 0 else 1
            for _ in range(qty_to_create):
                new_item = Item.objects.create(
                    item_name=item_name,
                    category=category,
                    date=date
                )

            # Find or insert into ItemTotal
            item_total, created = ItemTotal.objects.get_or_create(
                item_name__iexact=item_name,
                defaults={'item_name': item_name, 'category': category}
            )

            serializer = self.get_serializer(new_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return super().create(request, *args, **kwargs)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

    def get_system_user(self):
        project, _ = Project.objects.get_or_create(project_name="System Default Project")
        user, _ = User.objects.get_or_create(
            email="system@local", 
            defaults={'name': 'System User', 'role': 'S', 'project': project}
        )
        return user

    @action(detail=False, methods=['post'])
    def bulk_issue(self, request):
        user = self.get_system_user()
        items_data = request.data.get('items', [])
        
        user_type = request.data.get('user_type', 'other')
        if isinstance(user_type, str):
            user_type = user_type.lower()
            
        from_user_id_str = request.data.get('from_user_id')
        to_user_id_str = request.data.get('to_user_id')
        
        from_user = None
        if from_user_id_str:
            try:
                from_user = User.objects.get(pk=from_user_id_str)
            except User.DoesNotExist:
                pass
        
        from datetime import datetime
        from django.db import transaction as db_transaction

        item_totals_required = {}
        for req_item in items_data:
            item_id = req_item.get('item_id') # Note: this refers to item_total_id now
            try:
                quantity = int(req_item.get('quantity', 0))
            except (ValueError, TypeError):
                quantity = 0

            if not item_id or quantity <= 0:
                continue
            item_totals_required[item_id] = item_totals_required.get(item_id, 0) + quantity

        if not item_totals_required:
            return Response({'error': 'No valid items requested.'}, status=status.HTTP_400_BAD_REQUEST)

        transactions = []
        try:
            with db_transaction.atomic():
                # Validate quantities first
                for item_id, total_req_qty in item_totals_required.items():
                    item_total = ItemTotal.objects.select_for_update().get(pk=item_id)
                    if item_total.available_quantity < total_req_qty:
                        return Response(
                            {'error': f'Total requested quantity for {item_total.item_name} ({total_req_qty}) exceeds available stock ({item_total.available_quantity}).'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )

                # Process transactions since validation passed
                for req_item in items_data:
                    item_id = req_item.get('item_id')
                    try:
                        quantity = int(req_item.get('quantity', 0))
                    except (ValueError, TypeError):
                        quantity = 0

                    if not item_id or quantity <= 0:
                        continue
                        
                    item_total = ItemTotal.objects.get(pk=item_id)
                    
                    issued_date_str = req_item.get('issued_date')
                    expected_return_date_str = req_item.get('expected_return_date')
                    
                    item_issued_date = timezone.now().date()
                    if issued_date_str:
                        try:
                            item_issued_date = datetime.strptime(issued_date_str, '%Y-%m-%d').date()
                        except ValueError:
                            pass
                            
                    item_expected_return_date = item_issued_date
                    if expected_return_date_str:
                        try:
                            item_expected_return_date = datetime.strptime(expected_return_date_str, '%Y-%m-%d').date()
                        except ValueError:
                            pass

                    # Allocate items
                    allocated = get_available_items_for_allocation(item_total, quantity, item_issued_date, item_expected_return_date)
                    if not allocated:
                        db_transaction.set_rollback(True)
                        return Response({'error': f'Not enough unallocated instances of {item_total.item_name} for the selected dates.'}, status=status.HTTP_400_BAD_REQUEST)

                    transaction = Transaction.objects.create(
                        item=item_total,
                        from_user=from_user,
                        to_user_id=to_user_id_str,
                        created_by=user,
                        quantity=quantity,
                        transaction_type='I',
                        issued_date=item_issued_date,
                        expected_return_date=item_expected_return_date,
                        status='active',
                        user_type=user_type
                    )
                    transaction.allocated_items.set(allocated)
                    transactions.append(TransactionSerializer(transaction).data)
        except ItemTotal.DoesNotExist:
            return Response({'error': 'One or more items not found.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        return Response({'issued': transactions}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def return_item(self, request, pk=None):
        try:
            transaction = self.get_object()
            if transaction.status == 'active':
                transaction.status = 'returned'
                transaction.actual_return_date = timezone.now().date()
                transaction.save()
                
            return Response(TransactionSerializer(transaction).data, status=status.HTTP_200_OK)
        except Transaction.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def return_stock(self, request):
        user = self.get_system_user()
        item_id = request.data.get('item_id')
        try:
            quantity = int(request.data.get('quantity', 0))
        except (ValueError, TypeError):
            quantity = 0

        if not item_id or quantity <= 0:
            return Response({'error': 'Invalid item or quantity'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from django.db import transaction as db_transaction
            item_total = ItemTotal.objects.get(pk=item_id)

            # Compute how many units are currently issued (active outgoing transactions)
            currently_issued = sum(t.quantity for t in item_total.transaction_set.filter(status='active'))
            if quantity > currently_issued:
                return Response(
                    {'error': f'Cannot return {quantity}. Only {currently_issued} unit(s) are currently issued.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            returned = []
            remaining = quantity

            with db_transaction.atomic():
                # Walk active transactions oldest-first, mark them returned
                for txn in item_total.transaction_set.filter(status='active').order_by('issued_date'):
                    if remaining <= 0:
                        break

                    if txn.quantity <= remaining:
                        # Return the whole transaction
                        remaining -= txn.quantity
                        txn.status = 'returned'
                        txn.actual_return_date = timezone.now().date()
                        txn.save()
                        returned.append(TransactionSerializer(txn).data)
                    else:
                        # Partial return: shrink the active transaction, create a returned record
                        items_to_return = list(txn.allocated_items.all()[:remaining])
                        
                        txn.quantity -= remaining
                        txn.save()
                        txn.allocated_items.remove(*items_to_return)
                        
                        new_txn = Transaction.objects.create(
                            item=item_total,
                            from_user=txn.from_user,
                            to_user_id=txn.to_user_id,
                            created_by=user,
                            quantity=remaining,
                            transaction_type='R',
                            issued_date=txn.issued_date,
                            actual_return_date=timezone.now().date(),
                            status='returned',
                            user_type=txn.user_type
                        )
                        new_txn.allocated_items.set(items_to_return)
                        returned.append(TransactionSerializer(new_txn).data)
                        remaining = 0

            return Response({'returned': returned}, status=status.HTTP_200_OK)
        except ItemTotal.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TransactionLogViewSet(viewsets.ModelViewSet):
    queryset = TransactionLog.objects.all()
    serializer_class = TransactionLogSerializer

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    
    def list(self, request, *args, **kwargs):
        from django.utils import timezone
        today = timezone.now().date()
        Booking.objects.filter(status='active', to_date__lt=today).update(status='released')
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        from django.db import transaction as db_transaction
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        item_total = serializer.validated_data.get('item')
        quantity = serializer.validated_data.get('quantity')
        from_date = serializer.validated_data.get('from_date')
        to_date = serializer.validated_data.get('to_date')
        
        try:
            with db_transaction.atomic():
                allocated = get_available_items_for_allocation(item_total, quantity, from_date, to_date)
                if not allocated:
                    db_transaction.set_rollback(True)
                    return Response({'error': f'Not enough unallocated instances of {item_total.item_name} for the selected dates.'}, status=status.HTTP_400_BAD_REQUEST)
                
                booking = serializer.save()
                booking.allocated_items.set(allocated)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self):
        queryset = super().get_queryset()
        item_id = self.request.query_params.get('item', None)
        if item_id is not None:
            queryset = queryset.filter(item_id=item_id)
        return queryset

    @action(detail=True, methods=['post'])
    def release(self, request, pk=None):
        try:
            booking = self.get_object()
            if booking.status == 'active':
                booking.status = 'released'
                booking.save()
            return Response(self.get_serializer(booking).data, status=status.HTTP_200_OK)
        except Booking.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

from rest_framework.decorators import api_view

@api_view(['GET'])
def trace_items_list(request):
    items = Item.objects.all()
    data = []
    for item in items:
        data.append({
            'item_id': item.item_id,
            'item_name': item.item_name,
            'category': item.category
        })
    return Response(data)

@api_view(['GET'])
def trace_item_detail(request, item_id):
    try:
        single_item = Item.objects.get(pk=item_id)
        item = ItemTotal.objects.get(item_name__iexact=single_item.item_name)
    except Item.DoesNotExist:
        return Response({'error': 'Item not found in items table'}, status=404)
    except ItemTotal.DoesNotExist:
        return Response({'error': 'Item totals not found'}, status=404)
        
    transactions = single_item.transactions.all()
    bookings = single_item.bookings.all()
    
    data = []
    for txn in transactions:
        req_by = txn.user_type.capitalize()
        if txn.to_user_id:
            try:
                user = User.objects.get(pk=txn.to_user_id)
                req_by = f"{user.name} ({txn.user_type.capitalize()})"
            except:
                req_by = f"{txn.to_user_id} ({txn.user_type.capitalize()})"
                
        data.append({
            'timeline_type': 'request',
            'id': txn.transaction_id,
            'item_name': item.item_name,
            'requested_by': req_by,
            'issued_date': txn.issued_date,
            'expected_return_date': txn.expected_return_date,
            'actual_return_date': txn.actual_return_date,
            'status': txn.status,
            'quantity': txn.quantity,
            'date_for_sort': txn.issued_date
        })
        
    for b in bookings:
        data.append({
            'timeline_type': 'booking',
            'id': b.booking_id,
            'item_name': item.item_name,
            'booked_date': b.from_date,
            'release_date': b.to_date,
            'event_name': b.event_name,
            'status': b.status,
            'quantity': b.quantity,
            'date_for_sort': b.from_date
        })
        
    data.sort(key=lambda x: x['date_for_sort'], reverse=True)
        
    return Response({
        'item_name': item.item_name,
        'timeline': data
    })

