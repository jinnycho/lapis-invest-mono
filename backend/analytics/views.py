import requests
import time
import json
import os
import yfinance as yf
import pandas as pd
import math
from datetime import datetime, timedelta
from pytz import timezone
from django.utils import timezone as tz
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Transactions
from .models import TransactionCompanies
from .serializers import TransactionsSerializer
from django.http import JsonResponse
from django.db.models import Max
from django.core.exceptions import ObjectDoesNotExist
from dateutil.relativedelta import relativedelta
from django.db import OperationalError, transaction
from google.oauth2 import service_account
from googleapiclient.discovery import build


sp_500 = {"MMM", "AOS", "ABT", "ABBV", "ACN", "ATVI", "ADM", "ADBE", "ADP", "AAP", "AES", "AFL", "A", "APD", "AKAM", "ALK", "ALB", "ARE", "ALGN", "ALLE", "LNT", "ALL", "GOOGL", "GOOG", "MO", "AMZN", "AMCR", "AMD", "AEE", "AAL", "AEP", "AXP", "AIG", "AMT", "AWK", "AMP", "ABC", "AME", "AMGN", "APH", "ADI", "ANSS", "AON", "APA", "AAPL", "AMAT", "APTV", "ANET", "AJG", "AIZ", "T", "ATO", "ADSK", "AZO", "AVB", "AVY", "BKR", "BALL", "BAC", "BBWI", "BAX", "BDX", "WRB", "BRK.B", "BBY", "BIO", "TECH", "BIIB", "BLK", "BK", "BA", "BKNG", "BWA", "BXP", "BSX", "BMY", "AVGO", "BR", "BRO", "BF.B", "CHRW", "CDNS", "CZR", "CPT", "CPB", "COF", "CAH", "KMX", "CCL", "CARR", "CTLT", "CAT", "CBOE", "CBRE", "CDW", "CE", "CNC", "CNP", "CDAY", "ORCL", "CERN", "CF", "CRL", "SCHW", "CHTR", "CVX", "CMG", "CB", "CHD", "CI", "CINF", "CTAS", "CSCO", "C", "CFG", "CTXS", "CLX", "CME", "CMS", "KO", "CTSH", "CL", "CMCSA", "CMA", "CAG", "COP", "ED", "STZ", "CEG", "COO", "CPRT", "GLW", "CTVA", "CSGP", "COST", "CTRA", "CCI", "CSX", "CMI", "CVS", "DHI", "DHR", "DRI", "DVA", "DE", "DAL", "XRAY", "DVN", "DXCM", "FANG", "DLR", "DFS", "DISH", "DIS", "DG", "DLTR", "D", "DPZ", "DOV", "DOW", "DTE", "DUK", "DD", "DXC", "EMN", "ETN", "EBAY", "ECL", "EIX", "EW", "EA", "ELV", "LLY", "EMR", "ENPH", "ETR", "EOG", "EPAM", "EFX", "EQIX", "EQR", "ESS", "EL", "ETSY", "RE", "EVRG", "ES", "EXC", "EXPE", "EXPD", "EXR", "XOM", "FFIV", "FDS", "FAST", "FRT", "FDX", "FITB", "FRC", "FE", "FIS", "FISV", "FLT", "FMC", "F", "FTNT", "FTV", "FBHS", "FOXA", "FOX", "BEN", "FCX", "GRMN", "IT", "GNRC", "GD", "GE", "GIS", "GM", "GPC", "GILD", "GL", "GPN", "GS", "GWW", "HAL", "HIG", "HAS", "HCA", "PEAK", "HSIC", "HSY", "HES", "HPE", "HLT", "HOLX", "HD", "HON", "HRL", "HST", "HWM", "HPQ", "HUM", "HII", "HBAN", "IEX", "IDXX", "ITW", "ILMN", "INCY", "IR", "INTC", "ICE", "IBM", "IP", "IPG", "IFF", "INTU", "ISRG", "IVZ", "IPGP", "IQV", "IRM", "JBHT", "JKHY", "J", "JNJ", "JCI", "JPM", "JNPR", "K", "KEY", "KEYS", "KMB", "KIM", "KMI", "KLAC", "KHC", "KR", "LHX", "LH", "LRCX", "LW", "LVS", "LDOS", "LEN", "LNC", "LIN", "LYV", "LKQ", "LMT", "L", "LOW", "LUMN", "LYB", "MTB", "MRO", "MPC", "MKTX", "MAR", "MMC", "MLM", "MAS", "MA", "MTCH", "MKC", "MCD", "MCK", "MDT", "MRK", "META", "MET", "MTD", "MGM", "MCHP", "MU", "MSFT", "MAA", "MRNA", "MHK", "MOH", "TAP", "MDLZ", "MPWR", "MNST", "MCO", "MS", "MOS", "MSI", "MSCI", "NDAQ", "NTAP", "NFLX", "NWL", "NEM", "NWSA", "NWS", "NEE", "NKE", "NI", "NDSN", "NSC", "NTRS", "NOC", "NCLH", "NRG", "NUE", "NVDA", "NVR", "NXPI", "ORLY", "OXY", "ODFL", "OMC", "ON", "OKE", "ORCL", "OGN", "OTIS", "PCAR", "PKG", "PARA", "PH", "PAYX", "PAYC", "PYPL", "PNR", "PEP", "PKI", "PFE", "PM", "PSX", "PNW", "PXD", "PNC", "POOL", "PPG", "PPL", "PFG", "PG", "PGR", "PLD", "PRU", "PEG", "PTC", "PSA", "PHM", "QRVO", "PWR", "QCOM", "DGX", "RL", "RJF", "RTX", "O", "REG", "REGN", "RF", "RSG", "RMD", "RHI", "ROK", "ROL", "ROP", "ROST", "RCL", "SPGI", "CRM", "SBAC", "SLB", "STX", "SEE", "SRE", "NOW", "SHW", "SBNY", "SPG", "SWKS", "SJM", "SNA", "SEDG", "SO", "LUV", "SWK", "SBUX", "STT", "STLD", "STE", "SYK", "SIVB", "SYF", "SNPS", "SYY", "TMUS", "TROW", "TTWO", "TPR", "TRGP", "TGT", "TEL", "TDY", "TFX", "TER", "TSLA", "TXN", "TXT", "TMO", "TJX", "TSCO", "TT", "TDG", "TRV", "TRMB", "TFC", "TYL", "TSN", "USB", "UDR", "ULTA", "UAA", "UA", "UNP", "UAL", "UPS", "URI", "UNH", "UHS", "VLO", "VTR", "VRSN", "VRSK", "VZ", "VRTX", "VFC", "VTRS", "VICI", "V", "VMC", "WAB", "WMT", "WBA", "WBD", "WM", "WAT", "WEC", "WFC", "WELL", "WST", "WDC", "WRK", "WY", "WHR", "WMB", "WTW", "GWW", "WYNN", "XEL", "XYL", "YUM", "ZBRA", "ZBH", "ZION", "ZTS"}

etf = {"VOO", "VTI", "SPLG", "FBTC", "SPY", "AGG"}


# """
# http://localhost:8000/api/add_transactions/?action=buy&ticker=BA&amount=5&price=200&fee=1&transaction_time=2024-03-02
# http://localhost:8000/api/add_transactions/?action=sell&ticker=BA&amount=5&price=200&fee=1
# """
# @api_view(["PUT"])
# def add_transactions(request):
#     action = request.GET.get('action')
#     amount = request.GET.get('amount')
#     price = request.GET.get('price')
#     ticker = request.GET.get('ticker')
#     fee = request.GET.get('fee')
#     transaction_time_str = request.GET.get('transaction_time')

#     if not ticker:
#         return Response("Need to have a ticker", status=status.HTTP_400_BAD_REQUEST)
#     if not amount:
#         return Response("Need to have an amount", status=status.HTTP_400_BAD_REQUEST)
#     if not action:
#         return Response("Need to have an action: buy or sell", status=status.HTTP_400_BAD_REQUEST)
#     if not price:
#         return Response("Need to have a price", status=status.HTTP_400_BAD_REQUEST)
#     if not fee:
#         fee = 0.0
#     if not transaction_time_str:
#         transaction_time = datetime.now(timezone('America/New_York'))
#     if transaction_time_str:
#         transaction_time = datetime.strptime(transaction_time_str, '%Y-%m-%d')
#         transaction_time = transaction_time.astimezone(timezone('America/New_York'))

#     yfinance_info = yf.Ticker(ticker).info
#     try:
#         latest_transaction_id = Transactions.objects.latest('transaction_id').transaction_id
#     except ObjectDoesNotExist:
#         latest_transaction_id = 0
#     new_transaction_id = latest_transaction_id + 1
#     try:
#         if (action == 'buy'):
#             Transactions.objects.create(
#                 transaction_id = new_transaction_id,
#                 user_id = 0,
#                 ticker = ticker,
#                 last_updated = datetime.now(timezone('America/New_York')),
#                 transaction_date = transaction_time,
#                 transaction_type = 'buy',
#                 transaction_price = price,
#                 transaction_quantity = quantity,
#                 fee = fee,
#                 future = '',
#                 strategy = ''
#             )
#             return Response("Transaction record created or updated (buy)", status=status.HTTP_201_CREATED)
#         else: # means I sold
#             Transactions.objects.create(
#                 transaction_id = new_transaction_id,
#                 user_id = 0,
#                 ticker = ticker,
#                 last_updated = datetime.now(timezone('America/New_York')),
#                 transaction_date = transaction_time,
#                 transaction_type = 'sell',
#                 transaction_price = price,
#                 transaction_amount = amount,
#                 fee = fee,
#                 future = '',
#                 strategy = ''
#             )
#             return Response("Transaction record created or updated (sell)", status=status.HTTP_201_CREATED)
#     except yf.exceptions.YFinanceException as e:
#         print(f"Failed to fetch data for {ticker}: {str(e)}")
#     except TypeError as e:
#         print(f"TypeError occurred {ticker}: {str(e)}")

"""
http://localhost:8000/api/get_transactions/
"""
@api_view(["GET"])
def get_transactions(request):
    all_transactions = Transactions.objects.all().order_by('ticker')

    grouped_transactions = {}
    for transaction in all_transactions:
        ticker = transaction.ticker
        if ticker not in grouped_transactions:
            grouped_transactions[ticker] = []
        grouped_transactions[ticker].append(TransactionsSerializer(transaction).data)

    return Response(grouped_transactions)

"""
http://localhost:8000/api/delete_transaction/?transaction_id=1
"""
@api_view(["DELETE"])
def delete_transaction(request):
    transaction_id = request.GET.get('transaction_id')
    try:
        purchase_to_delete = Transactions.objects.get(transaction_id=transaction_id)
    except Transactions.DoesNotExist:
        return Response("Transaction not found", status=status.HTTP_404_NOT_FOUND)

    purchase_to_delete.delete()

    return Response("Transaction deleted from your list", status=status.HTTP_200_OK)

"""
http://localhost:8000/api/update_transactions_companies/
"""
@api_view(["PUT"])
def update_transactions_companies(request):
    transaction_tickers = Transactions.objects.values_list('ticker', flat=True).distinct()
    
    for ticker in transaction_tickers:
        if (ticker in etf):
            # Get ETF data from Google spreadsheet
            spreadsheet_id = '173xI-YzX38cHnaPCjducYoFiAWac0mtqQabp9b2HXj8'
            range='basic!A2:F6000'
            current_directory = os.path.dirname(os.path.realpath(__file__))
            key_file_path = os.path.join(current_directory, "key.json")
            credentials = service_account.Credentials.from_service_account_file(key_file_path, scopes=["https://www.googleapis.com/auth/spreadsheets"])
            service = build("sheets", "v4", credentials=credentials)
            sheet = service.spreadsheets()
            result = (
                sheet.values()
                .get(spreadsheetId=spreadsheet_id, range=range)
                .execute()
            )
            values = result.get("values", [])
            for item in values:
                if item[0] == ticker:
                    current_price = item[1]
                    break
            if current_price:
                obj, created = TransactionCompanies.objects.update_or_create(
                    user_id=0,
                    ticker=ticker,
                    defaults={
                        'current_price': current_price,
                        'company_name': ticker,
                        'is_sp500': False,
                    }
                )
            else:
                print(f"ETF Ticker {ticker} not found in values.")

        else:
            try:
                yfinance_info = yf.Ticker(ticker).info
                max_retries = 3
                retry_count = 0
                while retry_count < max_retries:
                    try:
                        obj, created = TransactionCompanies.objects.update_or_create(
                            user_id=0,
                            ticker=ticker,
                            defaults={
                                'current_price': yfinance_info.get('currentPrice'),
                                'company_name': yfinance_info.get('longName'),
                                'is_sp500': ticker in sp_500,
                            }
                        )
                        break
                    except OperationalError as e:
                        if 'database is locked' in str(e):
                            retry_count += 1
                            time.sleep(1)  # Wait for 1 second before retrying
                        else:
                            raise
            except Exception as e:
                print(f"Error updating transaction companies data for {ticker} in yfinance: {e}")
    return Response("Transaction companies record created or updated", status=status.HTTP_201_CREATED)

"""
http://localhost:8000/api/bulk_add_transactions/
POST request with JSON body:
{
    "transactions": [
        {
            "ticker": "AAPL",
            "action": "buy",
            "amount": 10,
            "price": 150.0,
            "fee": 1.0,
            "date": "2023-01-15"
        },
        ...
    ]
}
"""
@api_view(["POST"])
def bulk_add_transactions(request):
    try:
        data = json.loads(request.body)
        transactions_data = data.get('transactions', [])
        
        if not transactions_data:
            return Response("No transactions provided", status=status.HTTP_400_BAD_REQUEST)
        
        success_count = 0
        error_count = 0
        errors = []
        
        with transaction.atomic():
            try:
                latest_transaction_id = Transactions.objects.latest('transaction_id').transaction_id
            except ObjectDoesNotExist:
                latest_transaction_id = 0
            
            new_transaction_id = latest_transaction_id + 1
            
            for idx, tx_data in enumerate(transactions_data):
                print(tx_data)
                try:
                    ticker = tx_data.get('ticker')
                    quantity = tx_data.get('quantity')
                    price = tx_data.get('price')
                    action = tx_data.get('action')
                    fee = tx_data.get('fee', 0.0)
                    date_str = tx_data.get('date')
                    amount = tx_data.get('amount')
                    
                    # Parse date
                    if date_str:
                        try:
                            transaction_time = datetime.strptime(date_str, '%Y-%m-%d')
                            transaction_time = transaction_time.astimezone(timezone('America/New_York'))
                        except ValueError:
                            error_count += 1
                            errors.append(f"Invalid date format at index {idx}. Use YYYY-MM-DD")
                            continue
                    else:
                        transaction_time = datetime.now(timezone('America/New_York'))
                    
                    # Create transaction
                    Transactions.objects.create(
                        transaction_id=new_transaction_id + idx,
                        user_id=0,
                        ticker=ticker,
                        last_updated=datetime.now(timezone('America/New_York')),
                        transaction_date=transaction_time,
                        transaction_type=action,
                        transaction_price=float(price),
                        transaction_quantity=float(quantity),
                        amount = float(amount),
                        fee=float(fee),
                        future='',
                        strategy=''
                    )
                    success_count += 1
                    
                except Exception as e:
                    error_count += 1
                    errors.append(f"Error processing transaction at index {idx}: {str(e)}")
        
        result = {
            "success_count": success_count,
            "error_count": error_count,
            "errors": errors
        }
        
        if success_count > 0:
            return Response(result, status=status.HTTP_201_CREATED)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    except json.JSONDecodeError:
        return Response("Invalid JSON data", status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(f"Server error: {str(e)}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# TODO have delete transaction company
"""
http://localhost:8000/api/get_transaction_companies/
"""
@api_view(["GET"])
def get_transaction_companies(request):
    transaction_companies = TransactionCompanies.objects.all()
    companies_data = {
        company.ticker: {
            "current_price": company.current_price,
            "is_sp500": company.is_sp500,
            "company_name": company.company_name
        }
        for company in transaction_companies
    }

    return JsonResponse(companies_data)