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
<<<<<<< HEAD
=======

cd frontend/
npm install
>>>>>>> 64de444 (Sort of working frontend)
```


### Run Locally
```
<<<<<<< HEAD

=======
cd frontend/
npm run start
```

If it's already in use, try
```
lsof -i :3000
kill -9 <PID>
>>>>>>> 64de444 (Sort of working frontend)
```