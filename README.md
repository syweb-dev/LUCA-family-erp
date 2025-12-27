## Family Asset Lifecycle Management System (LUCA.NEX ERP)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Personal/Family Digital & Physical Asset Full Lifecycle Management System  
> Physical Asset Digitalization · Digital Asset Centralization · Intelligent Process Management · Family Information Sharing

## Previous events

This project will be maintained and developed long-term.

If you like it, please click the star!

My personal website: https://www.lucanex.top/

Some parts were developed and improved using AI, so I will make the code public.

Because I'm not very good at expressing myself, my readme was also created using AI.

## 📋 Project Overview

This is a family-oriented asset management platform that helps family members manage physical assets, digital subscriptions, warranty information, invoice archives, and more, achieving digitalization and intelligent management of family assets.

### Core Values

- **Physical Asset Digitalization**: Integrate electronic products, home appliances, and other physical assets into the system with automatic warranty countdown
- **Digital Asset Centralization**: Unified management of all subscriptions including video memberships, cloud services, insurance, etc., avoiding "silent charges"
- **Intelligent Process Management**: Automatic reminders for warranty expiration, renewal dates, and other critical milestones
- **Family Information Sharing**: Share Wi-Fi passwords, utility account information, and more among family members

## ✨ Key Features

### 1. Account & Family Management 👤

- **User Registration & Login**: Support for admin and regular member accounts
- **Family Creation**: Admins can create families and invite members
- **Member Management**: Admins can add or remove family members
- **Permission Control**: Distinguish between admin and regular member permissions

### 2. Warranty & Invoice Archive Management 📦

- **Asset Entry**: Record complete information including asset name, model, brand, purchase date, price, etc.
- **Invoice Management**: Support for invoice image links, cloud storage addresses, and other electronic vouchers
- **Warranty Tracking**: Automatically calculate warranty expiration date and remaining days
- **Warranty Types**: Support for standard warranty, extended warranty service, and lifetime warranty
- **Repair Records**: Continuously add maintenance history records
- **Warranty Alerts**: Automatic marking for expiring warranties (yellow warning within 7 days, red when expired)

### 3. Digital Subscription Control 💳

- **Subscription Registration**: Unified management of all subscriptions including video memberships, cloud services, insurance, etc.
- **Renewal Calendar**: Record renewal cycle (monthly/quarterly/yearly) and next payment date
- **Expense Analysis**:
  - Statistics by category
  - Monthly subscription fee total
  - High-amount subscription reminders
- **Auto-renewal Management**: Mark auto-renewal status to avoid unexpected charges

### 4. Resale Value Estimation ♻️

- **Value Assessment**: Quickly estimate second-hand prices for electronic products based on purchase time and usage condition
- **Condition Grading**: Brand new/99% new/95% new/Used/Repaired
- **Depreciation Calculation**:
  - Time depreciation: 3% linear depreciation per month, minimum 10% retained
  - Condition factor: Adjust residual value based on usage status
- **Extensibility**: Can integrate with second-hand platform APIs for real-time transaction prices

### 5. Family Sharing Hub 👨‍👩‍👧‍👦

- **Information Types**: Wi-Fi passwords, utility accounts, device maintenance cycles, etc.
- **Role Permissions**: Set different editing permissions for different roles
- **Content Sharing**: Family members can view and maintain shared information uniformly
- **Notes**: Support for detailed usage instructions and precautions

### 6. Unified Reminder Center ⏰

- **Warranty Reminders**: Warranties expiring within the next 30 days
- **Subscription Renewal Reminders**: Subscription renewal dates within the next 30 days
- **Risk Assessment**:
  - Automatically calculate family risk exposure index
  - Comprehensive consideration of expiring warranties and high-value subscriptions
  - Risk levels: Low/Medium/High

## 🛠 Tech Stack

### Frontend
- **HTML5**: Modern semantic markup
- **Vanilla JavaScript (ES6+)**: Modular development with no framework dependencies
- **CSS3**: Modern UI design with responsive layout
- **Vite 5.0**: Fast development server and build tool

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Lightweight web framework
- **JWT (jsonwebtoken)**: User authentication and authorization
- **bcryptjs**: Password encryption
- **CORS**: Cross-Origin Resource Sharing

### Data Storage
- **JSON File Storage**: Currently using file system for data storage (can be extended to database)
- Account data: `server/auth-data.json`
- Business data: In-memory storage (resets on server restart)

## 📦 Installation & Running

### Requirements

- Node.js >= 14.0
- npm >= 6.0

### Install Dependencies

```bash
npm install
```

### Development Mode

You need to start both the frontend dev server and backend API server:

**Option 1: Start Separately (Recommended)**

```bash
# Terminal 1 - Start backend API server (port 3000)
npm run server

# Terminal 2 - Start frontend dev server (port 5173)
npm run dev
```

**Option 2: Start Individually**

```bash
# Backend only
npm run server

# Frontend only
npm run dev
```

Access: http://localhost:5173

### Production Build

```bash
# Build frontend static files
npm run build

# Preview build result
npm run preview
```

## 📁 Project Structure

```
ERP/
├── server/                 # Backend server
│   ├── auth.js            # User authentication & family management module
│   ├── auth-data.json     # User and family data (generated at runtime)
│   └── server.js          # Express server main file
├── src/                   # Frontend source code
│   └── main.js           # Frontend main logic file
├── index.html            # Main page
├── 404.html              # 404 page
├── package.json          # Project dependencies configuration
├── vite.config.mjs       # Vite configuration file
└── README.md             # Project documentation
```

### 🚀 Quick Start

### 1. Install Dependencies

Before running the application, install all required dependencies:

```bash
npm install
```

### 2. Start the Application

Start both the backend and frontend servers:

```bash
# Terminal 1 - Start backend API server
npm run server

# Terminal 2 - Start frontend dev server
npm run dev
```

Then open your browser and visit: http://localhost:5173

### 3. Create Family Admin Account

For first-time use, click the "Account & Family" module:

1. Enter admin email and password
2. Enter family name (e.g., Wang Family, LUCA Family)
3. Click "Create Family and Register Admin"

### 4. Add Assets

Switch to the "Warranty & Invoice Archive" module:

1. Fill in basic asset information (name, model, brand, etc.)
2. Enter purchase date and price
3. Enter warranty period and type
4. (Optional) Add invoice link and manual link
5. Click "Save Asset Archive"

### 5. Add Subscriptions

Switch to the "Digital Subscription Control" module:

1. Enter subscription name, provider, and category
2. Select renewal cycle (monthly/quarterly/yearly)
3. Enter next payment date and amount
4. Select whether auto-renewal is enabled
5. Click "Save Subscription"

### 6. View Reminders

Switch to the "Unified Reminder Center" module:

- Automatically displays warranty expiration and subscription renewal reminders for the next 30 days
- Check the "Today's Family Risk Exposure" indicator in the upper right corner

## 🔐 Security Notes

### Current Implementation
- JWT Token authentication
- bcrypt password encryption (10 rounds of salt)
- Token validity: 7 days

### Production Environment Recommendations
1. **Change JWT Secret**: Set `JWT_SECRET` in environment variables
2. **Use HTTPS**: Enable SSL/TLS when deploying
3. **Database Migration**: Migrate from JSON file storage to PostgreSQL/MySQL/MongoDB
4. **Environment Variables**: Manage sensitive configurations using `.env` files
5. **Input Validation**: Add stricter input validation and sanitization
6. **Audit Logging**: Add operation logs and audit trails

## 🔧 Feature Extension Suggestions

### Short-term Extensions
- [ ] OCR invoice recognition auto-fill
- [ ] Image upload and cloud storage integration
- [ ] Export functionality (Excel/PDF)
- [ ] Data backup and recovery
- [ ] Mobile responsive optimization

### Mid-term Extensions
- [ ] Integrate second-hand platform APIs (Xianyu, Zhuanzhuan)
- [ ] WeChat/Email reminder integration
- [ ] Asset depreciation trend charts
- [ ] Subscription usage frequency analysis
- [ ] Family member expense analysis

### Long-term Extensions
- [ ] Mobile App (React Native/Flutter)
- [ ] Smart Assistant (AI subscription optimization suggestions)
- [ ] Financial planning and budget management
- [ ] Family asset overview dashboard
- [ ] Smart home device integration

## 🐛 Known Limitations

1. **Data Persistence**: Currently, except for account data, other data is stored in memory and will be lost after server restart
2. **Concurrency Support**: Database-level concurrency control not implemented
3. **File Upload**: Direct image/file upload not supported, external links required
4. **Mobile**: Navigation bar is hidden on small screen devices (@media breakpoint: 768px)

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register admin or member
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user information

### Family Management
- `GET /api/families/me` - Get current family and members
- `POST /api/families/:id/members` - Add member (admin only)
- `DELETE /api/families/:id/members/:userId` - Remove member (admin only)

### Asset Management
- `POST /api/assets` - Create asset
- `GET /api/assets` - Get all assets
- `GET /api/assets/:id` - Get single asset details
- `POST /api/assets/:id/repairs` - Add repair record
- `GET /api/assets/:id/resale-value` - Estimate resale value

### Subscription Management
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions` - Get all subscriptions
- `GET /api/subscriptions/summary` - Get subscription statistics and suggestions

### Family Sharing
- `POST /api/family/items` - Add shared information
- `GET /api/family/items` - Get all shared information

### Reminder Center
- `GET /api/reminders/upcoming` - Get reminders for the next 30 days

## 📄 License

MIT License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📧 Contact

For questions or suggestions, please provide feedback through Issues.

---

**Last Updated**: December 28, 2025
