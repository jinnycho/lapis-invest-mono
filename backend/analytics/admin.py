from django.contrib import admin

from .models import Transactions
from .models import TransactionCompanies

class TransactionsAdmin(admin.ModelAdmin):
    list_display = (
        'transaction_id',
        'user_id',
        'ticker',
        'last_updated',
        'transaction_date',
        'transaction_type',
        'transaction_price',
        'transaction_quantity',
        'amount',
        'fee',
        'future',
        'strategy'
    )

class TransactionCompaniesAdmin(admin.ModelAdmin):
    list_display = (
        'user_id',
        'ticker',
        'company_name',
        'is_sp500',
        'current_price'
    )

admin.site.register(Transactions, TransactionsAdmin)
admin.site.register(TransactionCompanies, TransactionCompaniesAdmin)