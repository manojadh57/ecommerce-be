# Ecommerce Customer Backend

A simple Express & MongoDB backend powering the **customer** side of an e-commerce app.  
Handles user signup/login/verification, lets anyone browse products & categories, and lets logged-in customers place and view their orders.

---

##  Features

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



npm install
# or
yarn install
