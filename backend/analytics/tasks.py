# import requests
# from django.conf import settings
# from .models import MyStocks
# from .models import UpcomingEarnings
# from .models import MarketData
# from .models import MarketDataHistorical
# from pytz import timezone
# from datetime import datetime, timedelta
# import time

# def refresh_add_market_data_historical_upcoming():
#     response = requests.put('http://localhost:8000/api/add_market_data_historical_upcoming/')
#     if response.status_code == 200:
#         print('Market data historical and upcoming earnings refreshed successfully.')
#     else:
#         print(f'Failed to refresh market data historical and upcoming earnings. Status code: {response.status_code}')

# def refresh_earnings():
#     first_upcoming_earnings = UpcomingEarnings.objects.first()

#     if (first_upcoming_earnings):
#         last_updated_time = first_upcoming_earnings.last_updated
#         last_run_time_est = last_updated_time.astimezone(timezone('America/New_York'))

#         current_time_est = datetime.now(timezone('America/New_York'))
#         midnight_today_est = current_time_est.replace(hour=0, minute=0, second=0, microsecond=0)

#         if (last_run_time_est < midnight_today_est):
#             response = requests.put('http://localhost:8000/api/add_earnings/')
#             if response.status_code == 200:
#                 print('Earnings refreshed successfully.')
#             else:
#                 print(f'Failed to refresh earnings. Status code: {response.status_code}')
#     else:
#         # it means there's no record in the DB
#         response = requests.put('http://localhost:8000/api/add_earnings/')
            
# def refresh_my_stocks():
#     tracked_stocks = MyStocks.objects.all()
#     for stock in tracked_stocks:
#         response = requests.put(f'http://localhost:8000/api/add_stock_to_mylist/?ticker={stock.ticker}/')

# def refresh_marketdata():
#     least_recently_updated = MarketData.objects.order_by('last_updated').first()

#     if least_recently_updated:
#         current_time_est = datetime.now(timezone('America/New_York'))
#         least_recently_updated_time_est = least_recently_updated.last_updated.astimezone(timezone('America/New_York'))

#         # Check if the least recently updated object is from before today
#         if least_recently_updated_time_est.date() < current_time_est.date():
#             # Make a request to the batch update endpoint
#             response = requests.put('http://localhost:8000/api/add_market_data_batch/')

#             if response.status_code == 200:
#                 print('Batch update of market data completed successfully.')
#             else:
#                 print('Failed to update market data in batch.')
#         else:
#             print('Market data is already up to date.')
#     else:
#         print('No market data found.')

# def update_shortdata():
#     least_recently_updated_short_data = MarketDataHistorical.objects.filter(is_short=True).order_by('last_updated').first()
#     if (least_recently_updated_short_data):
#         current_time_est = datetime.now(timezone('America/New_York'))
#         least_recently_updated_short_data_time_est = least_recently_updated_short_data.last_updated.astimezone(timezone('America/New_York'))

#         # Check if the least recently updated object is 7 days before today
#         if (least_recently_updated_short_data_time_est.date() < current_time_est.date() - timedelta(days=7)):
#             # Make a request to the batch update endpoint
#             response = requests.put('http://localhost:8000/api/add_short_to_market_data_historical/')

#             if response.status_code == 200:
#                 print('Batch update of short data completed successfully.')
#             else:
#                 print('Failed to update short data in batch.')
#         else:
#             print('Short data is already up to date.')