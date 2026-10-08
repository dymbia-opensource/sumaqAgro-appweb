const fs = require('fs');
const dbPath = 'server/db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db['profiles'] = [
  {
    "id": 1,
    "fullName": "Guillermo",
    "email": "guillermo@sumaqagro.com",
    "phone": "+51 987654321",
    "preferredLanguage": "es",
    "isActive": true,
    "createdAt": "2026-01-10T10:00:00Z",
    "updatedAt": "2026-09-01T15:30:00Z"
  },
  {
    "id": 2,
    "fullName": "Dr. Juan Perez (Agronomo)",
    "email": "juan.perez@sumaqagro.com",
    "phone": "+51 911222333",
    "preferredLanguage": "es",
    "isActive": true,
    "createdAt": "2026-02-15T09:00:00Z",
    "updatedAt": "2026-08-20T11:00:00Z"
  }
];

db['cooperatives'] = [
  {
    "id": 1,
    "name": "Cooperativa Agraria Valles del Sur",
    "registrationNumber": "20512345678",
    "region": "Arequipa",
    "description": "Asociacion de productores de papa y quinua de la region sur.",
    "foundedDate": "2015-05-12T00:00:00Z"
  }
];

db['cooperative-members'] = [
  {
    "id": 1,
    "cooperativeId": 1,
    "profileId": 1,
    "joinedAt": "2026-03-01T10:00:00Z",
    "isActive": true,
    "role": "MEMBER"
  }
];

db['agronomist-assignments'] = [
  {
    "id": 1,
    "agronomistId": 2,
    "plotId": 1,
    "producerId": 1,
    "assignedAt": "2026-04-10T08:00:00Z",
    "isActive": true
  }
];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
