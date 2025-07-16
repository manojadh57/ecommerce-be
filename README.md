# Ecommerce Customer Backend

A simple Express & MongoDB backend for the **customer** side of an e-commerce application.  
Provides authentication, product/category browsing, and order placement for logged-in users.

---

## Features

- **User authentication**  
  - Sign up & email verification  
  - Login with JWT access tokens

- **Product browsing**  
  - List all products  
  - View single product by ID

- **Category browsing**  
  - List all categories

- **Order placement & history**  
  - Place new orders as a logged-in customer  
  - View your own orders  

---

## Getting Started

### Prerequisites

- Node.js ≥ 14  
- MongoDB (local or Atlas)  
- VS Code (with **REST Client** extension) or Postman  

### Installation

1. Clone the repo  
   ```bash
   git clone https://github.com/manojadh57/ecommerce-be.git
   cd ecommerce-be

  
Install dependencies

npm install
# or
yarn install


Create a .env file in the project root with these variables:

PORT=8000
MONGO_URI=mongodb://localhost:27017/yourDatabaseName
JWT_SECRET=your_jwt_secret_here


Start the server

npm run dev
# or
yarn dev
The API will be available at http://localhost:8000/api/customer/v1

API Endpoints
Base URL: http://localhost:8000/api/customer/v1

Authentication

Method	Path	Body / Query	Description
POST	/auth/signup	{ fName, lName, email, password }	Create account & send verification
GET	/auth/verify/:token	–	Verify email token
POST	/auth/login	{ email, password }	Login → returns { accessToken }



