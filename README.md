# Blog Platform | Angular + Node.js

A full-stack blogging platform built with Angular frontend and Node.js backend, featuring real-time updates, role-based access control, and modern UI/UX.

## 🚀 Features

- **User Management**: Registration, login, role-based access control
- **Blog Posts**: Create, edit, delete, and publish blog posts
- **Real-time Comments**: Live comment updates using WebSockets
- **Responsive Design**: Modern Angular Material UI that works on all devices
- **Admin Dashboard**: Content moderation and user management
- **Search & Filtering**: Find posts by tags, authors, and content
- **AWS Integration**: File uploads and deployment ready

## 🏗️ Architecture

- **Frontend**: Angular 16 + Angular Material + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io for live updates
- **Authentication**: JWT-based with bcrypt password hashing
- **File Storage**: AWS S3 integration
- **Deployment**: AWS EC2 + CI/CD pipeline ready

## 📁 Project Structure

```
blog-platform/
├── backend/          # Node.js API server
├── frontend/         # Angular application
├── shared/           # Common types and utilities
├── docs/            # API documentation
├── scripts/         # CI/CD and testing scripts
└── README.md        # This file
```

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- Socket.io
- AWS SDK
- Jest Testing

### Frontend
- Angular 16
- Angular Material
- TypeScript
- RxJS
- Socket.io Client
- Responsive Design

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Angular CLI 16+

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
ng serve
```

## 📚 API Documentation

Comprehensive API documentation available in `/docs` folder with:
- Endpoint specifications
- Authentication flows
- WebSocket events
- Error handling

## 🔒 Security Features

- JWT token authentication
- Role-based access control
- Rate limiting
- Input validation
- CORS protection
- Helmet security headers

## 🧪 Testing

- Backend: Jest + Supertest
- Frontend: Jasmine + Karma
- E2E: Protractor (configurable)

## 🚀 Deployment

Ready for deployment on:
- AWS EC2 + S3
- Docker containers
- Heroku
- Vercel (frontend)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ using Cursor AI assistance for continuous code quality improvement and refactoring.
