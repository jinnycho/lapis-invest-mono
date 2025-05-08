from django.db import models

# Create your models here.
from django.db import models
from django.db.models import JSONField
from django.db.models.functions import Now

class Transactions(models.Model):
    transaction_id = models.AutoField(primary_key=True)
    user_id = models.BigIntegerField()
    ticker = models.CharField(max_length=100)
    last_updated = models.DateTimeField(db_default=Now())
    transaction_date = models.DateTimeField(db_default=Now())
    transaction_type = models.CharField(max_length=200)
    transaction_price = models.FloatField(default=0.0)
    transaction_quantity = models.FloatField(default=0.0)
    amount = models.FloatField(default=0.0)
    fee = models.FloatField(default=0.0)
    future = models.CharField(max_length=1000)
    strategy = models.CharField(max_length=200)
    
    class Meta:
        indexes = [
            models.Index(fields=['ticker', 'transaction_id'])
    ]

class TransactionCompanies(models.Model):
    user_id = models.BigIntegerField()
    ticker = models.CharField(max_length=100)
    company_name = models.CharField(max_length=200)
    is_sp500 = models.BooleanField(default=False)
    current_price = models.FloatField(default=0.0)
    
    class Meta:
        indexes = [
            models.Index(fields=['ticker', 'user_id'])
    ]