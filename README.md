# ☀️ SunSafe

An AI-powered web application that provides personalized sunscreen recommendations based on live weather conditions, UV index, and user-specific skin information. The application combines weather intelligence, machine learning, and geolocation to help users make informed sun protection decisions.

---

## Overview

SunSafe was built to simplify sunscreen selection by combining environmental conditions with personal skin characteristics. Instead of recommending products based on SPF alone, the application considers multiple real-world factors such as UV intensity, weather conditions, skin type, outdoor exposure, and user preferences.

The application automatically detects the user's location, retrieves current weather information, predicts suitable sunscreen recommendations using a trained machine learning model, and stores previous recommendations for history and analytics.

---

## Features

- 📍 Automatic location detection
- 🌤️ Live weather and UV data
- 🤖 Machine learning based sunscreen recommendations
- 👤 Personalized recommendations using user profile
- 🗺️ Interactive map with UV coverage
- 📊 Analytics dashboard
- 🕒 Recommendation history
- ⚡ Weather caching for faster performance
- 📱 Responsive user interface

---

## Tech Stack

### Frontend

- React
- React Router
- Tailwind CSS
- React Leaflet
- Axios
- Chart.js

### Backend

- FastAPI
- Python
- Motor (Async MongoDB Driver)
- Pydantic
- Uvicorn

### Database

- MongoDB

### Machine Learning

- Scikit-learn
- Pandas
- NumPy

---

## Project Structure

```
SunSafe
│
├── backend
│   ├── server.py
│   ├── ml_model.py
│   ├── weather_service.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── craco.config.js
│
└── README.md
```

---

## Workflow

1. User allows location access.
2. Frontend fetches current coordinates.
3. Backend retrieves live weather information.
4. The machine learning model evaluates weather and user profile.
5. Personalized sunscreen recommendations are generated.
6. Recommendations are stored in MongoDB.
7. History and analytics are updated automatically.

---

## Installation

### Clone the repository

```bash
git clone https://github.com/yourusername/sunsafe.git
cd sunsafe
```

### Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn server:app --reload
```

### Frontend

```bash
cd frontend

yarn install

yarn start
```

---

## Environment Variables

Create a `.env` file inside the backend folder.

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=sunsafe_db
CORS_ORIGINS=*
```

---



## Future Improvements

- User authentication
- Product comparison
- Dermatologist recommendations
- Mobile application
- Push notifications for high UV alerts
- Recommendation confidence scores

---

## Learning Outcomes

Building SunSafe helped me gain practical experience with:

- Full-stack application development
- FastAPI REST APIs
- MongoDB integration
- Machine learning model deployment
- React state management
- Geolocation APIs
- Weather API integration
- Interactive maps using Leaflet

---

## Author

**Yogznsamz**

Computer Engineering Undergraduate

Passionate about Full Stack Development, AI, and building applications that solve real-world problems.