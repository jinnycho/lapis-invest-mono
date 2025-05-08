## Lapis Invest Mono

This is a simplified version of Lapis Invest. I just want to track personal stock transaction history.

## Local Development

### Basic Installations
I use virutal environment for installations using venv.

```
python3 -m venv lapis-venv
source lapis-venv/bin/activate

pip install --upgrade pip
python3 -m pip install Django
pip install django djangorestframework django-cors-headers django-crontab
pip install urllib3==1.26.15
pip install yfinance
pip install google-api-python-client
pip install google-auth
pip install google-cloud

cd frontend/
npm install
```

### Run Locally
```
cd frontend/
npm run start

cd backend/
python manage.py runserver
```

If it's already in use, try
```
lsof -i :3000
kill -9 <PID>
```

## Backend Development
### Create Admin user
```
# Update the admin.py
python manage.py createsuperuser
```

### Admin access to the models
```
python manage.py runserver
# go to localhost:8000/admin
```

### Update your model
```
python manage.py makemigrations analytics
python manage.py migrate analytics
```

### Delete all in the model
```
Delete the db.sqlite3 file
Delete migrations/0001_initial.py...
python manage.py makemigrations
python manage.py migrate
Create the super user using $ python manage.py createsuperuser
```

## Development Info
### Related docs
- https://github.com/facebook/create-react-app
- https://medium.com/@codewithbushra/using-sqlite-as-a-database-backend-in-django-projects-code-with-bushra-d23e3100686e