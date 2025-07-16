# Ecommerce Customer Backend
A simple Express & MongoDB backend powering the **customer** side of an e-commerce app.
Handles user signup, login, email verification, lets anyone browse products & categories, and---
## Table of Contents
- [Features](#features)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
 - [Authentication](#authentication)
 - [Products](#products)
 - [Categories](#categories)
 - [Orders](#orders)
- [Testing with REST Client](#testing-with-rest-client)
- [Project Structure](#project-structure)
- [License](#license)
---
## Features
- **User Authentication**
 - Sign up
 - Email verification
 - Login with JWT
- **Product Browsing**
 - `GET /products` – list all products
 - `GET /products/:id` – view single product details
- **Category Browsing**
 - `GET /categories` – list all product categories
- **Order Management**
 - `POST /orders` – place a new order (customer only)
 - `GET /orders` – view your own orders
---
## Quick Start
### 1. Clone the repo
```bash
git clone https://github.com/manojadh57/ecommerce-be.git
cd ecommerce-be
```
### 2. Install dependencies
```bash
npm install
# or
yarn install
```
### 3. Configure environment
Create a file named `.env` in the project root with these entries:
```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/yourDatabaseName
JWT_SECRET=your_jwt_secret_here
```
### 4. Start the server
```bash
npm run dev
# or
yarn dev
```
The API will be listening at:
```
http://localhost:8000/api/customer/v1
```
---
## Environment Variables
| Variable | Description |
| ----------- | ----------------------------------------- |
| `PORT` | Port on which the server runs (e.g. 8000) |
| `MONGO_URI` | MongoDB connection URI |
| `JWT_SECRET`| Secret key for signing JWTs |
---
## API Reference
> **Base URL:** `http://localhost:8000/api/customer/v1`
### Authentication
| Method | Endpoint | Body | ------ | --------------------- | ----------------------------------------------------------| POST | `/auth/signup` | `{ fName, lName, email, password }` | GET | `/auth/verify/:token` | — | POST | `/auth/login` | `{ email, password }` ### Products
| Method | Endpoint | Description |
| ------ | --------------- | -------------------------- |
| GET | `/products` | List all products |
| GET | `/products/:id` | Get details for one product|
### Categories
| Method | Endpoint | Description |
| ------ | -------------- | --------------------- |
| GET | `/categories` | List all categories |
### Orders
> **Requires** `Authorization: Bearer <accessToken>`
| Method | Endpoint | Body | ------ | ------------ | -------------------------------------------------------------------| POST | `/orders` | `{ products: [{ productId, quantity }], totalAmount }` 
| GET | `/orders` | — ---
## Testing with REST Client
1. Open `rest.http` in VS Code (requires the REST Client extension).
2. Update the `@rootUrl` at top to your base URL:
 ```
 @rootUrl = http://localhost:8000/api/customer/v1
 ```
3. Run each request block in order:
 - **Signup** → **Verify** → **Login** (copy the returned `accessToken`)
 - **GET /products**
 - **GET /categories**
 - **POST /orders** (with your token)
 - **GET /orders**
---
## Project Structure
```
ecommerce-be/
■■■ src/
■ ■■■ config/ # MongoDB connection & environment setup
■ ■■■ controllers/ # Route handler logic
■ ■■■ middleware/ # JWT auth middleware
■ ■■■ models/ # Mongoose schemas (User, Product, Category, Order)
■ ■■■ routes/ # Express routers
■■■ rest.http # Sample HTTP requests for testing
■■■ .env # Environment variables (not committed)
■■■ .gitignore
■■■ package.json
■■■ yarn.lock / package-lock.json
■■■ server.js # Application entry point
```
---
## License
This project is open-source under the MIT License.
Feel free to reuse, modify, and extend for your own learning or projects!
