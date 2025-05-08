from rest_framework import serializers
from .models import Transactions
from .models import TransactionCompanies

class TransactionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transactions
        fields = '__all__'
        
class TransactionCompaniesSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionCompanies
        fields = '__all__'